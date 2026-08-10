/**
 * Row types for the Video Radar tables, mirroring
 * supabase/migrations/20260810000001_video_radar.sql.
 *
 * Kept in its own file rather than inlined into ./types.ts so the diagnostics
 * types stay readable, and so both can be deleted together when
 * `supabase gen types typescript` becomes possible (see the note in ./types.ts:
 * do not hand-maintain generated and hand-written types in parallel).
 */

/** `Relationships` is required by postgrest-js's GenericTable — see the note in ./types.ts. */
type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export type RadarTopicRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  active: boolean;
  priority: number;
  keywords: string[];
  negative_keywords: string[];
  languages: string[];
  target_projects: string[];
  created_at: string;
  updated_at: string;
}

export type RadarCreatorRow = {
  id: string;
  platform: "youtube";
  external_channel_id: string;
  channel_name: string;
  channel_url: string;
  active: boolean;
  priority: number;
  tags: string[];
  languages: string[];
  target_projects: string[];
  subscriber_count: number | null;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
}

export type RadarVideoRow = {
  id: string;
  platform: "youtube";
  external_video_id: string;
  channel_id: string;
  channel_name: string;
  title: string;
  description: string;
  source_url: string;
  thumbnail_url: string | null;
  published_at: string;
  discovered_at: string;
  duration_seconds: number | null;
  video_type: "short" | "long" | "unknown";
  language: string | null;
  latest_views: number | null;
  latest_likes: number | null;
  latest_comments: number | null;
  latest_channel_subscribers: number | null;
  transcript_status: "pending" | "available" | "unavailable" | "blocked" | "failed" | "unsupported";
  analysis_status: "pending" | "completed" | "failed" | "skipped";
  created_at: string;
  updated_at: string;
}

export type RadarVideoOriginRow = {
  id: string;
  video_id: string;
  kind: "watchlist" | "topic";
  topic_id: string | null;
  creator_id: string | null;
  search_term: string | null;
  discovered_at: string;
}

export type RadarVideoMetricRow = {
  id: string;
  video_id: string;
  run_id: string | null;
  captured_at: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  channel_subscribers: number | null;
}

export type RadarVideoScoreRow = {
  id: string;
  run_id: string;
  video_id: string;
  baseline_views: number | null;
  baseline_sample_size: number;
  baseline_confidence: "high" | "medium" | "low" | "unavailable";
  baseline_version: string;
  outlier_ratio: number | null;
  outlier_band: string;
  outlier_maturity: "provisional" | "mature";
  relevance_score: number;
  candidate_score: number;
  score_components: unknown;
  scoring_version: string;
  shortlisted: boolean;
  gate_reasons: string[];
  created_at: string;
}

export type RadarTranscriptRow = {
  video_id: string;
  status: "pending" | "available" | "unavailable" | "blocked" | "failed" | "unsupported";
  language: string | null;
  provider: string;
  text: string | null;
  fetched_at: string | null;
  failure_reason: string | null;
  updated_at: string;
}

export type RadarAnalysisRow = {
  id: string;
  video_id: string;
  prompt_version: string;
  schema_version: string;
  model: string;
  analysis: unknown;
  analyzed_at: string;
}

export type RadarPatternRow = {
  id: string;
  canonical_name: string;
  description: string;
  category: string;
  first_seen_at: string;
  last_seen_at: string;
}

export type RadarVideoPatternRow = {
  id: string;
  pattern_id: string;
  video_id: string;
  channel_id: string;
  evidence: string;
  observed_at: string;
}

export type RadarOpportunityRow = {
  id: string;
  source_video_id: string;
  project_id: string;
  proposed_angle: string;
  proposed_hook: string;
  content_format: string;
  source_pattern_id: string | null;
  rationale: string;
  evidence_summary: string;
  confidence: "high" | "medium" | "low";
  fact_requirements: string[];
  status: "new" | "saved" | "rejected" | "sent_to_pipeline";
  created_at: string;
  updated_at: string;
}

export type RadarRunRow = {
  id: string;
  status: "running" | "completed" | "partial" | "failed";
  started_at: string;
  completed_at: string | null;
  pipeline_version: string;
  scoring_version: string;
  counters: unknown;
  failures: unknown;
}

export type RadarRunItemRow = {
  id: string;
  run_id: string;
  stage: string;
  subject_id: string | null;
  state: "pending" | "processing" | "completed" | "failed" | "skipped";
  error_code: string | null;
  error_message: string | null;
  updated_at: string;
}

/** A type alias, not an interface — see the note in ./types.ts on GenericSchema. */
export type RadarTables = {
  radar_topics: Table<RadarTopicRow>;
  radar_creators: Table<RadarCreatorRow>;
  radar_videos: Table<RadarVideoRow>;
  radar_video_origins: Table<RadarVideoOriginRow>;
  radar_video_metrics: Table<RadarVideoMetricRow>;
  radar_video_scores: Table<RadarVideoScoreRow>;
  radar_transcripts: Table<RadarTranscriptRow>;
  radar_analyses: Table<RadarAnalysisRow>;
  radar_patterns: Table<RadarPatternRow>;
  radar_video_patterns: Table<RadarVideoPatternRow>;
  radar_opportunities: Table<RadarOpportunityRow>;
  radar_runs: Table<RadarRunRow>;
  radar_run_items: Table<RadarRunItemRow>;
};
