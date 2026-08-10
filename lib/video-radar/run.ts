/**
 * The Radar run (spec §39–§43).
 *
 * One idempotent, failure-isolated pass over the whole pipeline. Three
 * properties matter more than anything else here:
 *
 * - **Idempotent.** Every write goes through a store upsert keyed on a
 *   deterministic constraint, so a duplicate invocation, a retry or a
 *   deployment restart mid-run cannot create a second video, transcript,
 *   analysis, pattern observation or opportunity (§40).
 * - **Failure-isolated.** Each item is processed inside its own try/catch. One
 *   dead video, missing transcript or model refusal is recorded and stepped
 *   over; it cannot take the run down (§41). A run that hits any failure ends
 *   `partial`, not `completed` — silently reporting success would be worse than
 *   the failure itself.
 * - **Cost-gated.** Discovery is cheap and wide; transcripts and the model only
 *   ever see what survived the quality gate (§28).
 *
 * There is no scheduler in this repository, so "weekly" is a cadence an
 * operator or a cron trigger supplies — see docs/video-radar.md.
 */

import { randomUUID } from "node:crypto";
import { computeBaseline, type BaselineCandidate } from "./baseline";
import { radarConfig } from "./config";
import {
  RADAR_VERSIONS,
  emptyRunCounters,
  type RadarCreator,
  type RadarErrorCode,
  type RadarRun,
  type RadarRunFailure,
  type RadarTopic,
  type RadarVideo,
  type RelevanceResult,
} from "./contracts";
import { computeEngagement, computeVelocity } from "./metrics";
import { computeOutlier } from "./outlier";
import { buildOpportunities, outlierSummaryFor, persistOpportunities } from "./opportunities";
import { recordPatternsFromAnalysis } from "./patterns";
import { radarProjects } from "./projects";
import { computeRelevance } from "./relevance";
import { applyQuota, computeCandidateScore, passesQualityGate } from "./score";
import { isComparableType } from "./videoType";
import type { RadarStore, ScoreRecord } from "./store/types";
import type { AnalysisProvider } from "./analysis/analyze";
import { ANALYSIS_PROMPT_VERSION, ANALYSIS_SCHEMA_VERSION } from "./analysis/analyze";
import type { ProviderVideo, TranscriptProvider, VideoProvider } from "./providers/types";
import { ProviderError } from "./providers/types";

export interface RunOptions {
  store: RadarStore;
  videoProvider: VideoProvider;
  transcriptProvider: TranscriptProvider;
  analysisProvider: AnalysisProvider;
  now?: Date;
  /** Reuse an existing run id to make a retried invocation continue that run rather than start a new one. */
  runId?: string;
  /** Skip live discovery and only re-score what is already stored. */
  discoveryEnabled?: boolean;
}

export async function runRadar(options: RunOptions): Promise<RadarRun> {
  const now = options.now ?? new Date();
  const store = options.store;
  const counters = emptyRunCounters();
  const failures: RadarRunFailure[] = [];

  const record = (stage: string, subjectId: string | null, code: RadarErrorCode, message: string) => {
    failures.push({ stage, subjectId, code, message: message.slice(0, 400), occurredAt: new Date().toISOString() });
    if (code.startsWith("PROVIDER_")) counters.providerFailures += 1;
  };

  // Считаем РАЗЛИЧНЫЕ видео, а не операции upsert: одно видео, найденное по
  // нескольким ключевым словам, — это одна находка, а не пять.
  const discoveredIds = new Set<string>();
  // Всё, чего прогон коснулся, вместе с записью — чтобы Stage B не перечитывал
  // из хранилища то, что Stage A только что записал.
  const touched = new Map<string, RadarVideo>();

  const run: RadarRun = {
    id: options.runId ?? randomUUID(),
    status: "running",
    startedAt: now.toISOString(),
    completedAt: null,
    pipelineVersion: RADAR_VERSIONS.pipeline,
    scoringVersion: RADAR_VERSIONS.scoring,
    counters,
    failures,
    ephemeral: !store.durable,
  };
  await store.createRun(run);

  const topics = await store.listTopics({ activeOnly: true });
  const creators = await store.listCreators({ activeOnly: true });
  const creatorByChannel = new Map(creators.map((creator) => [creator.externalChannelId, creator]));

  // Relevance is pure string work, so memoizing it costs nothing and keeps pool
  // selection, backfill targeting and scoring all reading the same number.
  const relevanceByVideo = new Map<string, RelevanceResult>();
  const relevanceFor = (video: RadarVideo): RelevanceResult => {
    const cached = relevanceByVideo.get(video.id);
    if (cached) return cached;
    const computed = computeRelevance({
      title: video.title,
      description: video.description,
      language: video.language,
      topics,
      creator: creatorByChannel.get(video.channelId) ?? null,
    });
    relevanceByVideo.set(video.id, computed);
    return computed;
  };

  // ---- Stage A: discovery + monitoring (cheap, wide, no transcripts, no model)
  const discoveryEnabled = options.discoveryEnabled !== false;
  if (discoveryEnabled) {
    await discoverFromWatchlist({ store, provider: options.videoProvider, creators, counters, record, now, discoveredIds, touched });
    await discoverFromTopics({ store, provider: options.videoProvider, topics, counters, record, now, discoveredIds, touched });
  }
  await refreshMonitored({ store, provider: options.videoProvider, runId: run.id, counters, record, now, discoveredIds, touched });

  counters.videosDiscovered = discoveredIds.size;
  // Видео, найденное впервые в этом же прогоне, — находка, а не обновление.
  counters.videosUpdated = [...touched.keys()].filter((id) => !discoveredIds.has(id)).length;

  // The candidate set is frozen here, BEFORE the backfill below, which is the
  // whole point: back-catalogue videos fetched to give a channel a baseline are
  // evidence, not candidates, and must not crowd real findings out of the pool.
  const videos = await buildCandidatePool(store, touched, relevanceFor);

  // Loaded once per channel rather than lazily per video: the backfill needs to
  // see the same history the scoring stage will, and one shared map means the
  // channel is queried once whether it is backfilled or not.
  const historyByChannel = new Map<string, RadarVideo[]>();
  for (const video of videos) {
    if (historyByChannel.has(video.channelId)) continue;
    try {
      historyByChannel.set(video.channelId, await store.listChannelHistory(video.channelId));
    } catch (cause) {
      // Recorded once per channel instead of once per video, and an empty
      // history yields an honest "baseline unavailable" rather than a guess.
      record("baseline:history", video.channelId, "INTERNAL_ERROR", errorMessage(cause));
      historyByChannel.set(video.channelId, []);
    }
  }

  // ---- Stage A2: baseline backfill. Topic search returns one or two videos per
  // channel, so without this most candidates would never HAVE a baseline — not
  // on the first run and not on the hundredth, because each run finds different
  // channels rather than more history for the same ones.
  if (discoveryEnabled) {
    try {
      await backfillBaselines({
        store,
        provider: options.videoProvider,
        counters,
        record,
        candidates: videos,
        relevanceFor,
        historyByChannel,
      });
    } catch (cause) {
      record("baseline:backfill", null, "INTERNAL_ERROR", errorMessage(cause));
    }
  }

  // ---- Stage B: metadata scoring (still no transcripts, no model)
  // Held locally so later stages never re-query what this stage just wrote.
  const scoreByVideo = new Map<string, ScoreRecord>();
  const scored: {
    video: RadarVideo;
    score: number;
    ratio: number | null;
    maturity: string;
    passed: boolean;
  }[] = [];

  for (const video of videos) {
    try {
      const history = historyByChannel.get(video.channelId) ?? [];

      const baseline = computeBaseline({
        targetVideoId: video.id,
        targetVideoType: video.videoType,
        targetPublishedAt: video.publishedAt,
        history: history.map(
          (item): BaselineCandidate => ({
            videoId: item.id,
            videoType: item.videoType,
            publishedAt: item.publishedAt,
            views: item.latestViews,
          }),
        ),
        now,
      });

      const outlier = computeOutlier({
        views: video.latestViews,
        baseline,
        publishedAt: video.publishedAt,
        videoType: video.videoType,
        now,
      });

      const relevance = relevanceFor(video);

      const candidateScore = computeCandidateScore({
        videoType: video.videoType,
        baseline,
        outlier,
        relevance,
        engagement: computeEngagement(video.latestViews, video.latestLikes, video.latestComments),
        velocity: computeVelocity(await store.listSnapshots(video.id)),
        creatorPriority: creatorByChannel.get(video.channelId)?.priority ?? null,
      });

      const gate = passesQualityGate({ score: candidateScore, outlier, relevance, baseline });

      const scoreRecord: ScoreRecord = {
        runId: run.id,
        videoId: video.id,
        baselineViews: baseline.baselineViews,
        baselineSampleSize: baseline.sampleSize,
        baselineConfidence: baseline.confidence,
        baselineVersion: baseline.baselineVersion,
        outlierRatio: outlier.ratio,
        outlierBand: outlier.band,
        outlierMaturity: outlier.maturity,
        relevanceScore: relevance.score,
        candidateScore: candidateScore.score,
        // The components are the whole point: a stored 0.87 that cannot be
        // explained is not a ranking, it is a rumour (§26).
        scoreComponents: {
          components: candidateScore.components,
          weightCoverage: candidateScore.weightCoverage,
          relevance,
        },
        scoringVersion: candidateScore.scoringVersion,
        shortlisted: false,
        gateReasons: gate.reasons,
      };
      await store.saveScore(scoreRecord);
      scoreByVideo.set(video.id, scoreRecord);
      counters.videosScored += 1;

      scored.push({
        video,
        score: candidateScore.score,
        ratio: outlier.ratio,
        maturity: outlier.maturity,
        passed: gate.passed,
      });
    } catch (cause) {
      record("score", video.id, "INTERNAL_ERROR", errorMessage(cause));
    }
  }

  // ---- Stage C: shortlist. Quotas are ceilings applied to what already passed;
  // nothing weak is promoted to fill one (§27).
  const shortlist = applyQuota(
    scored
      .filter((item) => item.passed)
      .map((item) => ({ videoId: item.video.id, videoType: item.video.videoType, score: item.score, item })),
  );
  counters.shortlisted = shortlist.length;

  for (const entry of shortlist) {
    try {
      const score = scoreByVideo.get(entry.videoId);
      if (!score) throw new Error(`No score recorded for video ${entry.videoId}`);
      const promoted = { ...score, shortlisted: true };
      await store.saveScore(promoted);
      scoreByVideo.set(entry.videoId, promoted);
    } catch (cause) {
      record("shortlist", entry.videoId, "INTERNAL_ERROR", errorMessage(cause));
    }
  }

  // ---- Stage C/D: transcripts then analysis, for the shortlist only.
  const transcriptBudget = radarConfig.pipeline.maxTranscriptsPerRun;
  const analysisBudget = radarConfig.pipeline.maxAnalysesPerRun;
  const projects = radarProjects();
  const knownProjectIds = projects.map((project) => project.slug);
  let analysesDone = 0;

  for (const [index, entry] of shortlist.entries()) {
    const video = entry.item.video;

    if (index < transcriptBudget) {
      try {
        const existing = await store.getTranscript(video.id);
        // Never re-fetch a transcript we already hold (§29, §50).
        if (existing?.status !== "available") {
          counters.transcriptsAttempted += 1;
          const result = await options.transcriptProvider.fetch({
            externalVideoId: video.externalVideoId,
            language: video.language,
          });
          await store.saveTranscript({
            videoId: video.id,
            status: result.status,
            language: result.language,
            provider: result.provider,
            text: result.text,
            fetchedAt: new Date().toISOString(),
            failureReason: result.failureReason,
          });
          await store.setVideoStatuses(video.id, { transcriptStatus: result.status });
          if (result.status === "available") counters.transcriptsSucceeded += 1;
          else counters.transcriptsFailed += 1;
        }
      } catch (cause) {
        // A transcript failure must never take the batch down (§29).
        counters.transcriptsFailed += 1;
        record("transcript", video.id, "TRANSCRIPT_UNAVAILABLE", errorMessage(cause));
      }
    }

    if (analysesDone >= analysisBudget) continue;

    try {
      const existingAnalysis = await store.getAnalysis(video.id, ANALYSIS_PROMPT_VERSION);
      // Re-analysing an unchanged video at the same prompt version is pure spend (§50).
      if (existingAnalysis) continue;

      const transcript = await store.getTranscript(video.id);
      const score = scoreByVideo.get(video.id);
      if (!score) throw new Error(`No score recorded for video ${video.id}`);

      counters.analysesAttempted += 1;
      analysesDone += 1;

      const outcome = await options.analysisProvider.analyze(
        {
          title: video.title,
          description: video.description,
          channelName: video.channelName,
          publishedAt: video.publishedAt,
          videoType: video.videoType,
          durationSeconds: video.durationSeconds,
          views: video.latestViews,
          likes: video.latestLikes,
          comments: video.latestComments,
          baselineViews: score.baselineViews,
          baselineSampleSize: score.baselineSampleSize,
          baselineConfidence: score.baselineConfidence,
          outlierRatio: score.outlierRatio,
          outlierMaturity: score.outlierMaturity,
          transcript: transcript?.status === "available" ? transcript.text : null,
          projects,
        },
        knownProjectIds,
      );

      if (!outcome.ok) {
        counters.analysesFailed += 1;
        await store.setVideoStatuses(video.id, { analysisStatus: "failed" });
        record("analysis", video.id, outcome.code, outcome.message);
        continue;
      }

      await store.saveAnalysis({
        videoId: video.id,
        promptVersion: ANALYSIS_PROMPT_VERSION,
        schemaVersion: ANALYSIS_SCHEMA_VERSION,
        model: outcome.model,
        analysis: outcome.analysis,
        analyzedAt: new Date().toISOString(),
      });
      await store.setVideoStatuses(video.id, { analysisStatus: "completed" });
      counters.analysesSucceeded += 1;

      const patterns = await recordPatternsFromAnalysis(store, {
        videoId: video.id,
        channelId: video.channelId,
        analysis: outcome.analysis,
        observedAt: new Date().toISOString(),
      });
      counters.patternsObserved += patterns.length;

      const built = buildOpportunities({
        video,
        analysis: outcome.analysis,
        patternIdByName: Object.fromEntries(
          patterns.map((pattern) => [pattern.canonicalName, pattern.id]),
        ),
        outlierSummary: outlierSummaryFor(video, score.outlierRatio, score.outlierMaturity),
      });

      for (const rejection of built.rejected) {
        record("opportunity", video.id, "INVALID_INPUT", `${rejection.projectId}: ${rejection.reason}`);
      }

      const saved = await persistOpportunities(store, built.opportunities);
      counters.opportunitiesProduced += saved.length;
    } catch (cause) {
      counters.analysesFailed += 1;
      record("analysis", video.id, "INTERNAL_ERROR", errorMessage(cause));
    }
  }

  const completed: RadarRun = {
    ...run,
    status: failures.length === 0 ? "completed" : "partial",
    completedAt: new Date().toISOString(),
    counters,
    failures,
  };
  await store.updateRun(run.id, completed);
  return completed;
}

function errorMessage(cause: unknown): string {
  if (cause instanceof ProviderError) return `${cause.code}: ${cause.message}`;
  return cause instanceof Error ? cause.message : "unknown error";
}

function providerErrorCode(cause: unknown): RadarErrorCode {
  return cause instanceof ProviderError ? cause.code : "PROVIDER_UNAVAILABLE";
}

/**
 * Quota is a property of the day, not of the request.
 *
 * Once YouTube says the daily budget is gone, every remaining call in the run
 * will fail the same way. Continuing produced 54 identical failures in one live
 * run — one per keyword — which is noise in the failure log and, worse, teaches
 * an operator to ignore it. The first one is the whole message.
 */
function isQuotaExhausted(cause: unknown): boolean {
  return cause instanceof ProviderError && cause.code === "PROVIDER_QUOTA_EXCEEDED";
}

type RecordFailure = (
  stage: string,
  subjectId: string | null,
  code: RadarErrorCode,
  message: string,
) => void;

interface DiscoveryContext {
  store: RadarStore;
  provider: VideoProvider;
  counters: ReturnType<typeof emptyRunCounters>;
  record: RecordFailure;
  now: Date;
  /** Видео, впервые увиденные в этом прогоне. */
  discoveredIds: Set<string>;
  /** Все видео, которых прогон касался, включая уже известные. */
  touched: Map<string, RadarVideo>;
}

/**
 * What this run will score.
 *
 * Everything the run actually looked at is a candidate by definition; the pool
 * is then topped up from stored history so a re-score-only run (discovery
 * disabled) still has work. `maxDiscoveryPerRun` caps it because Stage B costs
 * one snapshot query per video, so the pool size is a real budget rather than
 * free local arithmetic.
 *
 * When discovery overshoots that budget — 18 topics x 3 keywords x 50 results is
 * several times it — the cap is applied by relevance. Insertion order would mean
 * dropping every topic after the sixth purely because of where it sits in the
 * seed file, which is not a decision anybody made.
 */
async function buildCandidatePool(
  store: RadarStore,
  touched: Map<string, RadarVideo>,
  relevanceFor: (video: RadarVideo) => RelevanceResult,
): Promise<RadarVideo[]> {
  const limit = radarConfig.pipeline.maxDiscoveryPerRun;
  const pool = new Map(touched);

  if (pool.size < limit) {
    for (const video of await store.listVideos({ limit })) {
      if (!pool.has(video.id)) pool.set(video.id, video);
      if (pool.size >= limit) break;
    }
  }

  const candidates = [...pool.values()];
  if (candidates.length <= limit) return candidates;

  return candidates
    .sort((a, b) => relevanceFor(b).score - relevanceFor(a).score)
    .slice(0, limit);
}

/**
 * Baseline backfill.
 *
 * A creator baseline is the median of that creator's own comparable videos, so
 * a channel the Radar knows through a single search hit can never produce one.
 * Topic search makes this structural rather than temporary: each run surfaces
 * *different* channels, so waiting for history to accumulate adds more
 * one-video channels, not deeper history for the existing ones.
 *
 * Spending is deliberately narrow. Only channels that already have a candidate
 * clearing `minRelevance` are worth quota — a channel that will be gated out on
 * relevance gains nothing from a measurable baseline — and only channels whose
 * stored comparable history is too thin to reach medium confidence. `channelUploads`
 * costs ~3 units against a 10,000/day budget, versus 100 for a single search.
 *
 * The fetched videos are stored as history and nothing else: no discovery
 * origin, no place in the candidate pool. They are evidence about a creator,
 * not things the Radar went looking for.
 */
async function backfillBaselines(context: {
  store: RadarStore;
  provider: VideoProvider;
  counters: ReturnType<typeof emptyRunCounters>;
  record: RecordFailure;
  candidates: RadarVideo[];
  relevanceFor: (video: RadarVideo) => RelevanceResult;
  historyByChannel: Map<string, RadarVideo[]>;
}): Promise<void> {
  const { maxBaselineBackfillChannels, baselineBackfillUploads } = radarConfig.pipeline;
  if (maxBaselineBackfillChannels <= 0 || baselineBackfillUploads <= 0) return;

  const minRelevance = radarConfig.qualityGate.minRelevance;
  // +1 because a video is never part of its own baseline: reaching a medium
  // sample of N needs N comparable videos BESIDES the one being judged.
  const wantedHistory = radarConfig.baseline.confidence.mediumMinSample + 1;

  const bestRelevanceByChannel = new Map<string, number>();
  for (const video of context.candidates) {
    const relevance = context.relevanceFor(video).score;
    if (relevance < minRelevance) continue;

    // Comparable, not merely present: eight long-form uploads do nothing for a
    // Short, because Shorts are only ever compared against Shorts.
    const comparable = (context.historyByChannel.get(video.channelId) ?? []).filter((item) =>
      isComparableType(item.videoType, video.videoType),
    ).length;
    if (comparable >= wantedHistory) continue;

    const best = bestRelevanceByChannel.get(video.channelId);
    if (best === undefined || relevance > best) {
      bestRelevanceByChannel.set(video.channelId, relevance);
    }
  }

  const targets = [...bestRelevanceByChannel.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxBaselineBackfillChannels)
    .map(([channelId]) => channelId);

  // Not fed into the run counters: these are baseline evidence, and reporting
  // them as "discovered" would inflate the number the operator reads as findings.
  const backfillDiscovered = new Set<string>();
  const backfillTouched = new Map<string, RadarVideo>();

  for (const channelId of targets) {
    try {
      const uploads = await context.provider.channelUploads({
        channelId,
        maxResults: baselineBackfillUploads,
      });

      for (const providerVideo of uploads) {
        await upsertProviderVideo(context.store, providerVideo, backfillDiscovered, backfillTouched);
      }

      context.historyByChannel.set(channelId, await context.store.listChannelHistory(channelId));
      context.counters.channelsBackfilled += 1;
    } catch (cause) {
      // One unreachable or deleted channel costs that channel its baseline and
      // nothing more — but an exhausted budget costs all of them, so stop.
      context.record("baseline:backfill", channelId, providerErrorCode(cause), errorMessage(cause));
      if (isQuotaExhausted(cause)) return;
    }
  }
}

/**
 * Watchlist discovery (§12A) — recent uploads from known high-signal creators.
 * One creator failing is recorded and skipped; the rest of the watchlist still runs.
 */
async function discoverFromWatchlist(
  context: DiscoveryContext & { creators: RadarCreator[] },
): Promise<void> {
  for (const creator of context.creators) {
    try {
      const uploads = await context.provider.channelUploads({
        channelId: creator.externalChannelId,
        maxResults: radarConfig.pipeline.maxUploadsPerCreator,
      });

      for (const providerVideo of uploads) {
        const video = await upsertProviderVideo(context.store, providerVideo, context.discoveredIds, context.touched);
        await context.store.addOrigin({
          videoId: video.id,
          kind: "watchlist",
          topicId: null,
          creatorId: creator.id,
          searchTerm: null,
          discoveredAt: context.now.toISOString(),
        });
      }

      await context.store.updateCreator(creator.id, { lastScannedAt: context.now.toISOString() });
    } catch (cause) {
      context.record("discovery:watchlist", creator.id, providerErrorCode(cause), errorMessage(cause));
      if (isQuotaExhausted(cause)) return;
    }
  }
}

/** Topic discovery (§12B) — finds creators and videos the system does not already know. */
async function discoverFromTopics(context: DiscoveryContext & { topics: RadarTopic[] }): Promise<void> {
  // Search is ordered by view count, so without a window every keyword returns
  // its all-time biggest hits — videos whose creator baseline is unknowable
  // today, and which the Radar would then report as 40,000x outliers. The
  // window is what makes discovery a question about the present.
  const publishedAfter = new Date(
    context.now.getTime() - radarConfig.pipeline.discoveryWindowDays * 86_400_000,
  ).toISOString();

  for (const topic of context.topics) {
    for (const keyword of topic.keywords.slice(0, 3)) {
      try {
        const found = await context.provider.search({
          query: keyword,
          maxResults: radarConfig.pipeline.maxVideosPerTopicQuery,
          languages: topic.languages,
          publishedAfter,
        });

        for (const providerVideo of found) {
          const video = await upsertProviderVideo(context.store, providerVideo, context.discoveredIds, context.touched);
          await context.store.addOrigin({
            videoId: video.id,
            kind: "topic",
            topicId: topic.id,
            creatorId: null,
            searchTerm: keyword,
            discoveredAt: context.now.toISOString(),
          });
        }
      } catch (cause) {
        context.record("discovery:topic", topic.id, providerErrorCode(cause), errorMessage(cause));
        // 18 topics x 3 keywords against an exhausted budget is 54 copies of the
        // same failure. One is the signal.
        if (isQuotaExhausted(cause)) return;
      }
    }
  }
}

/**
 * Monitoring (§13) — refresh metrics for already-known videos. Distinct from
 * discovery on purpose: a video's performance can change substantially after it
 * was first seen, and only repeated observation makes velocity measurable.
 */
async function refreshMonitored(context: DiscoveryContext & { runId: string }): Promise<void> {
  const monitored = await context.store.listVideos({
    limit: radarConfig.pipeline.maxMonitoredRefreshPerRun,
  });
  if (monitored.length === 0) return;

  try {
    // Batched, so refreshing 200 videos costs 4 provider calls rather than 200 (§50).
    const refreshed = await context.provider.getVideos(
      monitored.map((video) => video.externalVideoId),
    );
    const byExternalId = new Map(refreshed.map((video) => [video.externalVideoId, video]));

    for (const video of monitored) {
      const latest = byExternalId.get(video.externalVideoId);
      if (!latest) continue;
      try {
        const updated = await upsertProviderVideo(context.store, latest, context.discoveredIds, context.touched);
        await context.store.addSnapshot({
          videoId: updated.id,
          runId: context.runId,
          capturedAt: context.now.toISOString(),
          views: latest.views,
          likes: latest.likes,
          comments: latest.comments,
          channelSubscribers: updated.latestChannelSubscribers,
        });
      } catch (cause) {
        context.record("monitor", video.id, "INTERNAL_ERROR", errorMessage(cause));
      }
    }
  } catch (cause) {
    context.record("monitor", null, providerErrorCode(cause), errorMessage(cause));
  }
}

async function upsertProviderVideo(
  store: RadarStore,
  providerVideo: ProviderVideo,
  discoveredIds: Set<string>,
  touched: Map<string, RadarVideo>,
): Promise<RadarVideo> {
  const { video, created } = await store.upsertVideo({
    platform: providerVideo.platform,
    externalVideoId: providerVideo.externalVideoId,
    channelId: providerVideo.channelId,
    channelName: providerVideo.channelName,
    title: providerVideo.title,
    description: providerVideo.description,
    sourceUrl: providerVideo.sourceUrl,
    thumbnailUrl: providerVideo.thumbnailUrl,
    publishedAt: providerVideo.publishedAt,
    durationSeconds: providerVideo.durationSeconds,
    videoType: providerVideo.videoType,
    language: providerVideo.language,
    latestViews: providerVideo.views,
    latestLikes: providerVideo.likes,
    latestComments: providerVideo.comments,
    latestChannelSubscribers: null,
  });

  if (created) discoveredIds.add(video.id);
  touched.set(video.id, video);

  return video;
}
