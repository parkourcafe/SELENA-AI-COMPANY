-- Selena Visibility — RLS lockdown (SSOT §14.5, §22.3: "RLS enabled").
--
-- Phase 1/2 has no end-user auth yet (organizations/auth land in PR-08,
-- SSOT §12.2 Phase 3 tables). Every diagnostics table is therefore
-- server-only for now: RLS is enabled with NO policies for `anon` or
-- `authenticated`, so only the Supabase service role (used exclusively
-- from Next.js server routes, never the browser — SSOT §27.4) can read
-- or write. When PR-08 introduces organization membership, add
-- policy-scoped SELECT access for `authenticated` there — do not relax
-- this lockdown migration in place.

alter table public.leads enable row level security;
alter table public.sites enable row level security;
alter table public.diagnostic_runs enable row level security;
alter table public.scan_pages enable row level security;
alter table public.scan_checks enable row level security;
alter table public.ai_prompt_runs enable row level security;
alter table public.ai_observations enable row level security;
alter table public.ai_citations enable row level security;
alter table public.issues enable row level security;
alter table public.reports enable row level security;
alter table public.provider_usage enable row level security;
alter table public.diagnostic_events enable row level security;

-- No CREATE POLICY statements here on purpose: RLS enabled + zero policies
-- means every role except service_role (which bypasses RLS) is denied by
-- default. This is intentionally the most restrictive starting point.
