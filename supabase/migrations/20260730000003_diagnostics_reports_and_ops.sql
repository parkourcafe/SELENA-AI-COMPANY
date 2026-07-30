-- Selena Visibility — reports, provider usage, event log (SSOT §12.1).
-- Additive only. Depends on 20260730000001/20260730000002.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null unique references public.diagnostic_runs (id) on delete cascade,
  summary_json jsonb not null,
  full_json jsonb not null,
  generated_at timestamptz not null default now(),
  unlocked_at timestamptz,
  locale text not null,
  report_version text not null
);

comment on table public.reports is
  'summary_json is the ungated (pre-email) view; full_json requires unlock. Neither ever embeds the lead email (SSOT §12.3).';

create table if not exists public.provider_usage (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.diagnostic_runs (id) on delete cascade,
  provider_key text not null,
  operation text not null,
  units numeric,
  estimated_cost numeric,
  currency text,
  latency_ms integer,
  status text not null,
  created_at timestamptz not null default now()
);

comment on table public.provider_usage is
  'Backs the COGS guardrail for the $9 Monitor plan (Decision Log D-021: target <=$3.50, hard stop >$5.00 / project / month).';

create index if not exists provider_usage_run_id_idx on public.provider_usage (run_id);
create index if not exists provider_usage_provider_key_idx on public.provider_usage (provider_key);

create table if not exists public.diagnostic_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.diagnostic_runs (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  event_name text not null,
  properties jsonb,
  consent_class text not null check (consent_class in ('transactional', 'marketing', 'anonymous_product')),
  created_at timestamptz not null default now()
);

create index if not exists diagnostic_events_run_id_idx on public.diagnostic_events (run_id);
create index if not exists diagnostic_events_event_name_idx on public.diagnostic_events (event_name);
