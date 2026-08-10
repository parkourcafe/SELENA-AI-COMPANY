# Video Research Radar v1

An evidence-based research layer that finds YouTube videos performing unusually well **relative to
their own creator's normal performance**, extracts the observable mechanics inside them, and turns
those mechanics into original content opportunities for projects that already exist.

It is not a viral feed, a downloader, a social listening tool or a script generator.

The Phase 0 repository audit — including why this is a module inside this repo rather than an
addition to a Command Center — is in [`video-radar-audit.md`](./video-radar-audit.md).

---

## The question every run answers

> Which videos are performing unusually well relative to their creator's normal performance, what
> observable content patterns do they contain, and which of those patterns are relevant enough to
> adapt into original content for Selena's projects?

Two rules follow from it, and everything else is downstream:

1. **Popular ≠ abnormally successful.** A 2M-view video from a 5M-view channel is normal. A
   20k-view video from a channel whose comparable median is 1k is the signal.
2. **Correlation ≠ causality.** The Radar has no control group and no platform-side data. It reports
   *likely contributing factors*, never "why it worked", and every recommendation stays traceable to
   the evidence that produced it.

## Architecture

```
lib/video-radar/
├── contracts.ts        types, statuses, version stamps, error codes
├── config.ts           every threshold, loaded from data/video-radar/scoring.v1.json
├── videoType.ts        short/long/unknown — the ONLY place duration is interpreted
├── baseline.ts         median of comparable recent videos + confidence
├── outlier.ts          ratio, band, provisional/mature maturity
├── metrics.ts          snapshot-based velocity, null-safe engagement
├── relevance.ts        cheap keyword filtering, runs before anything expensive
├── score.ts            transparent candidate score + quality gate + quotas
├── patterns.ts         pattern library + evidence-gated emergence
├── opportunities.ts    project adaptation + anti-copy enforcement
├── projects.ts         reads the EXISTING project registry (no second one)
├── run.ts              the idempotent, failure-isolated pipeline
├── auth.ts             the operator gate
├── view.ts             dashboard view model (evidence and interpretation kept apart)
├── providers/          YouTube + transcript boundaries, each with a fixture impl
├── analysis/           prompt, JSON schema, validator, Anthropic provider
└── store/              RadarStore interface + Supabase and in-memory implementations
```

## Pipeline

The funnel is cost-gated: each stage is narrower and more expensive than the last, and nothing
expensive ever sees the full discovery pool.

| Stage | What runs | Scale | Cost |
| --- | --- | --- | --- |
| A — Discovery + monitoring | Watchlist uploads, topic search, metric refresh | hundreds | YouTube quota only |
| B — Metadata scoring | Baseline, outlier, relevance, candidate score | same set | free (pure functions) |
| C — Shortlist | Quality gate, then per-type quota ceilings | tens | free |
| C′ — Transcripts | Shortlist only, skipping any already held | ≤ 40/run | transcript provider |
| D — Deep analysis | Shortlist only, skipping any already analysed at the current prompt version | ≤ 25/run | model tokens |

**Discovery and monitoring are separate processes.** Discovery finds videos the system does not
know. Monitoring refreshes metrics for videos it already has — and is the only reason velocity can
ever be measured, because velocity requires two real observations.

## Scoring

### Baseline (`baseline.ts`)

Median views of the creator's most recent 20 **comparable** videos — same video type, older than the
72-hour stabilization window, valid, and never the target video itself.

Median rather than mean: one runaway hit in the history would drag a mean upward and hide every
later outlier behind it. Excluding the target matters just as much — including a strong video in its
own baseline shrinks exactly the signal the Radar exists to find.

| Eligible sample | Confidence |
| --- | --- |
| ≥ 15 | `high` |
| 8–14 | `medium` |
| 4–7 | `low` |
| < 4 | `unavailable` — **no baseline value is returned at all** |

Below the floor no number is produced, because a "baseline" computed from three videos still gets
divided into a view count downstream and read as a real ratio.

### Outlier (`outlier.ts`)

```
outlier_ratio = video views / comparable creator baseline
```

| Ratio | Band |
| --- | --- |
| < 1.5x | normal |
| 1.5–2x | interesting |
| 2–5x | strong |
| 5–10x | major |
| 10x+ | exceptional |

Subscriber count is **not** the denominator. It is shown as context only; `views / subscribers`
mostly measures how long a channel has existed.

A zero or missing baseline yields no ratio rather than `Infinity` — otherwise a 3-view video on a
zero-median channel ranks first.

### Maturity

A young video has had less exposure time than the mature totals it is compared against, so its ratio
understates performance. Until it passes a minimum age it is marked `provisional`:

| Video type | Mature after |
| --- | --- |
| short | 72h |
| long / unknown | 168h |

Provisional results are still shown, with the flag — withholding them would hide fresh signal, and
presenting them as mature would overstate it.

### Velocity

Requires **two or more real metric snapshots**. `current views / age` is not a measurement — it is an
average over a window nobody observed, and it systematically flatters old videos. Without snapshots
the answer is `velocity_status: unavailable`, which is a usable fact.

### Candidate score

Seven weighted components, each stored with its raw value, weight and contribution:

| Component | Weight |
| --- | --- |
| Outlier signal (log-scaled, capped at 10x) | 0.34 |
| Relevance | 0.24 |
| Baseline confidence × maturity | 0.16 |
| Freshness (21-day half-life) | 0.10 |
| Engagement | 0.06 |
| Measured velocity | 0.06 |
| Creator priority | 0.04 |

**Missing data renormalizes the weights; it never scores zero.** A creator who hides like counts must
not be demoted for a privacy setting. `weightCoverage` reports how much of the intended weight was
real, so a thin ranking is visible rather than implied.

The score exists to **order a list**, not to state a truth. That is why the components are always
persisted alongside it and stamped with `scoring_version`.

### Quality gate and quotas

A candidate must clear all of: outlier ≥ 1.5x, relevance ≥ 0.35, score ≥ 0.42, and a baseline
confidence that is not `unavailable`.

Weekly ceilings are **up to** 50 Shorts and 20 long-form. If 17 Shorts and 8 long-form clear the gate,
that is what you get. Quotas are never filled with weak candidates.

## Evidence vs interpretation

Enforced in the data model, not by convention:

| Extracted / observed | Interpreted |
| --- | --- |
| title, description, publication date, duration | hook category |
| views, likes, comments | likely contributing factors |
| baseline, sample size, confidence | narrative pattern |
| outlier ratio, maturity | reusable content mechanic |
| transcript content | project opportunity |

The dashboard renders them under separate headings and never merges them into one unlabelled block.

## AI analysis

- **Model:** `claude-opus-5` by default (`VIDEO_RADAR_ANALYSIS_MODEL` to override).
- **Effort:** `medium` by default (`VIDEO_RADAR_ANALYSIS_EFFORT`) — the main cost lever.
- **Structured output:** the API enforces the JSON schema via `output_config.format`, and
  `validateAnalysis` re-checks the result before anything is stored. One targeted retry on a
  validation failure, quoting the exact errors. No prose parsing anywhere.
- **Versioning:** every analysis stores its prompt version, schema version and model. A prompt
  revision writes a *new* row; old interpretation stays distinguishable and is not silently
  overwritten.

### Prompt-injection resilience

Titles, descriptions and transcripts are written by strangers. They are fenced inside
`<source_video>`, the delimiter is neutralised in the source text, and the system prompt states that
everything inside is data to analyse rather than instructions to follow. Schema validation is the
backstop: a successful injection still cannot produce an object that passes the validator.

### Never inventing project facts

The model is given the project registry verbatim and knows nothing else about Selena. Any angle that
would need a fact it was not given produces a flag instead:

```
FACT_REQUIRED: number of properties currently running on VillaOps
```

An adaptation with unanswered `fact_requirements` is still useful — a human supplies the facts. An
adaptation with invented facts is worthless.

### Anti-copy

Adaptations reuse the *mechanic*, not the content. Enforced twice: the prompt carries the spec's
worked example, and `opportunities.ts` drops any adaptation whose hook or angle exceeds 50% content-
word overlap with the source title — the "near-identical title with the nouns replaced" failure mode.

```
Source:      "I built X in 7 days."
Mechanic:    time-boxed experiment with a measurable outcome
Acceptable:  "Can I identify a viable hospitality SaaS opportunity in one week?"
Rejected:    "I built a hospitality SaaS in 7 days"   ← unless that actually happened
```

## Patterns vs trends

A pattern is a reusable mechanic stored across videos. A pattern is only **emerging** when it clears
three thresholds at once:

- ≥ 3 qualifying videos,
- from ≥ 3 **independent creators**,
- inside a 30-day window.

Counting rows instead of distinct channels would let one prolific creator manufacture a trend on
their own. The evidence behind the classification is stored and displayed next to the badge.

## Projects

The Radar does **not** define projects. `lib/video-radar/projects.ts` reads the six real projects
already in `lib/data/homepage.ts` → `proof.projects` and adds only a stable slug plus matching
keywords from `data/video-radar/project-focus.json`. No name, url or claim is restated, so the two
cannot drift.

## Storage

`RadarStore` has two implementations, selected at runtime:

| | `SupabaseRadarStore` | `InMemoryRadarStore` |
| --- | --- | --- |
| Used when | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set | otherwise, and in tests |
| Durable | yes | **no** — the UI says so explicitly |

Idempotency is a property of the schema, not of the calling code — every write is an upsert on a
unique constraint:

| Entity | Key |
| --- | --- |
| video | `(platform, external_video_id)` |
| discovery origin | `(video, topic)` / `(video, creator)` |
| metric snapshot | `(video, run)` |
| score | `(run, video)` |
| transcript | `video` |
| analysis | `(video, prompt_version)` |
| pattern observation | `(pattern, video)` |
| opportunity | `(video, project, pattern)` |

An operator's save/reject decision is never reset by re-processing.

## Configuration

Every threshold lives in `data/video-radar/scoring.v1.json` — baseline sample size and confidence
cut-offs, maturity windows, outlier bands, score weights, quality gate, quotas, per-stage caps and
pattern emergence rules. Change values there, bump the version, and old rankings stay interpretable
next to new ones.

Seed data: `topics.seed.json` (18 topics, upserted by slug on first run, never overwriting an
operator's edits) and `creators.seed.json` (**intentionally empty** — a watchlist row needs a real
YouTube channel id, and inventing one would put fabricated data into the system).

## Environment variables

| Variable | Required for | Notes |
| --- | --- | --- |
| `VIDEO_RADAR_ENABLED` | anything at all | default off; the Radar 404s until set |
| `VIDEO_RADAR_OPERATOR_TOKEN` | every route and page | long random secret; server-side only |
| `VIDEO_RADAR_DISCOVERY_ENABLED` | live YouTube discovery | off ⇒ fixture provider |
| `YOUTUBE_API_KEY` | live discovery | YouTube Data API v3, server-side only |
| `VIDEO_RADAR_TRANSCRIPTS_ENABLED` | transcript retrieval | off ⇒ every transcript is `unsupported` |
| `VIDEO_RADAR_ANALYSIS_ENABLED` | deep AI analysis | off ⇒ metadata-level Radar still works |
| `ANTHROPIC_API_KEY` | deep analysis | server-side only |
| `VIDEO_RADAR_ANALYSIS_MODEL` | optional | defaults to `claude-opus-5` |
| `VIDEO_RADAR_ANALYSIS_EFFORT` | optional | `low`–`max`, defaults to `medium` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | durable storage | otherwise in-memory |
| `CRON_SECRET` | scheduled runs | can trigger a run and nothing else |

Every one is unset today, and the Radar degrades to a documented empty state rather than failing.

## Running it

### Manual run

```bash
curl -X POST https://<host>/api/internal/video-radar/run \
  -H "x-radar-operator-token: $VIDEO_RADAR_OPERATOR_TOKEN"
```

### Scheduling

No scheduling *framework* was added — that would be the parallel system the spec forbids. Instead the
run endpoint is idempotent and reachable by any external trigger, and `vercel.json` declares a weekly
cron:

```json
{ "crons": [{ "path": "/api/internal/video-radar/run", "schedule": "0 6 * * 1" }] }
```

Two details make this work:

- **The route answers `GET` as well as `POST`.** Vercel Cron issues a GET; the run is idempotent, so
  GET being non-idempotent by convention costs nothing here.
- **The scheduler has its own credential.** Vercel Cron cannot send a custom header — it sends
  `Authorization: Bearer $CRON_SECRET`. So set `CRON_SECRET` in the project's environment and the run
  endpoint accepts it via `checkRunTrigger`.

`CRON_SECRET` is deliberately **narrower than the operator token**: it can trigger a run and nothing
else. It cannot edit topics, add creators or change an opportunity's status, because those routes
still call `checkOperator`. A cron secret tends to live in more places — CI config, a scheduler UI —
so it should be able to do less.

Any other scheduler works the same way: a GitHub Action can set either credential.

> **Plan note:** weekly crons need Vercel Pro. On Hobby, cron jobs run at most once a day — change
> the schedule to `0 6 * * *` and rely on the run's idempotency, or trigger from a GitHub Action.

### The UI

`/internal/video-radar` — `noindex`, disallowed in `robots.ts`, and gated on the operator token.
Paste the token once; it is exchanged for an httpOnly cookie and never stored client-side.

## Failure recovery

- **One item failing never kills a run.** Every item is processed in its own try/catch. A run that
  hits any failure ends `partial` with each failure listed by stage, code and subject.
- **Retries are bounded** and only for transient errors. A permanent failure (bad API key, quota
  exhausted) exits immediately rather than burning attempts.
- **Retry a single item** without paying for a whole run:
  ```bash
  curl -X POST https://<host>/api/internal/video-radar/videos/<id>/retry \
    -H "x-radar-operator-token: $TOKEN" -H 'content-type: application/json' \
    -d '{"target":"transcript"}'   # or {"target":"analysis"}
  ```
- **A run cut off by the function timeout** is safely resumed by invoking again — completed work is
  skipped, not redone.

## Empty states

No videos, no quota, no transcript, no baseline, no outliers, no patterns, no model — each renders
as an explicit empty state. A correct empty state is better than fake intelligence, and the Radar
never manufactures content to avoid an empty dashboard.

## Testing

```bash
npm test
```

Providers are mocked at their boundaries (`FixtureVideoProvider`, `FixtureTranscriptProvider`,
`FixtureAnalysisProvider`), so tests never touch YouTube or a model and never consume quota. The
suite covers baseline eligibility and confidence, outlier edge cases, snapshot velocity, null-safe
engagement, score renormalization, quality gate and quotas, schema validation and `FACT_REQUIRED`,
anti-copy enforcement, pattern emergence, the operator/scheduler credential split, and a full
end-to-end run including an idempotent re-run.

The Supabase store is covered by a **recording fake** of the PostgREST builder
(`tests/unit/helpers/fakeSupabase.ts`) rather than a Postgres emulator — emulating upsert semantics
would mean testing the fake. What it asserts is the class of bug the type checker cannot see: wrong
`onConflict` targets, `.eq(col, null)` where a partial index needs `.is(col, null)`, payloads that
include a column they must leave alone (`status`, `discovered_at`), and snake_case mapping.

## Extending to another platform

`VideoProvider` is four methods. A v2 platform implements those, adds a value to `RadarPlatform`,
and reuses every scoring, pattern and opportunity module unchanged. TikTok and Instagram Reels are
explicitly **out of scope for v1** and no code for them exists.
