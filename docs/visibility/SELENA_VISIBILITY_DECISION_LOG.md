# SELENA VISIBILITY — DECISION LOG

**Версия:** 1.1
**Дата создания:** 30 июля 2026
**Последнее обновление:** 30 июля 2026 (после перехода SSOT на V1.1)
**Формат зафиксирован в SSOT** `docs/architecture/SELENA_SYSTEMS_VISIBILITY_PLATFORM_ARCHITECTURE_AND_CODEX_TZ_V1_1.md` §27.3.

Статусы: `PROPOSED`, `APPROVED`, `REJECTED`, `SUPERSEDED`, `NEEDS_OWNER`.

Это живой документ. Каждый следующий PR обязан обновлять его, а не создавать копию с суффиксом версии.

> **Переход на SSOT V1.1.** Канонический документ обновлён с V1.0 на V1.1: базовый `Monitor` теперь стоит `$9/мес.` (или `$90/год`), полностью автоматический, без Growth-плана; Яндекс/Topvisor/региональные providers исключены из обязательного ядра и roadmap. По правилу ниже (раздел "Как обновлять этот документ") старые строки D-008 и D-013 помечены `SUPERSEDED`, а не переписаны — новые строки отражают V1.1 и обязательны к прочтению перед PR-05/PR-08.

---

## 1. Owner decisions (перенесены из SSOT §26, статус на дату discovery)

Все нижеперечисленные решения **не были приняты владельцем** на момент этого прохода — статус `NEEDS_OWNER` для каждого. Discovery не блокируется этими пунктами (SSOT §26: "Codex не блокирует discovery из-за этих пунктов, но не выпускает зависимый phase"), но соответствующие PR не могут выйти за свой gate без ответа.

| ID | Date | Decision | Status | Evidence | Owner | Affected scope |
|---|---|---|---|---|---|---|
| D-001 | 2026-07-30 | Legal entity and jurisdiction | NEEDS_OWNER | SSOT §15.2, §26 | Selena | Public email collection (PR-06) |
| D-002 | 2026-07-30 | Privacy contact email | NEEDS_OWNER | SSOT §15.2, §26 | Selena | Public email collection (PR-06) |
| D-003 | 2026-07-30 | Transactional email provider | NEEDS_OWNER | SSOT §26 | Selena | Email unlock (PR-06) |
| D-004 | 2026-07-30 | Marketing email provider/consent wording | NEEDS_OWNER | SSOT §5.3, §26 | Selena | Marketing follow-up (PR-06) |
| D-005 | 2026-07-30 | Supabase project and region | NEEDS_OWNER | SSOT §9.8, §26 | Selena | Persistent MVP (PR-02) |
| D-006 | 2026-07-30 | n8n production endpoint/credentials | NEEDS_OWNER | SSOT §9.7, §26 | Selena | Live orchestration (PR-03+) |
| D-007 | 2026-07-30 | SE Ranking API access and budget | NEEDS_OWNER | SSOT §9.2, §26 | Selena | Live AI sample (PR-05) |
| D-008 | 2026-07-30 | Topvisor role: RU supplemental or later | SUPERSEDED — see D-008 (v1.1) | SSOT V1.0 §9.3, §26 | Selena | RU monitoring (PR-05) |
| D-008 (v1.1) | 2026-07-30 | Regional/RU-specific providers (Yandex, Topvisor, Alice AI, etc.) remain explicitly out of scope for MVP and Monitor; the shared provider-adapter interface is kept only as an architectural option, never a roadmap commitment | APPROVED | SSOT V1.1 §9.3, §26, §32.2 | Selena | Provider matrix (PR-05); public claims (all phases) |
| D-009 | 2026-07-30 | Apify Actor/version and budget | NEEDS_OWNER | SSOT §9.4, §26 | Selena | Provider fallback (PR-05) |
| D-010 | 2026-07-30 | Free sample environments (which providers/models are shown in Free Check) | NEEDS_OWNER | SSOT §4.1, §26 | Selena | Public AI sample (PR-05) |
| D-011 | 2026-07-30 | Report retention period | NEEDS_OWNER | SSOT §26 | Selena | Public launch (PR-06) |
| D-012 | 2026-07-30 | Public report expiration/revocation policy | NEEDS_OWNER | SSOT §14.5, §26 | Selena | Public launch (PR-03/PR-06) |
| D-013 | 2026-07-30 | Founding subscription prices (Monitor $149/mo, Growth $349/mo hypothesis) | SUPERSEDED — see D-013 (v1.1) | SSOT V1.0 §4.4, §26 | Selena | Paid beta (PR-08+) |
| D-013 (v1.1) | 2026-07-30 | Monitor founding price fixed at $9/month or $90/year, fully automated, no Growth/Managed tier in MVP; entitlements (prompts/environments/competitors) may shrink further if pilot COGS exceeds guardrail | APPROVED, subject to economics gate | SSOT V1.1 §4.4, §26 | Selena | Pricing page copy (done, PR-01); PR-08 scope |
| D-014 | 2026-07-30 | Billing provider | NEEDS_OWNER | SSOT §26 | Selena | Paid beta (PR-08) |
| D-015 | 2026-07-30 | One free rerun cooling period | NEEDS_OWNER | SSOT §4.1, §26 | Selena | Public launch (PR-06) |
| D-016 | 2026-07-30 | Old AI Map redirect date (`/ru/ai-map → /ru/process-check`) | NEEDS_OWNER | SSOT §6.3, §19.1, §26 | Selena | Process Check parity |
| D-017 | 2026-07-30 | Villa host redirect date | NEEDS_OWNER | SSOT §4.3, §26 | Selena | Villa parity |
| D-018 | 2026-07-30 | Analytics provider and consent class | NEEDS_OWNER | SSOT §26 | Selena | Analytics release |
| D-019 | 2026-07-30 | Human review scope and SLA for paid Audit | NEEDS_OWNER | SSOT V1.1 §26 | Selena | Paid Audit |
| D-020 | 2026-07-30 | Agent OS handoff scope | NEEDS_OWNER | SSOT §10.2, §26 | Selena | Implementation work (Phase 5) |
| D-021 | 2026-07-30 | Monitor COGS pilot economics: minimum 50 pilot runs before public checkout; target ≤$3.50/project/month, hard stop >$5.00/project/month | APPROVED (guardrail rule itself; actual measured COGS still `needs_verification`) | SSOT V1.1 §4.4 | Selena | Gate for PR-08 |

**Примечание про D-019:** SSOT V1.0 связывал это решение с несуществующим в V1.1 "Growth plan (Phase 5)". V1.1 удаляет Growth/Managed из MVP целиком (см. §4.4 "Чего нет в публичном MVP", §20 Phase 5 "Explicitly not implied: no public Growth or Managed plan") — human review остаётся только частью платного `AI Visibility Audit — $500`, поэтому affected scope обновлён на "Paid Audit" вместо "Growth plan".

## 2. Discovery-pass decisions (Codex-level, scoped to documentation only)

Эти записи не требуют владельца — это инженерные/документационные решения, принятые Codex в рамках разрешённого discovery-scope, зафиксированные для прозрачности (SSOT §27.4 требует не менять репозиторий молча).

| ID | Date | Decision | Status | Evidence | Owner | Affected scope |
|---|---|---|---|---|---|---|
| DOC-001 | 2026-07-30 | Использовать путь `docs/visibility/*` для пяти discovery-документов, а не альтернативный набор путей из SSOT §21 (`docs/audits/*`, `docs/decisions/*`, `docs/implementation/*`) | APPROVED | SSOT §21 предлагает один набор путей ("PR-00 — Discovery and source of truth"), но более поздние и более детальные разделы §27.3, §28.3, §30 и финальный §34 ("Canonical next action") последовательно требуют именно `docs/visibility/SELENA_VISIBILITY_*`. По правилу §19.3 ("этот документ" имеет приоритет как источник №1, а внутри документа явно исполняемые Codex-инструкции §27-34 конкретнее декларативного PR-плана §21) выбран `docs/visibility/*`. | Codex (discovery pass) | Именование файлов документации |
| DOC-002 | 2026-07-30 | Не выполнять read-only инспекцию `parkourcafe/Bali-OS-VILLA-2026` в этом проходе | NEEDS_OWNER / needs_verification | MCP-инструмент для подключения дополнительного репозитория был недоступен в момент прохода (сервер переподключался). Зафиксировано как gap в Current State Reconciliation §8. | Codex (следующий проход) | Villa reuse plan (Phase 2/PR-04+) |
| DOC-003 | 2026-07-30 | Не изменять "Project overview" в `CLAUDE.md`/`AGENTS.md` (устаревшее упоминание бренда KORA вместо Selena Systems) в этом проходе | NEEDS_OWNER | Изменение публичного позиционирования/канонических документов вне разрешённого scope discovery-прохода (SSOT §27.2/§30: "Do not change production feature code, public copy, routes..."). Зафиксировано как конфликт в Current State Reconciliation §6.2. | Selena | Репозиторные инструкции для будущих агентов |
| DOC-004 | 2026-07-30 | Не создавать тестовый скрипт/фреймворк в этом проходе, несмотря на отсутствие `npm test` | NEEDS_OWNER | SSOT §22.5 требует явного решения вместо придуманной команды; выбор конкретного test runner — инженерное решение, относящееся к PR-01 реализации, а не к read-only discovery. Зафиксировано в Current State Reconciliation §2. | Selena / Codex (PR-01) | Test infrastructure (PR-01+) |

## 3. PR-01 implementation decisions

По прямому запросу владельца PR-01 был реализован в этом же проходе (после явного подтверждения через уточняющий вопрос), не дожидаясь отдельного review discovery-пакета. Ниже — решения, принятые при реализации, где буквальное прочтение SSOT конфликтовало с сохранением существующего сайта.

| ID | Date | Decision | Status | Evidence | Owner | Affected scope |
|---|---|---|---|---|---|---|
| DOC-005 | 2026-07-30 | Не заменять существующий sitewide primary CTA (`cta.primary`/`cta.short` → `/free-ai-map`, `homepage.cta`/`ruHomepage.cta` → contact) на Visibility CTA. Вместо этого: (a) добавлен новый homepage-модуль `VisibilityEntryTeaser` сразу под hero со своим primary/secondary CTA на `/check`/`/ru/check`; (b) добавлены nav-ссылки "Visibility"/"Видимость" в `nav`, `enNav`, `homepage.nav`, `ruHomepage.nav`; (c) сами страницы `/visibility`, `/check`, `/methodology`, `/pricing` используют Visibility CTA нативно. Header/hero CTA на всех остальных существующих страницах не тронуты. | APPROVED | SSOT §29.3.4 буквально требует "Изменить главный CTA" сайта на Visibility, но `CLAUDE.md` ("Market-informed conversion layer v3") явно называет `Получить AI-карту возможностей` primary conversion, а `/free-ai-map` — полностью рабочая, developed воронка. Замена sitewide CTA без review — риск сломать уже работающий lead-flow и прямой конфликт со standing project instructions. Выбрано аддитивное решение: Visibility становится громким новым входом, не вытесняя существующий. | Codex (PR-01) | `lib/site.ts`, `lib/data/homepage.ts`, `lib/data/homepage-ru.ts`, `components/landing/B2BHomeLanding.tsx` |
| DOC-006 | 2026-07-30 | Расширить локале-детекцию в `components/layout/Header.tsx` и `components/layout/DocumentLanguage.tsx`, чтобы бренд-новые bare-root пути `/visibility`, `/check`, `/methodology`, `/pricing`, `/report/sample` явно распознавались как английские (через `isBareEnglishVisibilityPath` в `lib/visibility/routes.ts`), а не попадали в RU-ветку по умолчанию | APPROVED | SSOT §6.2 предполагает конвенцию "root = EN, /ru = RU" (унаследованную от `/ru/ai-map`), но фактическая практика репозитория — bare-root inner-страницы (`/services`, `/about`, `/contact`, `/ai-training` и т.д.) являются русскоязычными; только `/` и `/en/*` детектировались как английские до этого PR. Без исправления `/visibility` (EN-контент) получал бы русскую навигацию и `<html lang="ru">`. Зафиксировано как найденный, а не внесённый конфликт в Current State Reconciliation (реальная практика расходится с задокументированной в `docs/20-seo-top5-system.md` конвенцией) — исправление точечное, не переписывающее всю схему локалей. | Codex (PR-01) | `components/layout/Header.tsx`, `components/layout/DocumentLanguage.tsx`, `lib/visibility/routes.ts` |

## 4. Как обновлять этот документ

1. Новая строка добавляется, не переписывается существующая — если решение меняется, старая строка получает статус `SUPERSEDED` со ссылкой на новую строку.
2. Каждый approved owner decision должен получить дату, имя решившего и точную ссылку на affected PR/scope.
3. Ни один PR из `SELENA_VISIBILITY_IMPLEMENTATION_PLAN_V1.md` не должен пересекать свой gate, если блокирующий его D-### всё ещё `NEEDS_OWNER`.
