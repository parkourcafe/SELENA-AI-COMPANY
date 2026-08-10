/**
 * Supabase-backed Radar store.
 *
 * Uses the single existing service-role client (lib/supabase/server.ts) — no
 * second client, no second connection story. Every write is an upsert on the
 * unique constraint declared in 20260810000001_video_radar.sql, so a rerun
 * updates rather than duplicates (spec §40).
 *
 * Where a table's uniqueness is expressed as a PARTIAL unique index (origins,
 * opportunities), PostgREST cannot infer the conflict target — Postgres needs
 * the index predicate too. Those paths read first and then insert or update,
 * and treat a concurrent unique violation (23505) as success rather than an
 * error, which is the correct outcome either way.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type {
  RadarCreatorRow,
  RadarOpportunityRow,
  RadarPatternRow,
  RadarRunRow,
  RadarTopicRow,
  RadarVideoRow,
} from "@/lib/supabase/radar-types";
import {
  emptyRunCounters,
  type AnalysisStatus,
  type OpportunityStatus,
  type RadarCreator,
  type RadarMetricSnapshot,
  type RadarOpportunity,
  type RadarPattern,
  type RadarRun,
  type RadarRunCounters,
  type RadarRunFailure,
  type RadarTopic,
  type RadarTranscript,
  type RadarVideo,
  type TranscriptStatus,
} from "../contracts";
import type { StructuredAnalysis } from "../analysis/schema";
import type {
  AnalysisRecord,
  OpportunityUpsert,
  OriginUpsert,
  PatternObservation,
  RadarStore,
  ScoreRecord,
  VideoUpsert,
} from "./types";

type Client = SupabaseClient<Database>;

const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === UNIQUE_VIOLATION;
}

function fail(context: string, error: { message?: string } | null): never {
  throw new Error(`Radar store ${context} failed: ${error?.message ?? "unknown error"}`);
}

function mapTopic(row: RadarTopicRow): RadarTopic {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    active: row.active,
    priority: row.priority,
    keywords: row.keywords ?? [],
    negativeKeywords: row.negative_keywords ?? [],
    languages: row.languages ?? [],
    targetProjects: row.target_projects ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCreator(row: RadarCreatorRow): RadarCreator {
  return {
    id: row.id,
    platform: row.platform,
    externalChannelId: row.external_channel_id,
    channelName: row.channel_name,
    channelUrl: row.channel_url,
    active: row.active,
    priority: row.priority,
    tags: row.tags ?? [],
    languages: row.languages ?? [],
    targetProjects: row.target_projects ?? [],
    subscriberCount: row.subscriber_count,
    lastScannedAt: row.last_scanned_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVideo(row: RadarVideoRow): RadarVideo {
  return {
    id: row.id,
    platform: row.platform,
    externalVideoId: row.external_video_id,
    channelId: row.channel_id,
    channelName: row.channel_name,
    title: row.title,
    description: row.description,
    sourceUrl: row.source_url,
    thumbnailUrl: row.thumbnail_url,
    publishedAt: row.published_at,
    discoveredAt: row.discovered_at,
    durationSeconds: row.duration_seconds,
    videoType: row.video_type,
    language: row.language,
    latestViews: row.latest_views,
    latestLikes: row.latest_likes,
    latestComments: row.latest_comments,
    latestChannelSubscribers: row.latest_channel_subscribers,
    transcriptStatus: row.transcript_status,
    analysisStatus: row.analysis_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPattern(row: RadarPatternRow, observationCount: number): RadarPattern {
  return {
    id: row.id,
    canonicalName: row.canonical_name,
    description: row.description,
    category: row.category,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    observationCount,
  };
}

function mapOpportunity(row: RadarOpportunityRow): RadarOpportunity {
  return {
    id: row.id,
    sourceVideoId: row.source_video_id,
    projectId: row.project_id,
    proposedAngle: row.proposed_angle,
    proposedHook: row.proposed_hook,
    contentFormat: row.content_format,
    sourcePatternId: row.source_pattern_id,
    rationale: row.rationale,
    evidenceSummary: row.evidence_summary,
    confidence: row.confidence,
    factRequirements: row.fact_requirements ?? [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRun(row: RadarRunRow): RadarRun {
  return {
    id: row.id,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    pipelineVersion: row.pipeline_version,
    scoringVersion: row.scoring_version,
    counters: { ...emptyRunCounters(), ...((row.counters ?? {}) as Partial<RadarRunCounters>) },
    failures: (row.failures ?? []) as RadarRunFailure[],
    ephemeral: false,
  };
}

export class SupabaseRadarStore implements RadarStore {
  readonly durable = true;
  readonly kind = "supabase" as const;

  constructor(private readonly client: Client) {}

  private now(): string {
    return new Date().toISOString();
  }

  async listTopics(options?: { activeOnly?: boolean }): Promise<RadarTopic[]> {
    let query = this.client.from("radar_topics").select("*");
    if (options?.activeOnly) query = query.eq("active", true);
    const { data, error } = await query;
    if (error) fail("listTopics", error);
    return (data ?? []).map(mapTopic);
  }

  async upsertTopic(topic: Omit<RadarTopic, "id" | "createdAt" | "updatedAt">): Promise<RadarTopic> {
    const { data, error } = await this.client
      .from("radar_topics")
      .upsert(
        {
          slug: topic.slug,
          name: topic.name,
          description: topic.description,
          active: topic.active,
          priority: topic.priority,
          keywords: topic.keywords,
          negative_keywords: topic.negativeKeywords,
          languages: topic.languages,
          target_projects: topic.targetProjects,
          updated_at: this.now(),
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    if (error || !data) fail("upsertTopic", error);
    return mapTopic(data);
  }

  async updateTopic(id: string, patch: Partial<RadarTopic>): Promise<RadarTopic | null> {
    const payload: Partial<RadarTopicRow> = { updated_at: this.now() };
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.active !== undefined) payload.active = patch.active;
    if (patch.priority !== undefined) payload.priority = patch.priority;
    if (patch.keywords !== undefined) payload.keywords = patch.keywords;
    if (patch.negativeKeywords !== undefined) payload.negative_keywords = patch.negativeKeywords;
    if (patch.languages !== undefined) payload.languages = patch.languages;
    if (patch.targetProjects !== undefined) payload.target_projects = patch.targetProjects;

    const { data, error } = await this.client
      .from("radar_topics")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) fail("updateTopic", error);
    return data ? mapTopic(data) : null;
  }

  async listCreators(options?: { activeOnly?: boolean }): Promise<RadarCreator[]> {
    let query = this.client.from("radar_creators").select("*");
    if (options?.activeOnly) query = query.eq("active", true);
    const { data, error } = await query;
    if (error) fail("listCreators", error);
    return (data ?? []).map(mapCreator);
  }

  async upsertCreator(
    creator: Omit<RadarCreator, "id" | "createdAt" | "updatedAt">,
  ): Promise<RadarCreator> {
    const { data, error } = await this.client
      .from("radar_creators")
      .upsert(
        {
          platform: creator.platform,
          external_channel_id: creator.externalChannelId,
          channel_name: creator.channelName,
          channel_url: creator.channelUrl,
          active: creator.active,
          priority: creator.priority,
          tags: creator.tags,
          languages: creator.languages,
          target_projects: creator.targetProjects,
          subscriber_count: creator.subscriberCount,
          last_scanned_at: creator.lastScannedAt,
          updated_at: this.now(),
        },
        { onConflict: "platform,external_channel_id" },
      )
      .select()
      .single();
    if (error || !data) fail("upsertCreator", error);
    return mapCreator(data);
  }

  async updateCreator(id: string, patch: Partial<RadarCreator>): Promise<RadarCreator | null> {
    const payload: Partial<RadarCreatorRow> = { updated_at: this.now() };
    if (patch.channelName !== undefined) payload.channel_name = patch.channelName;
    if (patch.channelUrl !== undefined) payload.channel_url = patch.channelUrl;
    if (patch.active !== undefined) payload.active = patch.active;
    if (patch.priority !== undefined) payload.priority = patch.priority;
    if (patch.tags !== undefined) payload.tags = patch.tags;
    if (patch.languages !== undefined) payload.languages = patch.languages;
    if (patch.targetProjects !== undefined) payload.target_projects = patch.targetProjects;
    if (patch.subscriberCount !== undefined) payload.subscriber_count = patch.subscriberCount;
    if (patch.lastScannedAt !== undefined) payload.last_scanned_at = patch.lastScannedAt;

    const { data, error } = await this.client
      .from("radar_creators")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) fail("updateCreator", error);
    return data ? mapCreator(data) : null;
  }

  async upsertVideo(video: VideoUpsert): Promise<{ video: RadarVideo; created: boolean }> {
    // One indexed lookup on the unique key, so the run can report "discovered"
    // vs "updated" truthfully. Cheaper than the alternative of inferring it
    // from timestamps, which breaks the moment a clock skews.
    const { data: existing, error: existingError } = await this.client
      .from("radar_videos")
      .select("id")
      .eq("platform", video.platform)
      .eq("external_video_id", video.externalVideoId)
      .maybeSingle();
    if (existingError) fail("upsertVideo(select)", existingError);

    // discovered_at, transcript_status and analysis_status are deliberately
    // absent: omitted columns are untouched on conflict, so re-discovery cannot
    // reset a video's pipeline progress or rewrite when it was first seen.
    const { data, error } = await this.client
      .from("radar_videos")
      .upsert(
        {
          platform: video.platform,
          external_video_id: video.externalVideoId,
          channel_id: video.channelId,
          channel_name: video.channelName,
          title: video.title,
          description: video.description,
          source_url: video.sourceUrl,
          thumbnail_url: video.thumbnailUrl,
          published_at: video.publishedAt,
          duration_seconds: video.durationSeconds,
          video_type: video.videoType,
          language: video.language,
          latest_views: video.latestViews,
          latest_likes: video.latestLikes,
          latest_comments: video.latestComments,
          latest_channel_subscribers: video.latestChannelSubscribers,
          updated_at: this.now(),
        },
        { onConflict: "platform,external_video_id" },
      )
      .select()
      .single();
    if (error || !data) fail("upsertVideo", error);
    return { video: mapVideo(data), created: !existing };
  }

  async getVideo(id: string): Promise<RadarVideo | null> {
    const { data, error } = await this.client
      .from("radar_videos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) fail("getVideo", error);
    return data ? mapVideo(data) : null;
  }

  async listVideos(options?: {
    channelId?: string;
    shortlistedInRun?: string;
    limit?: number;
  }): Promise<RadarVideo[]> {
    let ids: string[] | null = null;

    if (options?.shortlistedInRun) {
      const { data, error } = await this.client
        .from("radar_video_scores")
        .select("video_id")
        .eq("run_id", options.shortlistedInRun)
        .eq("shortlisted", true);
      if (error) fail("listVideos(shortlist)", error);
      ids = (data ?? []).map((row) => row.video_id as string);
      if (ids.length === 0) return [];
    }

    let query = this.client.from("radar_videos").select("*").order("published_at", { ascending: false });
    if (options?.channelId) query = query.eq("channel_id", options.channelId);
    if (ids) query = query.in("id", ids);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) fail("listVideos", error);
    return (data ?? []).map(mapVideo);
  }

  async listChannelHistory(channelId: string): Promise<RadarVideo[]> {
    return this.listVideos({ channelId });
  }

  async setVideoStatuses(
    id: string,
    patch: { transcriptStatus?: TranscriptStatus; analysisStatus?: AnalysisStatus },
  ): Promise<void> {
    const payload: Partial<RadarVideoRow> = { updated_at: this.now() };
    if (patch.transcriptStatus) payload.transcript_status = patch.transcriptStatus;
    if (patch.analysisStatus) payload.analysis_status = patch.analysisStatus;
    const { error } = await this.client.from("radar_videos").update(payload).eq("id", id);
    if (error) fail("setVideoStatuses", error);
  }

  async addOrigin(origin: OriginUpsert): Promise<void> {
    let existing = this.client
      .from("radar_video_origins")
      .select("id")
      .eq("video_id", origin.videoId)
      .eq("kind", origin.kind);
    existing = origin.topicId
      ? existing.eq("topic_id", origin.topicId)
      : existing.is("topic_id", null);
    existing = origin.creatorId
      ? existing.eq("creator_id", origin.creatorId)
      : existing.is("creator_id", null);

    const { data, error } = await existing.maybeSingle();
    if (error) fail("addOrigin(select)", error);
    if (data) return;

    const { error: insertError } = await this.client.from("radar_video_origins").insert({
      video_id: origin.videoId,
      kind: origin.kind,
      topic_id: origin.topicId,
      creator_id: origin.creatorId,
      search_term: origin.searchTerm,
      discovered_at: origin.discoveredAt,
    });
    // A concurrent writer winning the race produced the row we wanted anyway.
    if (insertError && !isUniqueViolation(insertError)) fail("addOrigin(insert)", insertError);
  }

  async listOrigins(videoId: string): Promise<OriginUpsert[]> {
    const { data, error } = await this.client
      .from("radar_video_origins")
      .select("*")
      .eq("video_id", videoId);
    if (error) fail("listOrigins", error);
    return (data ?? []).map((row) => ({
      videoId: row.video_id,
      kind: row.kind,
      topicId: row.topic_id,
      creatorId: row.creator_id,
      searchTerm: row.search_term,
      discoveredAt: row.discovered_at,
    }));
  }

  async addSnapshot(snapshot: RadarMetricSnapshot & { runId: string }): Promise<void> {
    const { error } = await this.client.from("radar_video_metrics").upsert(
      {
        video_id: snapshot.videoId,
        run_id: snapshot.runId,
        captured_at: snapshot.capturedAt,
        views: snapshot.views,
        likes: snapshot.likes,
        comments: snapshot.comments,
        channel_subscribers: snapshot.channelSubscribers,
      },
      { onConflict: "video_id,run_id" },
    );
    if (error) fail("addSnapshot", error);
  }

  async listSnapshots(videoId: string): Promise<RadarMetricSnapshot[]> {
    const { data, error } = await this.client
      .from("radar_video_metrics")
      .select("*")
      .eq("video_id", videoId)
      .order("captured_at", { ascending: true });
    if (error) fail("listSnapshots", error);
    return (data ?? []).map((row) => ({
      videoId: row.video_id,
      capturedAt: row.captured_at,
      views: row.views,
      likes: row.likes,
      comments: row.comments,
      channelSubscribers: row.channel_subscribers,
    }));
  }

  async saveScore(score: ScoreRecord): Promise<void> {
    const { error } = await this.client.from("radar_video_scores").upsert(
      {
        run_id: score.runId,
        video_id: score.videoId,
        baseline_views: score.baselineViews,
        baseline_sample_size: score.baselineSampleSize,
        baseline_confidence: score.baselineConfidence as "high" | "medium" | "low" | "unavailable",
        baseline_version: score.baselineVersion,
        outlier_ratio: score.outlierRatio,
        outlier_band: score.outlierBand,
        outlier_maturity: score.outlierMaturity as "provisional" | "mature",
        relevance_score: score.relevanceScore,
        candidate_score: score.candidateScore,
        score_components: score.scoreComponents,
        scoring_version: score.scoringVersion,
        shortlisted: score.shortlisted,
        gate_reasons: score.gateReasons,
      },
      { onConflict: "run_id,video_id" },
    );
    if (error) fail("saveScore", error);
  }

  async listScores(runId: string): Promise<ScoreRecord[]> {
    const { data, error } = await this.client
      .from("radar_video_scores")
      .select("*")
      .eq("run_id", runId)
      .order("candidate_score", { ascending: false });
    if (error) fail("listScores", error);
    return (data ?? []).map((row) => ({
      runId: row.run_id,
      videoId: row.video_id,
      baselineViews: row.baseline_views,
      baselineSampleSize: row.baseline_sample_size,
      baselineConfidence: row.baseline_confidence,
      baselineVersion: row.baseline_version,
      outlierRatio: row.outlier_ratio,
      outlierBand: row.outlier_band,
      outlierMaturity: row.outlier_maturity,
      relevanceScore: row.relevance_score,
      candidateScore: row.candidate_score,
      scoreComponents: row.score_components,
      scoringVersion: row.scoring_version,
      shortlisted: row.shortlisted,
      gateReasons: row.gate_reasons ?? [],
    }));
  }

  async getTranscript(videoId: string): Promise<RadarTranscript | null> {
    const { data, error } = await this.client
      .from("radar_transcripts")
      .select("*")
      .eq("video_id", videoId)
      .maybeSingle();
    if (error) fail("getTranscript", error);
    if (!data) return null;
    return {
      videoId: data.video_id,
      status: data.status,
      language: data.language,
      provider: data.provider,
      text: data.text,
      fetchedAt: data.fetched_at,
      failureReason: data.failure_reason,
    };
  }

  async saveTranscript(transcript: RadarTranscript): Promise<void> {
    const { error } = await this.client.from("radar_transcripts").upsert(
      {
        video_id: transcript.videoId,
        status: transcript.status,
        language: transcript.language,
        provider: transcript.provider,
        text: transcript.text,
        fetched_at: transcript.fetchedAt,
        failure_reason: transcript.failureReason,
        updated_at: this.now(),
      },
      { onConflict: "video_id" },
    );
    if (error) fail("saveTranscript", error);
  }

  async getAnalysis(videoId: string, promptVersion: string): Promise<AnalysisRecord | null> {
    const { data, error } = await this.client
      .from("radar_analyses")
      .select("*")
      .eq("video_id", videoId)
      .eq("prompt_version", promptVersion)
      .maybeSingle();
    if (error) fail("getAnalysis", error);
    if (!data) return null;
    return {
      videoId: data.video_id,
      promptVersion: data.prompt_version,
      schemaVersion: data.schema_version,
      model: data.model,
      analysis: data.analysis as StructuredAnalysis,
      analyzedAt: data.analyzed_at,
    };
  }

  async saveAnalysis(record: AnalysisRecord): Promise<void> {
    const { error } = await this.client.from("radar_analyses").upsert(
      {
        video_id: record.videoId,
        prompt_version: record.promptVersion,
        schema_version: record.schemaVersion,
        model: record.model,
        analysis: record.analysis,
        analyzed_at: record.analyzedAt,
      },
      { onConflict: "video_id,prompt_version" },
    );
    if (error) fail("saveAnalysis", error);
  }

  async listAnalyses(videoIds: string[]): Promise<AnalysisRecord[]> {
    if (videoIds.length === 0) return [];
    const { data, error } = await this.client
      .from("radar_analyses")
      .select("*")
      .in("video_id", videoIds);
    if (error) fail("listAnalyses", error);
    return (data ?? []).map((row) => ({
      videoId: row.video_id,
      promptVersion: row.prompt_version,
      schemaVersion: row.schema_version,
      model: row.model,
      analysis: row.analysis as StructuredAnalysis,
      analyzedAt: row.analyzed_at,
    }));
  }

  async upsertPattern(pattern: {
    canonicalName: string;
    description: string;
    category: string;
    observedAt: string;
  }): Promise<RadarPattern> {
    const { data: existing, error: selectError } = await this.client
      .from("radar_patterns")
      .select("*")
      .eq("canonical_name", pattern.canonicalName)
      .maybeSingle();
    if (selectError) fail("upsertPattern(select)", selectError);

    if (existing) {
      // Only last_seen_at moves. The original description and first_seen_at are
      // the pattern's history and must not be rewritten by a later observation.
      const { data, error } = await this.client
        .from("radar_patterns")
        .update({ last_seen_at: pattern.observedAt })
        .eq("id", existing.id)
        .select()
        .single();
      if (error || !data) fail("upsertPattern(update)", error);
      return mapPattern(data, await this.countObservations(data.id));
    }

    const { data, error } = await this.client
      .from("radar_patterns")
      .insert({
        canonical_name: pattern.canonicalName,
        description: pattern.description,
        category: pattern.category,
        first_seen_at: pattern.observedAt,
        last_seen_at: pattern.observedAt,
      })
      .select()
      .single();

    if (error) {
      if (!isUniqueViolation(error)) fail("upsertPattern(insert)", error);
      // Lost the race — the other writer created exactly what we wanted.
      return this.upsertPattern(pattern);
    }
    return mapPattern(data as RadarPatternRow, 0);
  }

  private async countObservations(patternId: string): Promise<number> {
    const { count, error } = await this.client
      .from("radar_video_patterns")
      .select("id", { count: "exact", head: true })
      .eq("pattern_id", patternId);
    if (error) fail("countObservations", error);
    return count ?? 0;
  }

  async listPatterns(): Promise<RadarPattern[]> {
    const { data, error } = await this.client.from("radar_patterns").select("*");
    if (error) fail("listPatterns", error);
    return Promise.all(
      (data ?? []).map(async (row) => mapPattern(row, await this.countObservations(row.id))),
    );
  }

  async observePattern(observation: PatternObservation): Promise<void> {
    const { error } = await this.client.from("radar_video_patterns").upsert(
      {
        pattern_id: observation.patternId,
        video_id: observation.videoId,
        channel_id: observation.channelId,
        evidence: observation.evidence,
        observed_at: observation.observedAt,
      },
      { onConflict: "pattern_id,video_id" },
    );
    if (error) fail("observePattern", error);
  }

  async listPatternObservations(patternId: string): Promise<PatternObservation[]> {
    const { data, error } = await this.client
      .from("radar_video_patterns")
      .select("*")
      .eq("pattern_id", patternId);
    if (error) fail("listPatternObservations", error);
    return (data ?? []).map((row) => ({
      patternId: row.pattern_id,
      videoId: row.video_id,
      channelId: row.channel_id,
      observedAt: row.observed_at,
      evidence: row.evidence,
    }));
  }

  async upsertOpportunity(opportunity: OpportunityUpsert): Promise<RadarOpportunity> {
    let existingQuery = this.client
      .from("radar_opportunities")
      .select("*")
      .eq("source_video_id", opportunity.sourceVideoId)
      .eq("project_id", opportunity.projectId);
    existingQuery = opportunity.sourcePatternId
      ? existingQuery.eq("source_pattern_id", opportunity.sourcePatternId)
      : existingQuery.is("source_pattern_id", null);

    const { data: existing, error: selectError } = await existingQuery.maybeSingle();
    if (selectError) fail("upsertOpportunity(select)", selectError);

    const payload = {
      proposed_angle: opportunity.proposedAngle,
      proposed_hook: opportunity.proposedHook,
      content_format: opportunity.contentFormat,
      rationale: opportunity.rationale,
      evidence_summary: opportunity.evidenceSummary,
      confidence: opportunity.confidence,
      fact_requirements: opportunity.factRequirements,
      updated_at: this.now(),
    };

    if (existing) {
      // `status` is absent from the payload on purpose: an operator's
      // save/reject decision must survive re-processing (spec §40).
      const { data, error } = await this.client
        .from("radar_opportunities")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
      if (error || !data) fail("upsertOpportunity(update)", error);
      return mapOpportunity(data);
    }

    const { data, error } = await this.client
      .from("radar_opportunities")
      .insert({
        ...payload,
        source_video_id: opportunity.sourceVideoId,
        project_id: opportunity.projectId,
        source_pattern_id: opportunity.sourcePatternId,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      if (!isUniqueViolation(error)) fail("upsertOpportunity(insert)", error);
      return this.upsertOpportunity(opportunity);
    }
    return mapOpportunity(data as RadarOpportunityRow);
  }

  async listOpportunities(options?: {
    projectId?: string;
    status?: OpportunityStatus;
  }): Promise<RadarOpportunity[]> {
    let query = this.client
      .from("radar_opportunities")
      .select("*")
      .order("created_at", { ascending: false });
    if (options?.projectId) query = query.eq("project_id", options.projectId);
    if (options?.status) query = query.eq("status", options.status);
    const { data, error } = await query;
    if (error) fail("listOpportunities", error);
    return (data ?? []).map(mapOpportunity);
  }

  async updateOpportunityStatus(
    id: string,
    status: OpportunityStatus,
  ): Promise<RadarOpportunity | null> {
    const { data, error } = await this.client
      .from("radar_opportunities")
      .update({ status, updated_at: this.now() })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) fail("updateOpportunityStatus", error);
    return data ? mapOpportunity(data) : null;
  }

  async createRun(run: RadarRun): Promise<RadarRun> {
    const { data, error } = await this.client
      .from("radar_runs")
      .upsert(
        {
          id: run.id,
          status: run.status,
          started_at: run.startedAt,
          completed_at: run.completedAt,
          pipeline_version: run.pipelineVersion,
          scoring_version: run.scoringVersion,
          counters: run.counters,
          failures: run.failures,
        },
        { onConflict: "id" },
      )
      .select()
      .single();
    if (error || !data) fail("createRun", error);
    return mapRun(data);
  }

  async updateRun(id: string, patch: Partial<RadarRun>): Promise<RadarRun | null> {
    const payload: Partial<RadarRunRow> = {};
    if (patch.status !== undefined) payload.status = patch.status;
    if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt;
    if (patch.counters !== undefined) payload.counters = patch.counters;
    if (patch.failures !== undefined) payload.failures = patch.failures;

    const { data, error } = await this.client
      .from("radar_runs")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) fail("updateRun", error);
    return data ? mapRun(data) : null;
  }

  async getRun(id: string): Promise<RadarRun | null> {
    const { data, error } = await this.client
      .from("radar_runs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) fail("getRun", error);
    return data ? mapRun(data) : null;
  }

  async listRuns(limit = 20): Promise<RadarRun[]> {
    const { data, error } = await this.client
      .from("radar_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) fail("listRuns", error);
    return (data ?? []).map(mapRun);
  }
}
