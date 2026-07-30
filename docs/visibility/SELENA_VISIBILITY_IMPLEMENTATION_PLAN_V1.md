# SELENA VISIBILITY — IMPLEMENTATION PLAN V1

**Версия:** 1.1
**Дата:** 30 июля 2026
**Основано на:** `docs/architecture/SELENA_SYSTEMS_VISIBILITY_PLATFORM_ARCHITECTURE_AND_CODEX_TZ_V1_1.md` (§20–§26, §29)
**Входные данные:** `docs/visibility/SELENA_VISIBILITY_CURRENT_STATE_RECONCILIATION_V1.md`

Этот документ переводит фазы SSOT в проверяемый PR-план с зависимостями, тестами, feature flags, наблюдаемостью и rollback. Он **не авторизует** никакой код в этом проходе — все PR ниже требуют отдельного запуска Codex после review.

> **Обновлено под SSOT V1.1.** Phase 4 теперь называется "Monitor subscription" ($9/мес, полностью автоматический вместо $149-гипотезы V1.0); Phase 5 переименована в "Connected data and future scale" и явно помечена `OUT OF MVP` — Growth/Managed plan в ней не подразумеваются. PR-08+ переименован в PR-08 ($9 Monitor subscription).

---

## 1. Обзор фаз

```text
Phase 0 — Baseline и discovery                     ← этот проход (документация)
Phase 1 — Free Check shell с mock evidence          (PR-01 … PR-03)
Phase 2 — Owned crawler и техническая evidence      (PR-04)
Phase 3 — Live AI sample и pilot                    (PR-05, PR-07)
Phase 4 — $9 Monitor subscription                   (PR-08)
Phase 5 — Connected data and future scale           (OUT OF MVP, отдельное owner-решение)
```

Ни одна фаза не начинается, пока не закрыт GO/STOP gate предыдущей. Phase 5 в SSOT V1.1 explicitly не подразумевает: Yandex, региональный provider по умолчанию, публичный Growth/Managed plan, human-review подписку (SSOT §20, "Explicitly not implied").

## 2. PR-план с зависимостями

| PR | Название | Зависит от | Затрагивает |
|---|---|---|---|
| PR-00 | Discovery и source of truth (этот проход) | — | `docs/architecture/*`, `docs/visibility/*` |
| PR-01 | IA, route shells и homepage entry | PR-00 approved | `app/visibility`, `app/check`, `app/methodology`, `app/pricing` + `/ru/*`, `lib/visibility/*`, `components/visibility/*`, homepage CTA |
| PR-02 | Contracts, database и security foundation | PR-01 | `supabase/migrations`, `lib/diagnostics/*`, `lib/visibility/security/*`, feature flags |
| PR-03 | Mocked end-to-end MVP | PR-02 | `app/api/checks*`, `app/report/[token]`, mock provider, e2e тесты |
| PR-04 | Crawler и deterministic scoring | PR-03, D-005 | `lib/visibility/crawler`, `lib/visibility/checks`, `lib/visibility/scoring`, `data/visibility/scoring.v1.json` |
| PR-05 | Live providers | PR-04, D-007, D-009 | `lib/visibility/providers/*` (SE Ranking + optional Apify; никакого регионального provider — D-008 (v1.1) закрыт как "out of scope", не блокер) |
| PR-06 | Delivery, consent и lead routing | PR-05, D-003, D-004 | email unlock, marketing opt-in, internal notification |
| PR-07 | QA, observability и pilot | PR-06 | dashboards, alerts, runbooks, pilot calibration |
| PR-08 | $9 Monitor subscription | Phase 3 gate closed, D-021 (COGS pilot economics) | auth, orgs, billing (D-013 price already fixed at $9/$90, D-014 provider still open) |

PR-01 — единственный PR, который может стартовать без owner decisions (не требует D-001…D-020). Это подтверждено discovery: PR-01 scope (SSOT §29) explicitly исключает email collection, API calls, Supabase, n8n, subscriptions.

## 3. Feature flags (вводятся по фазам)

**[ИЗВЛЕЧЕНО из SSOT §10.6 и §27.7, объединено]**

| Flag | Вводится в | Default |
|---|---|---|
| `VISIBILITY_ENABLED` | PR-01 | `false` до preview review |
| `VISIBILITY_FREE_CHECK_ENABLED` | PR-01 | `false` |
| `VISIBILITY_PROCESS_CHECK_ENABLED` | Phase 2 (Process Check) | `false` |
| `VISIBILITY_LIVE_CRAWLER_ENABLED` | PR-04 | `false` |
| `VISIBILITY_PAGESPEED_ENABLED` | PR-04 | `false` |
| `VISIBILITY_AI_SAMPLE_ENABLED` | PR-05 | `false` |
| `VISIBILITY_SE_RANKING_ENABLED` | PR-05 | `false` |
| `VISIBILITY_APIFY_ENABLED` | PR-05 (optional) | `false` |
| `VISIBILITY_EMAIL_UNLOCK_ENABLED` | PR-06 | `false` |
| `VISIBILITY_GSC_OAUTH_ENABLED` | Phase 5 (out of MVP) | `false` |
| `VISIBILITY_GA4_OAUTH_ENABLED` | Phase 5 (out of MVP) | `false` |
| `VISIBILITY_SUBSCRIPTIONS_ENABLED` | PR-08 | `false` |
| `VISIBILITY_MONITOR_ENABLED` | PR-08 | `false` |
| `VISIBILITY_PUBLIC_REPORTS_ENABLED` | PR-03 | `false` |
| `VISIBILITY_VILLA_REDIRECT_ENABLED` | После Villa parity gate | `false` |

Правило: каждый provider/paid/external capability по умолчанию выключен; включение — server-side проверка, никогда client-only. **`VISIBILITY_TOPVISOR_ENABLED` и `VISIBILITY_MANAGED_PLAN_ENABLED` из V1.0 удалены** — регион-providers вне scope (D-008 (v1.1)), Managed/Growth plan не существует в V1.1 MVP (SSOT §27.7 flag list подтверждает это explicitly).

## 4. Migrations

**[ИНТЕРПРЕТИРОВАНО]**

Persistent storage (Supabase) не нужен до PR-02/PR-03. Порядок таблиц следует SSOT §12.1 (Phase MVP) → §12.2 (Phase 3):

```text
PR-02: leads, sites, diagnostic_runs, scan_pages, scan_checks, reports, diagnostic_events
PR-03: (те же таблицы, заполняются mock-данными; фикстуры вместо live evidence)
PR-04: scan_checks (реальные rule outputs), provider_usage
PR-05: ai_prompt_runs, ai_observations, ai_citations, provider_usage (live)
PR-08: organizations, organization_members, projects, subscriptions,
       subscription_entitlements, tracked_prompts, prompt_groups,
       competitors, scheduled_runs, integration_connections,
       oauth_tokens_encrypted, human_reviews, implementation_tasks, audit_log
```

Все миграции — additive only (SSOT §27.4): никаких destructive down-migrations без отдельного owner-approved runbook.

## 5. Test plan по фазам

**[ИЗВЛЕЧЕНО из SSOT §23, привязано к текущему состоянию]**

Discovery подтвердил: сейчас в репозитории **нет** тестовой инфраструктуры (`npm test` не существует). Поэтому PR-01 обязан либо явно ввести минимальный test runner (рекомендация: Playwright для e2e согласно `tests/e2e/` в целевой структуре SSOT §10.4, плюс лёгкий unit runner для чистых функций типа `lib/visibility/scoring`), либо явно задокументировать `needs_verification` вместо придуманной команды — SSOT §22.5 прямо запрещает "invent a passing command".

| Фаза | Unit | Integration | E2E |
|---|---|---|---|
| PR-01 | routing/metadata helpers | — | все новые routes возвращают 200; canonical/hreflang корректны; no network call из формы; noindex на mock preview |
| PR-02 | validators, idempotency, signature | migrations apply cleanly | — |
| PR-03 | — | create run → queue → fixture report → unlock | EN/RU successful mock scan, invalid URL, duplicate submit |
| PR-04 | URL normalization, private-IP detection (IPv4/IPv6), redirect safety, robots/noindex/canonical/sitemap parsing, JSON-LD parsing, score denominator, `not_measured` handling | crawl fixture, partial provider failure | private host, WAF/403, redirect-to-private-host, HTML too large, no sitemap, JS-empty content |
| PR-05 | mention/citation matching, confidence rules | provider fixture, one-provider failure | zero valid AI answers, partial report |
| PR-06 | — | transactional delivery stub, lead upsert, deletion, token revocation | email unlock, marketing opt-out, expired/revoked report |
| PR-07 | — | — | mobile keyboard/screen reader path, full E2E list SSOT §23.3 (20 сценариев) |

## 6. Observability (вводится с PR-04 и далее)

**[ИЗВЛЕЧЕНО из SSOT §24]**

Dashboards: runs by status, stage latency, provider error rate, cost/run, partial rate, invalid sample rate, unlock conversion, CTA conversion, abuse blocks, email delivery.

Runbooks (создаются по мере ввода соответствующей capability, не все сразу в PR-01):

```text
PROVIDER_OUTAGE.md        — с PR-05
QUEUE_STUCK.md             — с PR-03 (как только появляется async job model)
REPORT_REGENERATION.md     — с PR-04
TOKEN_REVOCATION.md        — с PR-03
DATA_DELETION.md           — с PR-02 (leads уже собираются)
COST_CIRCUIT_BREAKER.md    — с PR-05
LEGAL_COPY_RELEASE.md      — до PR-06 (email unlock требует одобренной Privacy-страницы)
PILOT_CALIBRATION.md       — с PR-07
```

## 7. Rollback per phase

**[ИЗВЛЕЧЕНО из SSOT §25]**

| Фаза | Rollback |
|---|---|
| PR-01 | Feature flag скрывает модуль; старый homepage CTA восстанавливается; новые routes могут отдавать 404/maintenance без влияния на существующий сайт; редиректов на новые routes нет, пока не стабильно. |
| PR-04 (crawler) | Отключить live crawler flag; mock/maintenance response; исторические отчёты сохраняются; без destructive down-migration. |
| PR-05 (providers) | Отключить provider flag; показать technical-only report; пометить AI sample как unavailable; billing остаётся выключенным. |
| PR-08 ($9 Monitor subscription) | Отключить новые подписки; существующие пользователи сохраняют export/access; без silent data loss; отменить расписания; оплаты — по одобренным условиям. |

## 8. GO/STOP gates

**[ИЗВЛЕЧЕНО из SSOT §20, дословно по фазам]**

### Phase 0 gate (этот проход)

```text
GO:
[x] baseline воспроизведён (см. Current State Reconciliation §1-2)
[x] все текущие routes сохранены (ничего не изменено)
[x] legal blockers задокументированы (D-001, D-002)
[x] дублирующей продуктовой модели не создано
[x] build/typecheck/lint проходят

→ STATUS: GO для Phase 0. Разрешён переход к PR-01 после review владельцем.
```

### Phase 1 gate (PR-01…PR-03)

```text
GO только если:
[ ] end-to-end проходит на deterministic fixture
[ ] ограничения отчёта видимы пользователю
[ ] value показывается до email
[ ] partial state поддерживается
[ ] нет непрозрачного overall score
[ ] нет секретных/клиентских данных в публичном пути
```

### Phase 2 gate (PR-04)

```text
GO только если:
[ ] SSRF test suite проходит
[ ] redirect tests проходят
[ ] max bytes/timeouts проверены
[ ] partial failures обрабатываются без падения отчёта
[ ] fixture parity подтверждена
[ ] нет overclaim-формулировок в UI copy
```

### Phase 3 gate (PR-05, PR-07)

```text
GO только если:
[ ] provider contract верифицирован рантаймом (не только официальной документацией)
[ ] sample labels точны (SE Ranking / generic LLM не путаются; никакой региональный provider не заявлен)
[ ] API cost измерен
[ ] минимум 50 test/pilot runs выполнено
[ ] human disagreement rate рассмотрен
[ ] нет неподтверждённых platform labels
```

### Phase 4 gate (PR-08, $9 Monitor)

```text
GO только если:
[ ] подтверждён спрос free-to-audit
[ ] provider gross margin посчитан; фактический COGS ≤$3.50/project/month (hard stop >$5.00, см. D-021)
[ ] legal/privacy review завершён
[ ] payment provider выбран (D-014)
[ ] deletion flow реализован
[ ] subscription lifecycle (pause/cancel/export) реализован
[ ] failed payment behavior определено
[ ] server-enforced entitlements: 1 домен, 1 рынок, 1 язык, 5 prompts, 2 AI environments, 1 competitor, 1 run/month
[ ] нет human-review/onboarding call/priority support implied на $9 tier
```

## 9. Owner decisions, блокирующие следующие фазы

**[РЕШЕНИЕ ВЛАДЕЛЬЦА]** — полная таблица перенесена и статус выставлен в `SELENA_VISIBILITY_DECISION_LOG.md`. Ключевые блокеры для ближайшего PR:

```text
Не блокируют PR-01: все D-001…D-020 (PR-01 не собирает email, не пишет в БД, не вызывает providers).
Блокируют PR-02/PR-03: D-005 (Supabase project/region).
Блокируют PR-05: D-007 (SE Ranking budget), D-009 (Apify budget), D-010 (free sample environments).
  D-008 (v1.1) уже APPROVED — региональные providers вне scope, не блокер.
Блокируют PR-06: D-001, D-002, D-003, D-004, D-011, D-012, D-015.
Блокируют PR-08: D-014 (billing provider), D-021 (COGS pilot economics gate).
  D-013 (v1.1) цена уже зафиксирована ($9/мес или $90/год) — не блокер сам по себе,
  но entitlements могут ужаться, если D-021 hard stop сработает.
```

## 10. Немедленно следующий безопасный PR

```text
PR-01 — IA, route shells and homepage entry
```

Полный scope, route behavior, copy guardrails, component map, тесты и acceptance checklist для PR-01 уже полностью специфицированы в каноническом документе, раздел §29 — этот implementation plan не дублирует их текстуально, а только фиксирует, что discovery не выявил причин их менять или откладывать. PR-01 не должен запускаться в этом же проходе (правило SSOT §30: "Stop after the discovery package. Do not begin PR-01 in the same run.").
