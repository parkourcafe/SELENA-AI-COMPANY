/**
 * Video Research Radar — shared vocabulary.
 *
 * Mirrors the convention in lib/diagnostics/contracts.ts: one place for the
 * types, statuses and version stamps every Radar module speaks, so the UI,
 * store and pipeline never need to know provider-specific detail.
 */

import type { Confidence } from "@/lib/diagnostics/contracts";

export type { Confidence };

/** v1 is YouTube-only (spec §9). The union exists so a v2 provider is additive, not a rewrite. */
export type RadarPlatform = "youtube";

/**
 * Short / long / unknown (spec §15). `unknown` is a real state, not a
 * placeholder: an uncertain video is never forced into a bucket, because a
 * Short compared against long-form baselines produces a confident wrong answer.
 */
export type VideoType = "short" | "long" | "unknown";

export type BaselineConfidence = Confidence | "unavailable";

/** Whether a video has had enough exposure time for its outlier result to mean anything (spec §19). */
export type OutlierMaturity = "provisional" | "mature";

export type TranscriptStatus =
  | "pending"
  | "available"
  | "unavailable"
  | "blocked"
  | "failed"
  | "unsupported";

export type AnalysisStatus = "pending" | "completed" | "failed" | "skipped";

export type VelocityStatus = "measured" | "unavailable";

export type DiscoveryOriginKind = "watchlist" | "topic";

export type RunStatus = "running" | "completed" | "partial" | "failed";

export type RunItemState = "pending" | "processing" | "completed" | "failed" | "skipped";

export type OpportunityStatus = "new" | "saved" | "rejected" | "sent_to_pipeline";

/**
 * Version stamps recorded on every run, score and analysis (spec §51, §52).
 * Never bump silently — an old ranking must stay interpretable next to a new one.
 */
export const RADAR_VERSIONS = {
  pipeline: "radar-v1",
  scoring: "radar-scoring-v1",
  baseline: "radar-baseline-v1",
  analysisPrompt: "radar-analysis-v1",
  analysisSchema: "radar-analysis-schema-v1",
} as const;

/**
 * Radar-specific error codes. Deliberately a separate union from the Visibility
 * ERROR_CODES: sharing that list would force unrelated Visibility UI to know
 * about transcript failures. The shape and the code-not-message rule are the same.
 */
export const RADAR_ERROR_CODES = [
  "RADAR_DISABLED",
  "UNAUTHORIZED",
  "INVALID_INPUT",
  "NOT_FOUND",
  "STORE_UNAVAILABLE",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_RATE_LIMITED",
  "PROVIDER_AUTH_FAILED",
  "PROVIDER_QUOTA_EXCEEDED",
  "TRANSCRIPT_UNAVAILABLE",
  "ANALYSIS_UNAVAILABLE",
  "ANALYSIS_INVALID_OUTPUT",
  "RUN_IN_PROGRESS",
  "INTERNAL_ERROR",
] as const;

export type RadarErrorCode = (typeof RADAR_ERROR_CODES)[number];

export function isRadarErrorCode(value: unknown): value is RadarErrorCode {
  return typeof value === "string" && (RADAR_ERROR_CODES as readonly string[]).includes(value);
}

export interface RadarTopic {
  id: string;
  slug: string;
  name: string;
  description: string;
  active: boolean;
  priority: number;
  keywords: string[];
  negativeKeywords: string[];
  languages: string[];
  targetProjects: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RadarCreator {
  id: string;
  platform: RadarPlatform;
  externalChannelId: string;
  channelName: string;
  channelUrl: string;
  active: boolean;
  priority: number;
  tags: string[];
  languages: string[];
  targetProjects: string[];
  subscriberCount: number | null;
  lastScannedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RadarVideo {
  id: string;
  platform: RadarPlatform;
  externalVideoId: string;
  channelId: string;
  channelName: string;
  title: string;
  description: string;
  sourceUrl: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  discoveredAt: string;
  durationSeconds: number | null;
  videoType: VideoType;
  language: string | null;
  latestViews: number | null;
  latestLikes: number | null;
  latestComments: number | null;
  latestChannelSubscribers: number | null;
  transcriptStatus: TranscriptStatus;
  analysisStatus: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RadarDiscoveryOrigin {
  videoId: string;
  kind: DiscoveryOriginKind;
  topicId: string | null;
  creatorId: string | null;
  searchTerm: string | null;
  discoveredAt: string;
}

export interface RadarMetricSnapshot {
  videoId: string;
  capturedAt: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  channelSubscribers: number | null;
}

export interface BaselineResult {
  baselineViews: number | null;
  sampleSize: number;
  confidence: BaselineConfidence;
  baselineVersion: string;
}

export interface OutlierResult {
  ratio: number | null;
  band: string;
  maturity: OutlierMaturity;
  ageHours: number;
  available: boolean;
}

export interface VelocityResult {
  status: VelocityStatus;
  viewsPerHour: number | null;
  windowHours: number | null;
  snapshotCount: number;
}

export interface EngagementResult {
  likeRate: number | null;
  commentRate: number | null;
}

export interface RelevanceResult {
  score: number;
  matchedTopics: string[];
  matchedProjects: string[];
  matchedKeywords: string[];
  blockedByNegativeKeyword: boolean;
}

/** One weighted input to the candidate score, kept so a ranking can always be explained (spec §25, §26). */
export interface ScoreComponent {
  id: string;
  label: string;
  /** Normalized 0..1, or null when the underlying data is genuinely missing. */
  value: number | null;
  weight: number;
  /** weight × value after renormalizing over available components; 0 when unavailable. */
  contribution: number;
  available: boolean;
}

export interface CandidateScore {
  score: number;
  components: ScoreComponent[];
  scoringVersion: string;
  /** Sum of the weights of components that actually had data. Low values mean a thin ranking. */
  weightCoverage: number;
}

export interface RadarTranscript {
  videoId: string;
  status: TranscriptStatus;
  language: string | null;
  provider: string;
  text: string | null;
  fetchedAt: string | null;
  failureReason: string | null;
}

export interface RadarPattern {
  id: string;
  canonicalName: string;
  description: string;
  category: string;
  firstSeenAt: string;
  lastSeenAt: string;
  observationCount: number;
}

export interface PatternEmergence {
  patternId: string;
  emerging: boolean;
  qualifyingVideos: number;
  independentCreators: number;
  windowDays: number;
  evidenceVideoIds: string[];
}

export interface RadarOpportunity {
  id: string;
  sourceVideoId: string;
  projectId: string;
  proposedAngle: string;
  proposedHook: string;
  contentFormat: string;
  sourcePatternId: string | null;
  rationale: string;
  evidenceSummary: string;
  confidence: Confidence;
  factRequirements: string[];
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
}

/** Every counter the run surfaces (spec §43). Monetary cost is absent on purpose: no billing data is available. */
export interface RadarRunCounters {
  videosDiscovered: number;
  /** Channels whose back catalogue was fetched so a baseline could exist at all. */
  channelsBackfilled: number;
  videosUpdated: number;
  videosScored: number;
  shortlisted: number;
  transcriptsAttempted: number;
  transcriptsSucceeded: number;
  transcriptsFailed: number;
  analysesAttempted: number;
  analysesSucceeded: number;
  analysesFailed: number;
  opportunitiesProduced: number;
  patternsObserved: number;
  providerFailures: number;
}

export function emptyRunCounters(): RadarRunCounters {
  return {
    videosDiscovered: 0,
    channelsBackfilled: 0,
    videosUpdated: 0,
    videosScored: 0,
    shortlisted: 0,
    transcriptsAttempted: 0,
    transcriptsSucceeded: 0,
    transcriptsFailed: 0,
    analysesAttempted: 0,
    analysesSucceeded: 0,
    analysesFailed: 0,
    opportunitiesProduced: 0,
    patternsObserved: 0,
    providerFailures: 0,
  };
}

export interface RadarRun {
  id: string;
  status: RunStatus;
  startedAt: string;
  completedAt: string | null;
  pipelineVersion: string;
  scoringVersion: string;
  counters: RadarRunCounters;
  failures: RadarRunFailure[];
  /** Set when the run persisted nothing durable, so the UI never implies a database exists. */
  ephemeral: boolean;
}

export interface RadarRunFailure {
  stage: string;
  subjectId: string | null;
  code: RadarErrorCode;
  message: string;
  occurredAt: string;
}
