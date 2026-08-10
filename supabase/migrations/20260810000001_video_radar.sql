-- Video Research Radar v1 — additive schema.
--
-- Follows the conventions established by the diagnostics migrations: additive
-- only (never DROP or destructively ALTER here), pgcrypto for uuid defaults,
-- and an RLS lockdown at the end so only the service role can touch these
-- tables. Like 20260730000001, this is NOT applied to any live project yet —
-- the Supabase project is Decision Log D-005 (NEEDS_OWNER) — so it is written
-- now to be reviewable before that decision is made.
--
-- Every table here earns its place (spec §55): topics/creators are runtime-
-- editable so they cannot be JSON files; origins, snapshots, observations and
-- scores are all one-to-many against a video and would corrupt into ambiguity
-- as blobs; and the unique constraints below ARE the idempotency guarantee
-- required by §40.

create extension if not exists "pgcrypto";

-- §10 — research topics, editable at runtime.
create table if not exists public.radar_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  priority integer not null default 3,
  keywords text[] not null default '{}',
  negative_keywords text[] not null default '{}',
  languages text[] not null default '{}',
  target_projects text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- §11 — manually curated creator watchlist.
create table if not exists public.radar_creators (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'youtube' check (platform in ('youtube')),
  external_channel_id text not null,
  channel_name text not null default '',
  channel_url text not null default '',
  active boolean not null default true,
  priority integer not null default 3,
  tags text[] not null default '{}',
  languages text[] not null default '{}',
  target_projects text[] not null default '{}',
  subscriber_count bigint,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, external_channel_id)
);

-- §14 — normalized source video. The unique constraint is the dedupe contract:
-- repeated discovery UPDATEs rather than duplicating.
create table if not exists public.radar_videos (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'youtube' check (platform in ('youtube')),
  external_video_id text not null,
  channel_id text not null,
  channel_name text not null default '',
  title text not null default '',
  description text not null default '',
  source_url text not null,
  thumbnail_url text,
  published_at timestamptz not null,
  discovered_at timestamptz not null default now(),
  duration_seconds integer,
  -- §15: 'unknown' is a first-class value. An uncertain video is never forced
  -- into short/long, because a Short scored against long-form baselines
  -- produces a confident wrong answer.
  video_type text not null default 'unknown' check (video_type in ('short', 'long', 'unknown')),
  language text,
  latest_views bigint,
  latest_likes bigint,
  latest_comments bigint,
  latest_channel_subscribers bigint,
  transcript_status text not null default 'pending'
    check (transcript_status in ('pending', 'available', 'unavailable', 'blocked', 'failed', 'unsupported')),
  analysis_status text not null default 'pending'
    check (analysis_status in ('pending', 'completed', 'failed', 'skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, external_video_id)
);

comment on column public.radar_videos.latest_likes is
  'NULL means hidden or unreported, never zero (SSOT §23) — a hidden like count must not read as no engagement.';

create index if not exists radar_videos_channel_idx on public.radar_videos (channel_id, video_type);
create index if not exists radar_videos_published_idx on public.radar_videos (published_at desc);

-- §12 — one video can be found several ways without duplicating the video.
create table if not exists public.radar_video_origins (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.radar_videos (id) on delete cascade,
  kind text not null check (kind in ('watchlist', 'topic')),
  topic_id uuid references public.radar_topics (id) on delete set null,
  creator_id uuid references public.radar_creators (id) on delete set null,
  search_term text,
  discovered_at timestamptz not null default now()
);

-- Partial unique indexes rather than one constraint: NULL never equals NULL in
-- SQL, so a plain unique(video_id, kind, topic_id, creator_id) would happily
-- accept the same topic origin twice.
create unique index if not exists radar_video_origins_topic_idx
  on public.radar_video_origins (video_id, topic_id) where topic_id is not null;
create unique index if not exists radar_video_origins_creator_idx
  on public.radar_video_origins (video_id, creator_id) where creator_id is not null;

-- §16, §22 — periodic snapshots. Two or more of these are the ONLY honest basis
-- for velocity. Keyed by run so a retried run updates instead of stacking.
create table if not exists public.radar_video_metrics (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.radar_videos (id) on delete cascade,
  run_id uuid,
  captured_at timestamptz not null default now(),
  views bigint,
  likes bigint,
  comments bigint,
  channel_subscribers bigint,
  unique (video_id, run_id)
);

create index if not exists radar_video_metrics_video_idx
  on public.radar_video_metrics (video_id, captured_at desc);

-- §25, §52 — one score row per (run, video), keeping every component value and
-- the versions that produced them, so an old ranking stays interpretable.
create table if not exists public.radar_video_scores (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  video_id uuid not null references public.radar_videos (id) on delete cascade,
  baseline_views numeric,
  baseline_sample_size integer not null default 0,
  baseline_confidence text not null check (baseline_confidence in ('high', 'medium', 'low', 'unavailable')),
  baseline_version text not null,
  outlier_ratio numeric,
  outlier_band text not null,
  outlier_maturity text not null check (outlier_maturity in ('provisional', 'mature')),
  relevance_score numeric not null default 0,
  candidate_score numeric not null default 0,
  score_components jsonb not null default '{}'::jsonb,
  scoring_version text not null,
  shortlisted boolean not null default false,
  gate_reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (run_id, video_id)
);

create index if not exists radar_video_scores_shortlist_idx
  on public.radar_video_scores (run_id, shortlisted, candidate_score desc);

-- §29 — one transcript per video, with its failure state preserved.
create table if not exists public.radar_transcripts (
  video_id uuid primary key references public.radar_videos (id) on delete cascade,
  status text not null check (status in ('pending', 'available', 'unavailable', 'blocked', 'failed', 'unsupported')),
  language text,
  provider text not null,
  text text,
  fetched_at timestamptz,
  failure_reason text,
  updated_at timestamptz not null default now()
);

-- §31, §51 — schema-validated AI output, versioned. A prompt revision writes a
-- NEW row rather than overwriting, so old interpretation stays distinguishable.
create table if not exists public.radar_analyses (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.radar_videos (id) on delete cascade,
  prompt_version text not null,
  schema_version text not null,
  model text not null,
  analysis jsonb not null,
  analyzed_at timestamptz not null default now(),
  unique (video_id, prompt_version)
);

-- §37 — reusable mechanics stored separately from videos.
create table if not exists public.radar_patterns (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  description text not null default '',
  category text not null default '',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- §38 — the evidence behind an "emerging" classification. channel_id is stored
-- on the edge so independent-creator counts do not require a join back through
-- videos at query time.
create table if not exists public.radar_video_patterns (
  id uuid primary key default gen_random_uuid(),
  pattern_id uuid not null references public.radar_patterns (id) on delete cascade,
  video_id uuid not null references public.radar_videos (id) on delete cascade,
  channel_id text not null,
  evidence text not null default '',
  observed_at timestamptz not null default now(),
  unique (pattern_id, video_id)
);

create index if not exists radar_video_patterns_pattern_idx
  on public.radar_video_patterns (pattern_id, observed_at desc);

-- §36 — project-specific content opportunities. No existing content entity
-- exists in this repository to reuse; `produced` is deliberately NOT a status
-- here, because production tracking belongs to a content workflow.
create table if not exists public.radar_opportunities (
  id uuid primary key default gen_random_uuid(),
  source_video_id uuid not null references public.radar_videos (id) on delete cascade,
  -- Slug of a project defined in lib/data/homepage.ts -> proof.projects. Not a
  -- foreign key: the project registry is that file, and duplicating it into a
  -- table would create the second registry §34 forbids.
  project_id text not null,
  proposed_angle text not null,
  proposed_hook text not null,
  content_format text not null,
  source_pattern_id uuid references public.radar_patterns (id) on delete set null,
  rationale text not null default '',
  evidence_summary text not null default '',
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  fact_requirements text[] not null default '{}',
  status text not null default 'new' check (status in ('new', 'saved', 'rejected', 'sent_to_pipeline')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.radar_opportunities.fact_requirements is
  'FACT_REQUIRED entries (SSOT §33). A missing project fact is flagged here, never invented into the angle or hook.';

-- Partial unique indexes again, because source_pattern_id is nullable.
create unique index if not exists radar_opportunities_unique_with_pattern
  on public.radar_opportunities (source_video_id, project_id, source_pattern_id)
  where source_pattern_id is not null;
create unique index if not exists radar_opportunities_unique_without_pattern
  on public.radar_opportunities (source_video_id, project_id)
  where source_pattern_id is null;

create index if not exists radar_opportunities_project_idx
  on public.radar_opportunities (project_id, status, created_at desc);

-- §41, §43 — run record and its observability counters.
create table if not exists public.radar_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running' check (status in ('running', 'completed', 'partial', 'failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  pipeline_version text not null,
  scoring_version text not null,
  counters jsonb not null default '{}'::jsonb,
  failures jsonb not null default '[]'::jsonb
);

create index if not exists radar_runs_started_idx on public.radar_runs (started_at desc);

-- §41 — per-item state so a single failure cannot kill the whole run.
create table if not exists public.radar_run_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.radar_runs (id) on delete cascade,
  stage text not null,
  subject_id text,
  state text not null default 'pending' check (state in ('pending', 'processing', 'completed', 'failed', 'skipped')),
  error_code text,
  error_message text,
  updated_at timestamptz not null default now(),
  unique (run_id, stage, subject_id)
);

-- RLS lockdown, matching 20260730000004: enabled with NO policies, so every
-- role except service_role (which bypasses RLS) is denied by default. The Radar
-- is operator tooling reached only from server routes — nothing here should
-- ever be readable by `anon` or `authenticated`.
alter table public.radar_topics enable row level security;
alter table public.radar_creators enable row level security;
alter table public.radar_videos enable row level security;
alter table public.radar_video_origins enable row level security;
alter table public.radar_video_metrics enable row level security;
alter table public.radar_video_scores enable row level security;
alter table public.radar_transcripts enable row level security;
alter table public.radar_analyses enable row level security;
alter table public.radar_patterns enable row level security;
alter table public.radar_video_patterns enable row level security;
alter table public.radar_opportunities enable row level security;
alter table public.radar_runs enable row level security;
alter table public.radar_run_items enable row level security;
