/**
 * In-memory Radar store.
 *
 * Two jobs: back the unit tests without touching a database (spec §57), and
 * keep the Radar honest-but-working when Supabase is unconfigured (D-005).
 *
 * KNOWN LIMITATION, surfaced in the UI rather than hidden: state lives in
 * process memory, so on serverless it does not survive an invocation. Baselines
 * accumulated during a run are real; anything expected to persist between runs
 * needs the Supabase store. `durable` is false so callers can say so out loud.
 */

import type {
  AnalysisStatus,
  OpportunityStatus,
  RadarCreator,
  RadarMetricSnapshot,
  RadarOpportunity,
  RadarPattern,
  RadarRun,
  RadarTopic,
  RadarTranscript,
  RadarVideo,
  TranscriptStatus,
} from "../contracts";
import type {
  AnalysisRecord,
  OpportunityUpsert,
  OriginUpsert,
  PatternObservation,
  RadarStore,
  ScoreRecord,
  VideoUpsert,
} from "./types";

/** Deterministic ids double as the dedupe key, which is what makes reruns idempotent. */
export const videoKey = (platform: string, externalVideoId: string) => `${platform}:${externalVideoId}`;
export const creatorKey = (platform: string, externalChannelId: string) =>
  `${platform}:${externalChannelId}`;
export const opportunityKey = (videoId: string, projectId: string, patternId: string | null) =>
  `${videoId}|${projectId}|${patternId ?? "none"}`;
export const originKey = (origin: OriginUpsert) =>
  `${origin.videoId}|${origin.kind}|${origin.topicId ?? ""}|${origin.creatorId ?? ""}`;

export class InMemoryRadarStore implements RadarStore {
  readonly durable = false;
  readonly kind = "memory" as const;

  private topics = new Map<string, RadarTopic>();
  private creators = new Map<string, RadarCreator>();
  private videos = new Map<string, RadarVideo>();
  private origins = new Map<string, OriginUpsert>();
  private snapshots = new Map<string, RadarMetricSnapshot & { runId: string }>();
  private scores = new Map<string, ScoreRecord>();
  private transcripts = new Map<string, RadarTranscript>();
  private analyses = new Map<string, AnalysisRecord>();
  private patterns = new Map<string, RadarPattern>();
  private observations = new Map<string, PatternObservation>();
  private opportunities = new Map<string, RadarOpportunity>();
  private runs = new Map<string, RadarRun>();

  private now(): string {
    return new Date().toISOString();
  }

  async listTopics(options?: { activeOnly?: boolean }): Promise<RadarTopic[]> {
    const all = [...this.topics.values()];
    return options?.activeOnly ? all.filter((topic) => topic.active) : all;
  }

  async upsertTopic(topic: Omit<RadarTopic, "id" | "createdAt" | "updatedAt">): Promise<RadarTopic> {
    const existing = this.topics.get(topic.slug);
    const record: RadarTopic = {
      ...topic,
      id: topic.slug,
      createdAt: existing?.createdAt ?? this.now(),
      updatedAt: this.now(),
    };
    this.topics.set(record.id, record);
    return record;
  }

  async updateTopic(id: string, patch: Partial<RadarTopic>): Promise<RadarTopic | null> {
    const existing = this.topics.get(id);
    if (!existing) return null;
    const record = { ...existing, ...patch, id, updatedAt: this.now() };
    this.topics.set(id, record);
    return record;
  }

  async listCreators(options?: { activeOnly?: boolean }): Promise<RadarCreator[]> {
    const all = [...this.creators.values()];
    return options?.activeOnly ? all.filter((creator) => creator.active) : all;
  }

  async upsertCreator(
    creator: Omit<RadarCreator, "id" | "createdAt" | "updatedAt">,
  ): Promise<RadarCreator> {
    const id = creatorKey(creator.platform, creator.externalChannelId);
    const existing = this.creators.get(id);
    const record: RadarCreator = {
      ...creator,
      id,
      createdAt: existing?.createdAt ?? this.now(),
      updatedAt: this.now(),
    };
    this.creators.set(id, record);
    return record;
  }

  async updateCreator(id: string, patch: Partial<RadarCreator>): Promise<RadarCreator | null> {
    const existing = this.creators.get(id);
    if (!existing) return null;
    const record = { ...existing, ...patch, id, updatedAt: this.now() };
    this.creators.set(id, record);
    return record;
  }

  async upsertVideo(video: VideoUpsert): Promise<{ video: RadarVideo; created: boolean }> {
    const id = videoKey(video.platform, video.externalVideoId);
    const existing = this.videos.get(id);
    const record: RadarVideo = {
      ...video,
      id,
      // Preserve the original discovery timestamp and pipeline statuses across
      // re-discovery: this is an update, not a reset.
      discoveredAt: existing?.discoveredAt ?? this.now(),
      transcriptStatus: existing?.transcriptStatus ?? "pending",
      analysisStatus: existing?.analysisStatus ?? "pending",
      createdAt: existing?.createdAt ?? this.now(),
      updatedAt: this.now(),
    };
    this.videos.set(id, record);
    return { video: record, created: !existing };
  }

  async getVideo(id: string): Promise<RadarVideo | null> {
    return this.videos.get(id) ?? null;
  }

  async listVideos(options?: {
    channelId?: string;
    shortlistedInRun?: string;
    limit?: number;
  }): Promise<RadarVideo[]> {
    let all = [...this.videos.values()];
    if (options?.channelId) all = all.filter((video) => video.channelId === options.channelId);
    if (options?.shortlistedInRun) {
      const shortlisted = new Set(
        [...this.scores.values()]
          .filter((score) => score.runId === options.shortlistedInRun && score.shortlisted)
          .map((score) => score.videoId),
      );
      all = all.filter((video) => shortlisted.has(video.id));
    }
    all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return options?.limit ? all.slice(0, options.limit) : all;
  }

  async listChannelHistory(channelId: string): Promise<RadarVideo[]> {
    return this.listVideos({ channelId });
  }

  async setVideoStatuses(
    id: string,
    patch: { transcriptStatus?: TranscriptStatus; analysisStatus?: AnalysisStatus },
  ): Promise<void> {
    const existing = this.videos.get(id);
    if (!existing) return;
    this.videos.set(id, { ...existing, ...patch, updatedAt: this.now() });
  }

  async addOrigin(origin: OriginUpsert): Promise<void> {
    const key = originKey(origin);
    // One video, many origins — but the SAME origin recorded twice is one row,
    // so a rerun does not inflate provenance (spec §12, §40).
    if (!this.origins.has(key)) this.origins.set(key, origin);
  }

  async listOrigins(videoId: string): Promise<OriginUpsert[]> {
    return [...this.origins.values()].filter((origin) => origin.videoId === videoId);
  }

  async addSnapshot(snapshot: RadarMetricSnapshot & { runId: string }): Promise<void> {
    // Keyed by (video, run): a retried run reuses its snapshot instead of
    // stacking duplicates, while a genuinely new run adds a new observation.
    this.snapshots.set(`${snapshot.videoId}|${snapshot.runId}`, snapshot);
  }

  async listSnapshots(videoId: string): Promise<RadarMetricSnapshot[]> {
    return [...this.snapshots.values()]
      .filter((snapshot) => snapshot.videoId === videoId)
      .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());
  }

  async saveScore(score: ScoreRecord): Promise<void> {
    this.scores.set(`${score.runId}|${score.videoId}`, score);
  }

  async listScores(runId: string): Promise<ScoreRecord[]> {
    return [...this.scores.values()].filter((score) => score.runId === runId);
  }

  async getTranscript(videoId: string): Promise<RadarTranscript | null> {
    return this.transcripts.get(videoId) ?? null;
  }

  async saveTranscript(transcript: RadarTranscript): Promise<void> {
    this.transcripts.set(transcript.videoId, transcript);
  }

  async getAnalysis(videoId: string, promptVersion: string): Promise<AnalysisRecord | null> {
    return this.analyses.get(`${videoId}|${promptVersion}`) ?? null;
  }

  async saveAnalysis(record: AnalysisRecord): Promise<void> {
    // Keyed by prompt version so a later prompt revision produces a NEW row and
    // old interpretation stays distinguishable (spec §51).
    this.analyses.set(`${record.videoId}|${record.promptVersion}`, record);
  }

  async listAnalyses(videoIds: string[]): Promise<AnalysisRecord[]> {
    const wanted = new Set(videoIds);
    return [...this.analyses.values()].filter((record) => wanted.has(record.videoId));
  }

  async upsertPattern(pattern: {
    canonicalName: string;
    description: string;
    category: string;
    observedAt: string;
  }): Promise<RadarPattern> {
    const existing = this.patterns.get(pattern.canonicalName);
    const record: RadarPattern = {
      id: pattern.canonicalName,
      canonicalName: pattern.canonicalName,
      description: existing?.description ?? pattern.description,
      category: existing?.category ?? pattern.category,
      firstSeenAt: existing?.firstSeenAt ?? pattern.observedAt,
      lastSeenAt: pattern.observedAt,
      // Derived from distinct observations below, never incremented here —
      // incrementing would double-count on a rerun (spec §40).
      observationCount: existing?.observationCount ?? 0,
    };
    this.patterns.set(record.id, record);
    return record;
  }

  async listPatterns(): Promise<RadarPattern[]> {
    return [...this.patterns.values()].map((pattern) => ({
      ...pattern,
      observationCount: [...this.observations.values()].filter(
        (observation) => observation.patternId === pattern.id,
      ).length,
    }));
  }

  async observePattern(observation: PatternObservation): Promise<void> {
    this.observations.set(`${observation.patternId}|${observation.videoId}`, observation);
  }

  async listPatternObservations(patternId: string): Promise<PatternObservation[]> {
    return [...this.observations.values()].filter(
      (observation) => observation.patternId === patternId,
    );
  }

  async upsertOpportunity(opportunity: OpportunityUpsert): Promise<RadarOpportunity> {
    const id = opportunityKey(
      opportunity.sourceVideoId,
      opportunity.projectId,
      opportunity.sourcePatternId,
    );
    const existing = this.opportunities.get(id);
    const record: RadarOpportunity = {
      ...opportunity,
      id,
      // An operator's save/reject decision survives re-processing; only a brand
      // new opportunity starts at `new`.
      status: existing?.status ?? "new",
      createdAt: existing?.createdAt ?? this.now(),
      updatedAt: this.now(),
    };
    this.opportunities.set(id, record);
    return record;
  }

  async listOpportunities(options?: {
    projectId?: string;
    status?: OpportunityStatus;
  }): Promise<RadarOpportunity[]> {
    let all = [...this.opportunities.values()];
    if (options?.projectId) all = all.filter((item) => item.projectId === options.projectId);
    if (options?.status) all = all.filter((item) => item.status === options.status);
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async updateOpportunityStatus(
    id: string,
    status: OpportunityStatus,
  ): Promise<RadarOpportunity | null> {
    const existing = this.opportunities.get(id);
    if (!existing) return null;
    const record = { ...existing, status, updatedAt: this.now() };
    this.opportunities.set(id, record);
    return record;
  }

  async createRun(run: RadarRun): Promise<RadarRun> {
    this.runs.set(run.id, run);
    return run;
  }

  async updateRun(id: string, patch: Partial<RadarRun>): Promise<RadarRun | null> {
    const existing = this.runs.get(id);
    if (!existing) return null;
    const record = { ...existing, ...patch, id };
    this.runs.set(id, record);
    return record;
  }

  async getRun(id: string): Promise<RadarRun | null> {
    return this.runs.get(id) ?? null;
  }

  async listRuns(limit = 20): Promise<RadarRun[]> {
    return [...this.runs.values()]
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit);
  }
}
