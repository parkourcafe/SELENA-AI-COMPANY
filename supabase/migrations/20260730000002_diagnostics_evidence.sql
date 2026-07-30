-- Selena Visibility — evidence tables (SSOT §12.1).
-- Additive only. Depends on 20260730000001_diagnostics_core.sql.

create table if not exists public.scan_pages (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.diagnostic_runs (id) on delete cascade,
  requested_url text not null,
  final_url text,
  status_code integer,
  content_type text,
  bytes_read integer,
  fetched_at timestamptz,
  title text,
  canonical_url text,
  robots_meta text,
  x_robots_tag text,
  text_length integer,
  html_hash text,
  raw_storage_ref text,
  fetch_error_code text,
  created_at timestamptz not null default now()
);

create index if not exists scan_pages_run_id_idx on public.scan_pages (run_id);

create table if not exists public.scan_checks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.diagnostic_runs (id) on delete cascade,
  page_id uuid references public.scan_pages (id) on delete set null,
  rule_id text not null,
  rule_version integer not null,
  dimension text not null,
  state text not null check (state in ('pass', 'warn', 'fail', 'not_measured')),
  score_fraction numeric,
  weight numeric not null,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  observed_value jsonb,
  evidence jsonb,
  source_url text,
  observed_at timestamptz not null default now()
);

comment on table public.scan_checks is
  'state=not_measured must never be treated as a fail when computing denominators (SSOT §8.3).';

create index if not exists scan_checks_run_id_idx on public.scan_checks (run_id);
create index if not exists scan_checks_rule_id_idx on public.scan_checks (rule_id);

create table if not exists public.ai_prompt_runs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.diagnostic_runs (id) on delete cascade,
  provider_key text not null,
  engine_key text not null,
  environment_label text not null,
  web_grounded boolean not null,
  prompt_template_id text not null,
  prompt_text text not null,
  market_code text not null,
  language_code text not null,
  status text not null check (status in ('pending', 'succeeded', 'failed', 'invalid')),
  provider_run_id text,
  provider_prompt_id text,
  run_date date not null default current_date,
  valid boolean not null default false,
  error_code text,
  raw_private_ref text,
  answer_hash text,
  created_at timestamptz not null default now()
);

comment on table public.ai_prompt_runs is
  'environment_label must never be presented as the literal consumer product name unless the provider is genuinely web-grounded for it (SSOT §8.7).';

create index if not exists ai_prompt_runs_run_id_idx on public.ai_prompt_runs (run_id);

create table if not exists public.ai_observations (
  id uuid primary key default gen_random_uuid(),
  prompt_run_id uuid not null references public.ai_prompt_runs (id) on delete cascade,
  brand_mentioned boolean,
  brand_linked boolean,
  owned_domain_cited boolean,
  recommended boolean,
  mention_position integer,
  sentiment text,
  competitor_mentions jsonb,
  evidence_excerpt text,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  created_at timestamptz not null default now()
);

create index if not exists ai_observations_prompt_run_id_idx on public.ai_observations (prompt_run_id);

create table if not exists public.ai_citations (
  id uuid primary key default gen_random_uuid(),
  prompt_run_id uuid not null references public.ai_prompt_runs (id) on delete cascade,
  url text not null,
  domain text not null,
  title text,
  source_position integer,
  owned_domain boolean not null default false,
  observed_at timestamptz not null default now()
);

create index if not exists ai_citations_prompt_run_id_idx on public.ai_citations (prompt_run_id);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.diagnostic_runs (id) on delete cascade,
  rule_id text not null,
  category text not null,
  severity text not null check (severity in ('critical', 'important', 'later')),
  status text not null default 'open',
  title_key text not null,
  evidence_ids uuid[] not null default '{}',
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  recommended_action_key text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists issues_run_id_idx on public.issues (run_id);
