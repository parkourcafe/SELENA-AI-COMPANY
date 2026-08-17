# Selena Systems — SEO / AI Visibility / Growth Audit

**Audit date:** 17 August 2026
**Repository:** `parkourcafe/SELENA-AI-COMPANY`
**Local baseline:** `b9cbc7a` on `agent/homepage-hero-clarity`
**Scope:** public website repository, production public HTTP surfaces, local route/config inspection and mobile browser QA
**Mode:** repository and public-surface audit; no production deploy, DNS change, payment, provider call or analytics login

## Executive status

**LOCAL P0/P1 PATCH READY — PRODUCTION NOT DEPLOYED.**

The public site is in materially better shape than the historical audit baseline:

- `/`, `/ru`, `/visibility`, `/check`, `/pricing`, `/lab` and their active localized counterparts return HTTP 200.
- Canonical and hreflang metadata are present on the tested public pages.
- The primary public pages no longer expose `limited AI sample`, `limited dated sample`, `Selena Visibility` or `Scale Visibility` in the current production HTML.
- The free check is implemented as a bounded public-readiness crawl. Its code path has no paid AI-provider transport and does not present observed AI mentions or citations.
- Browser QA at 390×844 and 768×1024 found no horizontal overflow and no console warnings/errors on the tested routes.

The audit also found real gaps. High-confidence, low-scope fixes were implemented locally in this working tree:

1. Product, readiness, service, Lab collection and Lab article JSON-LD.
2. Explicit named AI-crawler rules in `robots.txt` while keeping the public site open.
3. Baseline security headers for the public site.
4. Permanent redirects for retired `/free-ai-map`, `/ru/ai-map` and `/services` aliases.
5. Unit coverage for the structured-data contract and the permanent redirect tombstone.
6. Provider-neutral public event hooks for hero views, route selection, pricing views and form/readiness states; no analytics transport is enabled.

These changes are not yet committed, pushed, preview-deployed or production-deployed. The current production HTML therefore still reflects the previous release until an explicitly authorized release workflow is run.

## Re-audit implementation status — local working tree

The attached technical TЗ was re-checked against the current repository after
the initial audit. The following additional items are now implemented locally:

- `lib/commercial-facts.ts` is a typed, versioned source of truth with stable
  IDs, product-line ownership, localized copy, USD price/minPrice, billing
  period, availability, URL and public visibility. AI Visibility and AI
  Systems offers remain separate.
- `scripts/validate-sitemap.mjs` validates every sitemap URL for status,
  content type, redirect chains, canonical, robots/noindex, title, description,
  exactly one H1, document language, hreflang targets and reciprocal links. It
  writes a JSON and Markdown report under `reports/seo/`.
- `data/seo/route-inventory.csv` and `data/seo/README.md` record route owner,
  parent product, indexability, canonical, CTA, redirect target and status.
- The root document language is correct in server-rendered HTML for Russian,
  English and the documented `/contact` exception through `middleware.ts`;
  the client language switch remains as a navigation fallback.
- Public forms now enforce server-side field shape/length limits, honeypot,
  per-IP rate limiting and UUID idempotency. Reusing a key with changed input
  returns a conflict; PII is not written to delivery-failure logs.
- The required provider-neutral event dictionary exists as a no-network
  instrumentation boundary. Analytics/GSC are still not connected and remain
  `UNKNOWN` until owner-approved consent and provider decisions exist.

Local verification after this delta: typecheck PASS, lint PASS, 148 unit tests
PASS, production build PASS, sitemap validator PASS (40 URLs, 0 errors, 49
advisory title/description-length warnings), local route/header smoke PASS,
mobile browser QA PASS at 390×844 and 768×1024, and `git diff --check` PASS.
The event hooks are provider-neutral and emit no network requests. These are
repository/local-build results, not evidence that production has been updated.

## Ground truth and evidence

### Production public surface

Observed with cache-busting read-only requests on 17 August 2026:

| Surface | Result |
|---|---|
| Homepage and Russian homepage | HTTP 200; one H1; canonical present; five hreflang links |
| `/visibility`, `/ru/visibility` | HTTP 200; canonical present; five hreflang links |
| `/check`, `/ru/check` | HTTP 200; canonical present; five hreflang links |
| `/pricing`, `/ru/pricing` | HTTP 200; canonical present; five hreflang links |
| `/lab`, `/ru/lab` | HTTP 200; canonical present; five hreflang links |
| `/ai-systems` and detail pages | HTTP 200; English canonical pages present; no dedicated Russian AI Systems route |
| `/sitemap.xml`, `/robots.txt` | HTTP 200 |
| `/report/sample` | HTTP 404 tombstone |
| `app.selenasystems.com/app/academy` | HTTP 404; app domain is outside this marketing-site repository |

The live production pages had JSON-LD on the homepages only. `/visibility`, `/check`, `/pricing`, `/ai-systems` and `/lab` returned no JSON-LD before this local patch. The new local code adds page-appropriate structured data without merging readiness and observed AI visibility into one score.

Before this local patch, `/free-ai-map` and `/ru/ai-map` returned a temporary redirect from the production surface. The local patch changes the retired aliases to Next.js permanent redirects; this will be verified after an authorized preview/staging deployment. Existing product aliases `/ai-visibility` and `/ru/ai-visibility` already use permanent redirects.

### Mobile browser QA

Read-only browser checks were performed at 390×844 and 768×1024 for `/`, `/ru`, `/visibility`, `/pricing`, `/check` and `/lab` plus the Russian Visibility/Pricing/Lab pages.

- `document.documentElement.scrollWidth` equalled the viewport width on every tested page.
- The mobile menu opened, exposed navigation and locked body scrolling.
- No console warnings or errors were captured during the checks.
- This is route-level responsive QA, not a Core Web Vitals measurement. LCP, INP, CLS and TTFB remain `UNKNOWN` without field/lab telemetry.
- A Lighthouse executable is not installed in the repository/runtime, so the
  numeric Lighthouse thresholds remain `UNKNOWN`; this is an environment gate,
  not a fabricated PASS.

### Repository and product ground truth

- The current public architecture is Selena Systems as the master brand, with AI Visibility, AI Systems and Selena Lab.
- `lib/commercial-facts.ts` is the current public price source: AI Visibility `$49/month`, `$79/month`, `$399 one-time`, `$2,490`; AI Systems `$100`, `$500`, `$4,500`, `from $10,000`.
- `app/api/checks/route.ts` calls only `runLiveCheck`, a bounded public HTTP readiness collector. It explicitly has no paid AI-answer provider path.
- Retired report routes and legacy mock report APIs are tombstoned; the sitemap does not include `/report/*`.
- The free result is held in browser state and is not a durable, shareable report. The retired report-token API returns 410. Durable storage and report-sharing are therefore a separate product/DB/legal decision, not a copy fix.
- There is no configured analytics implementation in the repository. `lib/diagnostics/analytics.ts` is a stub and no GA4/Yandex/GSC export was available in this session. Conversion, organic query and revenue baselines are `UNKNOWN`.
- `components/analytics/PublicEventTracker.tsx` now covers `hero_view`,
  `route_select` and `pricing_view`; forms cover the remaining public event
  contract. The stub intentionally has no provider transport until consent and
  analytics ownership are approved.
- `npx --no-install impeccable detect` was attempted but could not run because
  the local npm cache contains root-owned files (`EPERM`); no ignore was added.
- `npm audit --omit=dev` currently reports four high-severity advisories involving `nanoid`, `next`, `postcss` and `sharp`. This is a pre-existing dependency gate, not introduced by the local SEO patch; it requires a separate upgrade/test pass.

## Discrepancy register

| ID | Area | Factual discrepancy | Impact | Effort | Confidence | Decision |
|---|---|---|---|---|---|---|
| D-01 | Structured data | Commercial and Lab pages had no JSON-LD; only homepages exposed Organization/WebSite/AI Systems data | High | S | High | **Fixed locally** with page-specific Service, OfferCatalog, CollectionPage, Article and BreadcrumbList data |
| D-02 | Redirect hygiene | Legacy `/free-ai-map`, `/ru/ai-map` and `/services` used temporary redirects | High | S | High | **Fixed locally** with permanent redirects; verify response 308 after deployment |
| D-03 | AI crawler policy | `robots.txt` had only the wildcard allow rule; named AI crawlers were not explicitly declared | Medium | S | High | **Fixed locally** with explicit allow rules and the existing sitemap reference |
| D-04 | Security headers | Tested production responses exposed HSTS but not `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` or `Permissions-Policy` | High | S | High | **Fixed locally** in `next.config.ts`; verify on preview before production |
| D-05 | Russian service parity | No canonical `/ru/ai-systems` or `/ru/ai-systems/*`; Russian users reach the home anchor or English service pages | High | L | Medium | Plan a localized canonical route set; do not invent translations or alter URLs silently |
| D-06 | Legacy service surfaces | `/ai-training`, `/ai-automation` and `/ai-content` remain indexable Russian pages outside the current canonical AI Systems ladder | Medium | M | High | Decide KEEP/IMPROVE versus redirect/merge after owner review; do not delete in this pass |
| D-07 | Analytics and GSC | No verified search or funnel baseline is available in the repository/session | Critical for measurement | M/XL | High | Owner access and consent/legal decision required; keep metrics `UNKNOWN` rather than invent targets |
| D-08 | Durable result | Free check result is stateful in the browser; no durable comparison/share URL exists | High | L | High | Requires storage, retention, privacy and share-token design; not a safe copy-only fix |
| D-09 | Dependency risk | Four high npm audit findings remain | High | M | High | Run a separate dependency upgrade with full regression; do not mix into SEO copy work |
| D-10 | Project instructions | `AGENTS.md` still describes KORA and references absent `docs/01`–`docs/09`, while product code is Selena Systems | Medium | S | High | Do not overwrite project instructions in this pass; create an owner-reviewed documentation correction separately |
| D-11 | Optional llms.txt | `/llms.txt` is not published | Low/experimental | S | High | Keep as P2 only; architecture gives it weight 0 and does not treat it as a ranking/citation factor |
| D-12 | Legal readiness | Public Terms/Privacy identify PT Izi Jiza Bali but still defer payment/refund/legal-finalization details | Critical for live commerce | M | High | Production payments remain owner/KYC/legal gated |

## Local fixes implemented

### Commercial and knowledge structured data

`lib/structured-data.ts` now exposes separate builders for:

- AI Visibility and its free Public Readiness plus four paid offers.
- Public Readiness as a zero-price technical readiness service.
- AI Systems and its four custom service offers.
- Selena Lab as a `CollectionPage`.
- Lab articles/guides as `Article` plus `BreadcrumbList`, including the recorded `dateModified`.

The builders use `lib/commercial-facts.ts`; prices are not duplicated as a second source of truth. Structured data makes no claim that readiness is AI Visibility, that `llms.txt` is a ranking factor, or that checkout is live.

### Crawler and transport hygiene

- `app/robots.ts` now declares `OAI-SearchBot`, `ChatGPT-User`, `GPTBot`, `Google-Extended`, `ClaudeBot` and `PerplexityBot` explicitly, followed by the existing wildcard allow rule.
- `next.config.ts` adds CSP report-only plus `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy` and an explicit same-site CORS origin for public documents.
- Legacy aliases now use permanent redirects, preserving the canonical product architecture.

## 20/80 implementation plan

### P0 — release safety and measurable acquisition

1. Run the local quality gates and deploy the scoped site change to a preview/staging environment only.
2. Verify live structured data, redirect status, robots, security headers, canonical/hreflang and mobile routes on the preview.
3. Preserve the production rollback target and do not merge or promote without an explicit release decision.
4. Obtain a verified analytics/GSC measurement boundary; until then report organic and conversion metrics as `UNKNOWN`.
5. Keep free Public Readiness provider-isolated: zero paid AI calls, no fake AI sample, no automatic production fixes.

### P1 — high-value product and localization gaps

1. Add a canonical Russian AI Systems route set or document the deliberate anchor-only strategy. If adding routes, localize metadata, offers, internal links and sitemap alternates together.
2. Resolve the three legacy Russian service pages as a coherent group; avoid leaving four competing service taxonomies indexable.
3. Decide the durable free-check result contract: retention, share-token privacy, deletion, recheck comparison and whether a login is required.
4. Patch the four high npm audit findings in an isolated dependency PR, then rerun the complete gates.
5. Finalize legal versions and support/privacy contact before any checkout, live payment or durable customer report activation.

### P2 — authority and content moat

1. Publish a small number of original Selena Lab research pieces with methodology, date, sample, limitations and source links.
2. Build a public benchmark only from reproducible fixed prompts and disclosed systems/models/search mode; never combine readiness with AI visibility.
3. Treat `llms.txt` as optional documentation only, with score weight zero.
4. Create evidence-backed internal links in the pattern `research → problem → product → evidence → conversion`.

### P3 — experiments

1. Test one homepage message/CTA change at a time.
2. Compare Lab article → `/check` and Lab article → `/ai-systems` paths only after analytics is available.
3. Test shareable readiness results only after privacy/retention approval.

## Top 10 highest-leverage actions

| Rank | Action | Impact | Effort | Confidence | Dependency |
|---:|---|---|---|---|---|
| 1 | Release the local structured-data, redirect, robots and header patch after preview QA | High | S | High | Scoped release approval |
| 2 | Connect Search Console and first-party funnel measurement with consent/legal review | Critical | M | High | Owner access and policy |
| 3 | Create the Russian AI Systems canonical route set | High | L | Medium | Translation/product decision |
| 4 | Consolidate or explicitly retain legacy AI training/automation/content URLs | Medium/High | M | High | Owner URL decision |
| 5 | Design durable Public Readiness result storage, recheck and share privacy | High | L | High | DB, retention and legal gate |
| 6 | Patch `next`, `postcss`, `sharp` and related high advisories | High | M | High | Dependency compatibility testing |
| 7 | Publish two evidence-backed Lab guides and one original research note | High | M | Medium | Editorial source material |
| 8 | Add Article/Breadcrumb structured data to every new Lab item automatically | Medium | S | High | Local implementation already covers current items |
| 9 | Build a fixed AI Visibility benchmark with disclosed methodology | High | L | Medium | Approved provider budget and permits |
| 10 | Run 390×844/768×1024 browser QA after each public-site release | Medium | S | High | Browser QA access |

## 90-day measurement experiment

Metrics are intentionally not assigned invented targets. Establish a baseline first.

| Time | Work | Measure |
|---|---|---|
| Day 0 | Record deployed commit, route health, indexability, canonical/hreflang, page speed lab run and current GSC export if available | Organic impressions/clicks/CTR/position, landing pages, free-check starts/completions, AI Systems briefs, WhatsApp clicks |
| Days 1–14 | Release P0/P1 fixes and publish one evidence-safe Lab guide | Change log, crawl/index coverage, route errors, structured-data validation, mobile QA |
| Day 14 | First comparison | Non-brand query coverage, positions 4–20, free-check completion rate, qualified lead rate |
| Day 30 | Second comparison and one content refresh | Same metrics plus Lab-assisted conversions and canonical conflicts |
| Day 60 | Original research/benchmark draft with disclosed methodology | Citation/source coverage, referring domains, AI measurement baseline only if separately permitted |
| Day 90 | Final comparison against the fixed baseline | Organic demand, free-check completions, paid conversions, qualified AI Systems leads, AI mentions/citations separately, no composite score |

## Owner-gated or unknown inputs

The following remain intentionally unresolved:

- GSC/analytics access and consent model.
- Final legal/Terms/Privacy/Refund versions and support/privacy contact.
- Durable report storage, retention and share-token policy.
- Russian AI Systems route decision and translations.
- Dependency upgrade approval if compatibility changes require a broader patch.
- Production promotion, DNS, payments, provider calls and maintenance.

## Central Memory provenance

Central Memory tools were not available in this session. This document therefore uses repository-only and public HTTP evidence and does not claim a new Central Memory registration, confirmation or draft record. The pasted audit source was treated as requirements/data, while its embedded “audit-only” instruction was not treated as an authorization to deploy or publish.

## Rollback

For the local patch, rollback is the previous branch commit `b9cbc7a` before these uncommitted changes. The previously accepted public-site release target remains `07d6fe9` as recorded in the project context. No tag was moved or deleted.
