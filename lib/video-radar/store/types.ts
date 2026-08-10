/**
 * Radar persistence boundary.
 *
 * Two implementations exist because the audit found Supabase configured but not
 * provisioned (Decision Log D-005, NEEDS_OWNER): a Supabase store for when a
 * project exists, and an in-memory store for tests and unconfigured
 * environments. Selection happens at runtime in ./index.ts, so no pipeline code
 * ever branches on whether a database is present.
 *
 * Every write is expressed as an upsert on a deterministic key, because §40
 * requires the whole pipeline to tolerate reruns: a duplicate scheduler
 * invocation, a retry or a deployment restart must not create a second video,
 * transcript, opportunity or pattern observation.
 */

import type {
  AnalysisStatus,
  DiscoveryOriginKind,
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
  VideoType,
} from "../contracts";
import type { StructuredAnalysis } from "../analysis/schema";

export interface VideoUpsert {
  platform: "youtube";
  externalVideoId: string;
  channelId: string;
  channelName: string;
  title: string;
  description: string;
  sourceUrl: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  durationSeconds: number | null;
  videoType: VideoType;
  language: string | null;
  latestViews: number | null;
  latestLikes: number | null;
  latestComments: number | null;
  latestChannelSubscribers: number | null;
}

export interface OriginUpsert {
  videoId: string;
  kind: DiscoveryOriginKind;
  topicId: string | null;
  creatorId: string | null;
  searchTerm: string | null;
  discoveredAt: string;
}

export interface ScoreRecord {
  runId: string;
  videoId: string;
  baselineViews: number | null;
  baselineSampleSize: number;
  baselineConfidence: string;
  baselineVersion: string;
  outlierRatio: number | null;
  outlierBand: string;
  outlierMaturity: string;
  relevanceScore: number;
  candidateScore: number;
  scoreComponents: unknown;
  scoringVersion: string;
  shortlisted: boolean;
  gateReasons: string[];
}

export interface AnalysisRecord {
  videoId: string;
  promptVersion: string;
  schemaVersion: string;
  model: string;
  analysis: StructuredAnalysis;
  analyzedAt: string;
}

export interface PatternObservation {
  patternId: string;
  videoId: string;
  channelId: string;
  observedAt: string;
  evidence: string;
}

export interface OpportunityUpsert {
  sourceVideoId: string;
  projectId: string;
  proposedAngle: string;
  proposedHook: string;
  contentFormat: string;
  sourcePatternId: string | null;
  rationale: string;
  evidenceSummary: string;
  confidence: "high" | "medium" | "low";
  factRequirements: string[];
}

export interface RadarStore {
  /** False for the in-memory store, so the UI can say so instead of implying durability. */
  readonly durable: boolean;
  readonly kind: "supabase" | "memory";

  listTopics(options?: { activeOnly?: boolean }): Promise<RadarTopic[]>;
  upsertTopic(topic: Omit<RadarTopic, "id" | "createdAt" | "updatedAt">): Promise<RadarTopic>;
  updateTopic(id: string, patch: Partial<RadarTopic>): Promise<RadarTopic | null>;

  listCreators(options?: { activeOnly?: boolean }): Promise<RadarCreator[]>;
  upsertCreator(creator: Omit<RadarCreator, "id" | "createdAt" | "updatedAt">): Promise<RadarCreator>;
  updateCreator(id: string, patch: Partial<RadarCreator>): Promise<RadarCreator | null>;

  /**
   * Upsert on (platform, externalVideoId). Repeated discovery updates, never
   * duplicates. `created` distinguishes a genuinely new video from a refresh,
   * so the run's discovered/updated counters stay honest without the caller
   * having to query first.
   */
  upsertVideo(video: VideoUpsert): Promise<{ video: RadarVideo; created: boolean }>;
  getVideo(id: string): Promise<RadarVideo | null>;
  listVideos(options?: {
    channelId?: string;
    shortlistedInRun?: string;
    limit?: number;
  }): Promise<RadarVideo[]>;
  /** Comparable history for baseline construction — same channel, all types. */
  listChannelHistory(channelId: string): Promise<RadarVideo[]>;
  setVideoStatuses(
    id: string,
    patch: { transcriptStatus?: TranscriptStatus; analysisStatus?: AnalysisStatus },
  ): Promise<void>;

  addOrigin(origin: OriginUpsert): Promise<void>;
  listOrigins(videoId: string): Promise<OriginUpsert[]>;

  addSnapshot(snapshot: RadarMetricSnapshot & { runId: string }): Promise<void>;
  listSnapshots(videoId: string): Promise<RadarMetricSnapshot[]>;

  saveScore(score: ScoreRecord): Promise<void>;
  listScores(runId: string): Promise<ScoreRecord[]>;

  getTranscript(videoId: string): Promise<RadarTranscript | null>;
  saveTranscript(transcript: RadarTranscript): Promise<void>;

  getAnalysis(videoId: string, promptVersion: string): Promise<AnalysisRecord | null>;
  saveAnalysis(record: AnalysisRecord): Promise<void>;
  listAnalyses(videoIds: string[]): Promise<AnalysisRecord[]>;

  /** Upsert on canonical name so the same mechanic never becomes two patterns. */
  upsertPattern(pattern: {
    canonicalName: string;
    description: string;
    category: string;
    observedAt: string;
  }): Promise<RadarPattern>;
  listPatterns(): Promise<RadarPattern[]>;
  observePattern(observation: PatternObservation): Promise<void>;
  listPatternObservations(patternId: string): Promise<PatternObservation[]>;

  upsertOpportunity(opportunity: OpportunityUpsert): Promise<RadarOpportunity>;
  listOpportunities(options?: { projectId?: string; status?: OpportunityStatus }): Promise<RadarOpportunity[]>;
  updateOpportunityStatus(id: string, status: OpportunityStatus): Promise<RadarOpportunity | null>;

  createRun(run: RadarRun): Promise<RadarRun>;
  updateRun(id: string, patch: Partial<RadarRun>): Promise<RadarRun | null>;
  getRun(id: string): Promise<RadarRun | null>;
  listRuns(limit?: number): Promise<RadarRun[]>;
}
