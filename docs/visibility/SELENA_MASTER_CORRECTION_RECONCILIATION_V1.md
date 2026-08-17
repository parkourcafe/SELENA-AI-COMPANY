# Selena Systems Master Correction — current-state reconciliation

**Дата:** 16 августа 2026
**Рабочий источник:** `/Users/msnigmatullaeva/Downloads/SELENA_SYSTEMS_MASTER_CORRECTION_TZ_V1 (3).md`
**Применение:** публичная архитектура Selena Systems, Free Public Readiness, AI Visibility/AI Systems/Lab boundaries и release hygiene.
**Paid technical base:** RC6 measurement contracts в `elmo-source` сохраняются; этот документ не включает production, live payments, real provider calls или maintenance.

## Итог

Master Correction принят как текущая цель поверх более старых public-site документов. В коде уже есть canonical `/check`, живой bounded Public Readiness collector, Cloudflare/Selena rule registry, evidence/fix/preview/verification flow, отдельные четыре AI Visibility плана, AI Systems commercial facts и Selena Lab. В этом проходе устранены оставшиеся активные duplicate surfaces:

- legacy `/report/*` и `/report/sample` больше нельзя включить env-флагом;
- legacy `/free-ai-map` и `/ru/ai-map` больше не являются вторым продуктовым входом;
- `/ai-systems` и detail routes стали canonical AI Systems entry;
- app readiness GET/fix routes больше не читают старую `sv_public_scans` таблицу и не вызывают старый scorer;
- persisted Cloudflare/Selena parity matrix добавлена как controlled-fixture contract.

## Расхождения до этого прохода

| Область | Фактическое расхождение | Решение |
|---|---|---|
| Free report | Старые sample/token routes содержали illustrative AI-answer sample и зависели от флагов | Routes retired with `notFound()`/HTTP 410; Free остаётся `/check` и показывает только Public Readiness |
| Public entry | `/free-ai-map` и `/ru/ai-map` сохраняли старую AI-map identity рядом с canonical Check | Redirects: `/free-ai-map` → `/ai-systems`, `/ru/ai-map` → `/ru#ai-systems`; old URLs removed from sitemap |
| AI Systems | В текущем сайте не было canonical `/ai-systems` и detail routes | Added `/ai-systems`, `/ai-systems/ai-audit`, `/ai-systems/ai-sprint`, `/ai-systems/business-os`; `/services` redirects |
| App readiness | GET scan/fix routes read legacy DB and `@workspace/selena-visibility-contracts` scorer without tenant boundary | Both routes are canonical 410 tombstones; legacy readiness module is no longer exported or tested |
| Parity acceptance | Registry and fixtures existed, but no persisted comparative matrix covering platform/error/N/A scenarios | Added `data/visibility/cloudflare-selena-parity-matrix.v1.json` and schema/coverage tests |
| Historical internal docs | Older architecture files still describe `$9/$500/$4,000` and old AI-map route policy | Kept as historical records; current target is this reconciliation plus owner-locked RC6 catalog. No historical file is silently rewritten. |

## Current product boundaries

### Selena Systems

Master brand and company. Public commercial paths are:

1. AI Visibility — Public Readiness → real paid measurement → evidence → fix → re-measure → monitor.
2. AI Systems — custom audit, sprint and Business OS work.

Selena Lab is the research, guides, experiments, articles and courses layer. It is not a third commercial product line; unfinished courses are not sold. The canonical future private learning boundary is `/app/academy`; `/app/learn` is a compatibility redirect.

### Free Public Readiness

Canonical routes: `/check` and `/ru/check`. The URL is the only required input. The flow performs bounded public HTTP collection, uses versioned readiness rules, returns page/block evidence, concrete fix previews, copy/export and one verification comparison. It does not call paid AI providers, create measurement jobs or expose an AI-answer sample.

The displayed readiness score is not AI Visibility and is never presented as a recommendation or ranking outcome. `llms.txt` remains diagnostic-only with weight `0`.

### Paid AI Visibility

The owner-locked catalog remains:

- AI Visibility Snapshot — `$49/month`;
- AI Visibility Landscape — `$79/month`;
- Expert Verified — `$399 one-time`;
- Implementation + 90 days — `$2,490`, manual approval.

The paid measurement implementation remains in `elmo-source`, with Visitor View and API View kept separate. Public site copy does not open live checkout or provider execution.

### AI Systems

The public site now has a canonical English service entry with four visible price points sourced from `lib/commercial-facts.ts`: `$100` mini-audit, `$500` AI Audit, `$4,500` AI Sprint and `from $10,000` Business OS. These are not AI Visibility plans.

## Parity matrix boundary

The persisted matrix covers the required content, API, commerce, N/A, platform, multilingual and transport/SSRF scenarios. `PASS` in the matrix means the Selena contract has a deterministic fixture expectation with evidence/fix/verification fields. It does **not** claim that a live third-party Cloudflare site was scanned; the separate live result is recorded in `SELENA_CLOUDFLARE_LIVE_BENCHMARK_2026-08-16.md`.

The matrix test is `tests/unit/cloudflareParityMatrix.test.ts`; the live evidence record is guarded by `tests/unit/cloudflareLiveBenchmark.test.ts`. The live run used the public URL read-only and did not mutate production, DNS or payment/provider state.

## Remaining gates and plan

Current acceptance status: `MASTER CORRECTION — STAGING ACCEPTED / PRODUCTION OWNER GATE REQUIRED`.
The live benchmark and mobile browser evidence below are complete for the
staging/preview release; production, DNS, payments and provider execution
remain outside the gate.

### Completed in this pass

- retire legacy public report/sample execution paths;
- retire app duplicate readiness read/fix paths;
- create canonical AI Systems routes and legacy redirects;
- remove old routes from sitemap and update active navigation/CTA links;
- persist parity matrix and add coverage/field assertions;
- complete the live Cloudflare comparison on the same public URL and retain the evidence record;
- keep `/app/academy` as the canonical future learning boundary and `/app/learn` as a compatibility alias;
- complete 390×844 and 768×1024 browser acceptance for menu, forms, Pricing, Check report, Lab, redirects, overflow and console errors;
- keep provider calls, payments, maintenance and measurement jobs disabled.

### Still required before any commercial/live activation

- owner/legal inputs: final legal copy versions, support/privacy contact and applicable tax/refund terms;
- payment provider/KYC and explicit live-payment permission;
- production database backup/PITR restore acceptance;
- production deployment/DNS/provider permits only under a separate owner gate.

## Rollback

The scoped code changes are reversible by ordinary non-history-rewriting commits. The safe product rollback target remains the previously accepted public-site artifact `07d6fe9` and the current app release branch baseline. Existing immutable tags are not moved or deleted.

## Provenance

The Master Correction source is registered in Central Memory before new project facts were proposed:

- `record_id`: `94b61224-72aa-4aea-842b-450c3a9aed04`
- `source_version_id`: `b349d754-222c-4bd2-ad4a-a8fdbded79d7`
- `content_hash`: `89251e68d045d99f7c1f5da8b7c27414971b1aa82968aabd8977c0043b0de6f6`

The reconciliation document itself is also registered for implementation provenance:

- `record_id`: `6a9d808d-a7d6-4a2c-977f-4b7f98bde1cb`
- `source_version_id`: `1731ef23-06cd-4ac4-a810-56d3b1705de5`
- `content_hash`: `3bfd72426916b9e079795e88540cc67cc351491202c3e2180e20919dc27f36c0`
- `source_chunk_id`: `d94da0e6-dd55-459d-a99e-fa8228aca722`

Drafts proposed from that provenance (not confirmed by the owner):

- decision draft: `2b2d35d9-4dfc-4b8e-b417-056d98ad7129`
- knowledge draft: `ad811469-ae5d-4c1c-8bfd-9fa3f79cd34d`

No Central Memory record was confirmed, superseded or revoked by this document.
