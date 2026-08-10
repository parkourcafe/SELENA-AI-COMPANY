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
} from "./contracts";
import { computeEngagement, computeVelocity } from "./metrics";
import { computeOutlier } from "./outlier";
import { buildOpportunities, outlierSummaryFor, persistOpportunities } from "./opportunities";
import { recordPatternsFromAnalysis } from "./patterns";
import { radarProjects } from "./projects";
import { computeRelevance } from "./relevance";
import { applyQuota, computeCandidateScore, passesQualityGate } from "./score";
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

  // ---- Stage A: discovery + monitoring (cheap, wide, no transcripts, no model)
  if (options.discoveryEnabled !== false) {
    await discoverFromWatchlist({ store, provider: options.videoProvider, creators, counters, record, now });
    await discoverFromTopics({ store, provider: options.videoProvider, topics, counters, record, now });
  }
  await refreshMonitored({ store, provider: options.videoProvider, runId: run.id, counters, record, now });

  // ---- Stage B: metadata scoring (still no transcripts, no model)
  const videos = await store.listVideos({ limit: radarConfig.pipeline.maxDiscoveryPerRun });
  const historyByChannel = new Map<string, RadarVideo[]>();
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
      if (!historyByChannel.has(video.channelId)) {
        historyByChannel.set(video.channelId, await store.listChannelHistory(video.channelId));
      }
      const history = historyByChannel.get(video.channelId) ?? [];

      const baseline = computeBaseline({
        targetVideoId: video.id,
        targetVideoType: video.videoType,
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

      const relevance = computeRelevance({
        title: video.title,
        description: video.description,
        language: video.language,
        topics,
        creator: creatorByChannel.get(video.channelId) ?? null,
      });

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

interface DiscoveryContext {
  store: RadarStore;
  provider: VideoProvider;
  counters: ReturnType<typeof emptyRunCounters>;
  record: (stage: string, subjectId: string | null, code: RadarErrorCode, message: string) => void;
  now: Date;
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
        const video = await upsertProviderVideo(context.store, providerVideo, context.counters);
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
    }
  }
}

/** Topic discovery (§12B) — finds creators and videos the system does not already know. */
async function discoverFromTopics(context: DiscoveryContext & { topics: RadarTopic[] }): Promise<void> {
  for (const topic of context.topics) {
    for (const keyword of topic.keywords.slice(0, 3)) {
      try {
        const found = await context.provider.search({
          query: keyword,
          maxResults: radarConfig.pipeline.maxVideosPerTopicQuery,
          languages: topic.languages,
        });

        for (const providerVideo of found) {
          const video = await upsertProviderVideo(context.store, providerVideo, context.counters);
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
        const updated = await upsertProviderVideo(context.store, latest, context.counters);
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
  counters: ReturnType<typeof emptyRunCounters>,
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

  if (created) counters.videosDiscovered += 1;
  else counters.videosUpdated += 1;

  return video;
}
