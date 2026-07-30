-- Selena Visibility — core diagnostic tables (SSOT §12.1).
-- Additive only (SSOT §27.4): never DROP or ALTER in a destructive way here.
-- This migration is NOT applied to any live project yet — Supabase
-- project/region is Decision Log D-005 (NEEDS_OWNER). It is written now so
-- schema review can happen before that decision is needed.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email citext,
  name text,
  company text,
  marketing_opt_in boolean not null default false,
  marketing_consent_version text,
  transactional_consent_at timestamptz,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.leads is
  'Anonymous-to-identified lead identity. marketing_opt_in defaults false — SSOT §5.3 forbids implying consent from delivery email alone.';

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  submitted_url text not null,
  normalized_url text not null,
  registrable_domain text not null,
  final_url text,
  brand_name text not null,
  business_category text not null,
  market_code text not null,
  language_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (normalized_url, market_code, language_code, brand_name)
);

comment on table public.sites is
  'One row per (domain, market, language, brand) — the same domain can have multiple offers (SSOT §4.1).';

create table if not exists public.diagnostic_runs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  diagnostic_type text not null check (diagnostic_type in ('visibility', 'process', 'villa-response')),
  public_token_hash text not null unique,
  status text not null default 'created' check (
    status in (
      'created', 'queued', 'discovering', 'crawling', 'technical_analysis',
      'ai_sampling', 'scoring', 'report_ready', 'partial', 'failed', 'cancelled', 'expired'
    )
  ),
  stage text,
  methodology_version text not null,
  scoring_version text not null,
  prompt_set_version text,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  coverage numeric,
  confidence text check (confidence in ('high', 'medium', 'low')),
  error_code text,
  error_summary text,
  idempotency_key text,
  feature_flags jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.diagnostic_runs is
  'One row per scan/check attempt. public_token_hash stores a hash, never the plaintext token exposed to the client (SSOT §14.5).';

create unique index if not exists diagnostic_runs_idempotency_key_idx
  on public.diagnostic_runs (idempotency_key)
  where idempotency_key is not null;

create index if not exists diagnostic_runs_site_id_idx on public.diagnostic_runs (site_id);
create index if not exists diagnostic_runs_status_idx on public.diagnostic_runs (status);
