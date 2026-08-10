# Video Research Radar v1 — Phase 0 repository audit

Audit of `parkourcafe/SELENA-AI-COMPANY` performed before any implementation, per the
Video Research Radar v1 specification §5–§8.

---

## 0. Headline finding: there is no "Selena Command Center"

The specification is written against an existing internal Command Center and instructs the
implementer to reuse its authentication, project registry, content pipeline, AI gateway, job
scheduler and design system (§4).

**None of those exist in this repository.** This repo is the public Selena Systems /
KORA marketing website plus a partially-built "Visibility" diagnostics product. Concretely:

| Capability the spec assumes | Present? | Evidence |
| --- | --- | --- |
| Authentication | **No** | No auth library, no session/cookie handling, no login route anywhere in `app/`, `lib/`, `components/` |
| Authorization / admin roles | **No** | No role checks of any kind |
| Project registry (entities) | **Partial** | Six real projects exist as *marketing copy* in `lib/data/homepage.ts` → `proof.projects` (KORA Food Hall, PetID.care, Doki.help, remhaos.com, otherbali.com, VillaOps). Not a database entity |
| Content pipeline / backlog | **No** | No content entities, no statuses, no editorial workflow |
| AI gateway / model layer | **No** | Zero AI dependencies. `package.json` runtime deps are `@supabase/supabase-js`, `next`, `react`, `react-dom`. The `ai_prompt_runs` table in the migrations is an unused schema placeholder for a *future* Visibility feature — no code calls any LLM |
| Background jobs / queue / cron | **No** | No `vercel.json`, no `.github/workflows`, no worker. Work runs synchronously inside request handlers under a hard budget (see `app/api/checks/route.ts:26`) |
| Database | **Configured but not provisioned** | Migrations exist (`supabase/migrations/*.sql`) but are applied to no project. `getSupabaseServerClient()` returns `null` when unconfigured (`lib/supabase/server.ts:16`), and `.env.example:16` states the Supabase project is Decision Log **D-005 (NEEDS_OWNER)** — unset in every environment |
| Navigation with an Intelligence/Research area | **No** | Public marketing nav only (`components/layout/Header.tsx`) |
| Design system | **Yes** | `components/ui/*` (Container, Card, Badge, Button, SectionHeader), Tailwind v4 tokens |
| Logging / error reporting | **No** | No logger, no Sentry |
| Testing | **Yes** | `node:test` + `tsx`, 106 tests, all passing |

### How this was resolved

Spec §4 permits creating new capability only where "the repository audit proves that no usable
equivalent exists." The audit proves exactly that for auth, jobs, AI and the content backlog.

Spec §8 says to **stop and report** only for a *materially risky* architectural decision, and
otherwise to "choose the most conservative repository-native option and document it." The chosen
path requires no destructive migration, no change to existing authentication (there is none), no
replacement of core infrastructure, no redesign of the existing schema, and breaks no existing
workflow. So this audit **continues automatically**, building Video Radar as a module *inside this
repository* using its established patterns rather than as a standalone application.

Three consequences are called out explicitly for the owner in §4 (Risks) below: the interim
operator gate, the storage situation, and the absence of a scheduler.

---

## 1. Current architecture

### Runtime

- **Framework:** Next.js 15.5 App Router, React 19, TypeScript 5.8 (`strict: true`)
- **Package manager:** npm (`package-lock.json`), Node 22
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`
- **Deploy target:** Vercel (implied — `NEXT_PUBLIC_SITE_URL`, `maxDuration` comments referencing
  "the platform's function limit"). No `vercel.json`
- **Path alias:** `@/*` → repo root (`tsconfig.json`), honoured by both `next` and `tsx`

### Frontend

- App Router pages under `app/`, bilingual: bare paths are Russian by default, with an explicit
  bare-root English exception list for Visibility routes (`lib/visibility/routes.ts:33`)
- Components grouped by role: `components/{layout,sections,ui,forms,seo,landing,visibility}`
- No client state library. Server components by default; `"use client"` only in forms/interactive
  widgets
- Metadata centralised in `lib/metadata.ts` (`buildMetadata`)

### Backend

- Route handlers only (`app/api/**/route.ts`), `export const runtime = "nodejs"`
- No server actions, workers, queues or scheduled jobs
- Long work runs synchronously inside the request under an explicit millisecond budget, with the
  limitation documented in-comment rather than hidden

### Data

- Supabase Postgres via `@supabase/supabase-js`, **service-role key, server-only**
- `lib/supabase/server.ts` returns `null` when unconfigured instead of throwing at import time, so
  the app builds and runs without a database
- Migrations are **additive-only by policy** and end with an RLS lockdown migration that enables
  RLS with *zero* policies, so only the service role can read or write
  (`supabase/migrations/20260730000004_rls_lockdown.sql`)
- Hand-authored `Database` types in `lib/supabase/types.ts`
- Tunable domain constants live in versioned JSON under `data/` (`data/visibility/scoring.v1.json`),
  not in code

### AI

Nothing. This is a genuine gap, not an unused abstraction.

### Operations

- Server-side feature flags in `lib/diagnostics/flags.ts` — a fixed `FLAG_NAMES` tuple, read from
  `process.env` server-side only "so a client can never spoof an enabled capability"
- Stable `ERROR_CODES` union in `lib/diagnostics/contracts.ts`; the UI translates codes, never raw
  messages
- Version stamps (`VERSIONS`) recorded on every run so results stay comparable over time
- In-process per-IP rate limiting with its serverless limitation documented
  (`lib/visibility/security/rate-limit.ts:12`)
- Tests: `npm test` → `node --import tsx --test "tests/unit/**/*.test.ts"`

---

## 2. Reusable infrastructure

Reused rather than rebuilt:

| Existing asset | Used by Video Radar for |
| --- | --- |
| `lib/diagnostics/flags.ts` | Radar feature flags — **extended in place**, not duplicated |
| `lib/diagnostics/contracts.ts` | `ErrorCode` union, `Confidence` type, version-stamping convention |
| `lib/diagnostics/validators.ts` | `sanitizeShortText` for all untrusted external text |
| `lib/supabase/server.ts` | The one Supabase client; null-safe contract preserved |
| `supabase/migrations/` | Additive-only migration + RLS-lockdown convention |
| `lib/supabase/types.ts` | `Database` type, extended with the new tables |
| `data/visibility/scoring.v1.json` pattern | `data/video-radar/scoring.v1.json` — same versioned-config idea |
| `components/ui/*` | Container, Card, Badge, Button, SectionHeader — the entire Radar UI |
| `lib/cn.ts` | Class composition |
| `lib/metadata.ts` | Page metadata (Radar pages are `noindex`) |
| `app/api/**/route.ts` conventions | `NextResponse`, `runtime = "nodejs"`, error codes, body-size caps |
| `tests/unit/*.test.ts` | `node:test` + `assert/strict` + `@/` imports |
| `lib/data/homepage.ts` → `proof.projects` | **The project registry.** Radar derives its adaptation targets from the six real projects already defined here — no second project registry |

---

## 3. Missing capabilities that genuinely had to be added

1. **An AI provider layer.** No LLM client existed. Added as a narrow module
   (`lib/video-radar/analysis/`) using the official Anthropic SDK, with schema-validated structured
   output, bounded retries and prompt-injection resilience.
2. **A YouTube provider.** Added behind a small `YouTubeProvider` interface (§9 — a boundary, not a
   generic social-platform framework) with a fixture implementation for tests.
3. **A transcript provider.** Added behind `TranscriptProvider` with explicit
   `available | unavailable | blocked | failed | unsupported` states.
4. **Durable Radar storage.** Added as a `RadarStore` interface with two implementations —
   Supabase (when configured) and in-memory (tests, and unconfigured environments). This mirrors
   the existing null-safe Supabase contract rather than inventing a second persistence story.
5. **An operator gate.** There is no first authentication to reuse, so the Radar's internal routes
   sit behind a single server-side shared-secret check (`lib/video-radar/auth.ts`). See Risks.
6. **A run orchestrator.** No job framework exists, so the weekly run is an idempotent, restartable
   async function invoked from one route handler.

---

## 4. Risks

| # | Risk | Mitigation |
| --- | --- | --- |
| R-1 | **No authentication exists**, so the Radar's operator gate is a shared secret (`VIDEO_RADAR_OPERATOR_TOKEN`), not a user identity. Weaker than real auth: no per-user attribution, no revocation short of rotating the secret | Single choke point (`requireOperator`) used by every Radar route; the feature flag defaults **off**, so Radar is invisible until an owner deliberately enables it and sets a token. Pages are `noindex`. When real auth lands, `requireOperator` is the only function to replace |
| R-2 | **Supabase is unconfigured** (D-005, NEEDS_OWNER), so the default store is in-memory and does **not survive a serverless invocation**. Baselines, dedupe and idempotency are only durable once a project exists | The store is selected at runtime; the UI shows an explicit non-durable banner. The migration is written and reviewable now. No code change is needed when the project is provisioned — only env vars |
| R-3 | **No scheduler exists.** "Weekly run" is a capability, not an automated cadence | The run is exposed as an idempotent operator-triggered endpoint. Wiring a Vercel Cron or GitHub Action to it is a config change, documented in `docs/video-radar.md`. Deliberately not implemented — adding a scheduling framework would be the "parallel system" §4 forbids |
| R-4 | YouTube Data API quota exhaustion mid-run | Cost-gated funnel (§28), batched `videos.list` calls (50 ids/request), bounded retries, `PROVIDER_*` error codes, per-run provider-failure counters. A quota failure degrades the run to `partial`, never crashes it |
| R-5 | AI spend on a large discovery pool | Deep analysis runs **only** on the post-quality-gate shortlist, and only for videos with no current analysis at the active prompt version. Every stage boundary is counted and surfaced |
| R-6 | Untrusted YouTube titles/descriptions/transcripts reaching the model | Transcripts are delimited and explicitly framed as data, never instructions; output is schema-validated, so a successful injection still cannot produce a valid non-conforming object. All external text is sanitised before storage or display |
| R-7 | Regression in the existing site | Radar is purely additive: new files, one migration, plus two small in-place extensions (flag names, `Database` types). No existing route, component or table is modified |

---

## 5. Proposed integration

```
Discovery (watchlist + topic, provenance-tracked)
  → upsert on (platform, external_video_id)          [dedupe, §14]
  → metric snapshots                                  [§16]
  → channel baseline by video_type, with confidence   [§17, §18]
  → outlier ratio + maturity                          [§19, §20]
  → relevance (cheap, pre-AI)                         [§24]
  → transparent candidate score                       [§25]
  → quality gate + quota cap                          [§27]
  → transcripts (shortlist only)                      [§29]
  → structured AI analysis (final candidates only)    [§31]
  → patterns (+ evidence-gated emerging status)       [§37, §38]
  → project opportunities                             [§34, §36]
```

UI lives at `/internal/video-radar` — **not** a new public top-level nav category. Spec §44 prefers
"Intelligence → Video Radar", but §44 also defers to Phase 0 conventions, and this repository has no
authenticated area at all; `/internal/*` is a new namespace that keeps operator tooling clearly
separated from the public marketing site and out of the sitemap.

## 6. Database changes

One additive migration, `supabase/migrations/20260810000001_video_radar.sql`. No existing table,
column or index is altered or dropped.

| Table | Why it must exist |
| --- | --- |
| `radar_topics` | Configurable research topics (§10). Editable at runtime, so not a JSON file |
| `radar_creators` | Curated creator watchlist (§11). Editable at runtime |
| `radar_videos` | Normalized source video (§14). `unique (platform, external_video_id)` is the dedupe guarantee |
| `radar_video_origins` | One video, many discovery origins, without duplicating the video (§12) |
| `radar_video_metrics` | Metric snapshots — the only honest basis for velocity (§16, §22) |
| `radar_video_scores` | Per-run baseline/outlier/score with component values and versions (§25, §52) |
| `radar_transcripts` | Transcript + status + provider + failure reason (§29) |
| `radar_analyses` | Schema-validated AI output with model/prompt version and timestamp (§31, §51) |
| `radar_patterns` | Reusable mechanics stored separately from videos (§37) |
| `radar_video_patterns` | video ↔ pattern edge, carrying the evidence for emergence (§38) |
| `radar_opportunities` | Project-specific content opportunities (§36). No existing content entity exists to reuse |
| `radar_runs` | Run record + observability counters (§43) |
| `radar_run_items` | Per-item state, so one failure cannot kill a run (§41) |

Every table gets RLS enabled with no policies, matching
`20260730000004_rls_lockdown.sql` — service-role access only.

## 7. Files to add

```
data/video-radar/scoring.v1.json         data/video-radar/topics.seed.json
data/video-radar/creators.seed.json      data/video-radar/project-focus.json

lib/video-radar/contracts.ts   config.ts      videoType.ts   baseline.ts
                 maturity.ts   outlier.ts     velocity.ts    engagement.ts
                 relevance.ts  score.ts       patterns.ts    projects.ts
                 auth.ts       run.ts         opportunities.ts
lib/video-radar/providers/{types,youtube,transcript}.ts
lib/video-radar/analysis/{schema,prompt,analyze}.ts
lib/video-radar/store/{types,memory,supabase,index}.ts

app/internal/video-radar/{page,layout}.tsx
app/api/internal/video-radar/{run,topics,creators,opportunities,videos}/…/route.ts
components/video-radar/*.tsx
supabase/migrations/20260810000001_video_radar.sql
tests/unit/videoRadar*.test.ts
docs/video-radar.md
```

## 8. Files to modify

| File | Change |
| --- | --- |
| `lib/diagnostics/flags.ts` | Append `VIDEO_RADAR_*` names to `FLAG_NAMES` — extends the existing flag system rather than adding a second one |
| `lib/supabase/types.ts` | Add the new tables to the `Database` type |
| `app/robots.ts` | Disallow `/internal/` |
| `.env.example` | Document new variables (no secrets committed) |
| `package.json` | One dependency (below) |
| `CLAUDE.md` | Short pointer to `docs/video-radar.md` |

## 9. Dependencies

| Package | Justification |
| --- | --- |
| `@anthropic-ai/sdk` | The only new runtime dependency. Required for §31 structured AI analysis; no AI client exists in the repo. Official first-party SDK — hand-rolling HTTP against the Messages API would be less correct (typed errors, retry/backoff, structured-output helpers) and is explicitly discouraged |

Deliberately **not** added: no schema-validation library (validators are hand-written, matching
`lib/diagnostics/validators.ts`), no queue, no scheduler, no HTTP client, no vector database, no
state-management library. YouTube is called with `fetch`.

## 10. API / secret requirements

| Variable | Required for | Notes |
| --- | --- | --- |
| `VIDEO_RADAR_ENABLED` | Any Radar surface | Server-side flag, default off |
| `VIDEO_RADAR_DISCOVERY_ENABLED` | Live YouTube discovery | Off ⇒ fixture provider |
| `VIDEO_RADAR_TRANSCRIPTS_ENABLED` | Transcript retrieval | Off ⇒ every transcript reports `unsupported` |
| `VIDEO_RADAR_ANALYSIS_ENABLED` | Deep AI analysis | Off ⇒ metadata-level Radar still works (§30) |
| `VIDEO_RADAR_OPERATOR_TOKEN` | Every internal route | Interim operator gate (R-1). Server-side only |
| `YOUTUBE_API_KEY` | YouTube Data API v3 | Server-side only, never exposed to the client |
| `ANTHROPIC_API_KEY` | Structured analysis | Server-side only |
| `VIDEO_RADAR_ANALYSIS_MODEL` | Optional | Defaults to `claude-opus-5` |

No secret is committed. Every one of these is absent in every environment today, and the Radar
degrades to a documented empty/disabled state rather than failing when they are unset (§58).
