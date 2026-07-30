# SELENA VISIBILITY — DECISION LOG

**Версия:** 1.0
**Дата создания:** 30 июля 2026
**Формат зафиксирован в SSOT** `docs/architecture/SELENA_SYSTEMS_VISIBILITY_PLATFORM_ARCHITECTURE_AND_CODEX_TZ_V1_0.md` §27.3.

Статусы: `PROPOSED`, `APPROVED`, `REJECTED`, `SUPERSEDED`, `NEEDS_OWNER`.

Это живой документ. Каждый следующий PR обязан обновлять его, а не создавать копию с суффиксом версии.

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
| D-008 | 2026-07-30 | Topvisor role: RU supplemental or later | NEEDS_OWNER | SSOT §9.3, §26 | Selena | RU monitoring (PR-05) |
| D-009 | 2026-07-30 | Apify Actor/version and budget | NEEDS_OWNER | SSOT §9.4, §26 | Selena | Provider fallback (PR-05) |
| D-010 | 2026-07-30 | Free sample environments (which providers/models are shown in Free Check) | NEEDS_OWNER | SSOT §4.1, §26 | Selena | Public AI sample (PR-05) |
| D-011 | 2026-07-30 | Report retention period | NEEDS_OWNER | SSOT §26 | Selena | Public launch (PR-06) |
| D-012 | 2026-07-30 | Public report expiration/revocation policy | NEEDS_OWNER | SSOT §14.5, §26 | Selena | Public launch (PR-03/PR-06) |
| D-013 | 2026-07-30 | Founding subscription prices | NEEDS_OWNER | SSOT §4.4, §26 | Selena | Paid beta (PR-08+) |
| D-014 | 2026-07-30 | Billing provider | NEEDS_OWNER | SSOT §26 | Selena | Paid beta (PR-08+) |
| D-015 | 2026-07-30 | One free rerun cooling period | NEEDS_OWNER | SSOT §4.1, §26 | Selena | Public launch (PR-06) |
| D-016 | 2026-07-30 | Old AI Map redirect date (`/ru/ai-map → /ru/process-check`) | NEEDS_OWNER | SSOT §6.3, §19.1, §26 | Selena | Process Check parity |
| D-017 | 2026-07-30 | Villa host redirect date | NEEDS_OWNER | SSOT §4.3, §26 | Selena | Villa parity |
| D-018 | 2026-07-30 | Analytics provider and consent class | NEEDS_OWNER | SSOT §26 | Selena | Analytics release |
| D-019 | 2026-07-30 | Human review SLA | NEEDS_OWNER | SSOT §26 | Selena | Growth plan (Phase 5) |
| D-020 | 2026-07-30 | Agent OS handoff scope | NEEDS_OWNER | SSOT §10.2, §26 | Selena | Managed plan (Phase 5) |

## 2. Discovery-pass decisions (Codex-level, scoped to documentation only)

Эти записи не требуют владельца — это инженерные/документационные решения, принятые Codex в рамках разрешённого discovery-scope, зафиксированные для прозрачности (SSOT §27.4 требует не менять репозиторий молча).

| ID | Date | Decision | Status | Evidence | Owner | Affected scope |
|---|---|---|---|---|---|---|
| DOC-001 | 2026-07-30 | Использовать путь `docs/visibility/*` для пяти discovery-документов, а не альтернативный набор путей из SSOT §21 (`docs/audits/*`, `docs/decisions/*`, `docs/implementation/*`) | APPROVED | SSOT §21 предлагает один набор путей ("PR-00 — Discovery and source of truth"), но более поздние и более детальные разделы §27.3, §28.3, §30 и финальный §34 ("Canonical next action") последовательно требуют именно `docs/visibility/SELENA_VISIBILITY_*`. По правилу §19.3 ("этот документ" имеет приоритет как источник №1, а внутри документа явно исполняемые Codex-инструкции §27-34 конкретнее декларативного PR-плана §21) выбран `docs/visibility/*`. | Codex (discovery pass) | Именование файлов документации |
| DOC-002 | 2026-07-30 | Не выполнять read-only инспекцию `parkourcafe/Bali-OS-VILLA-2026` в этом проходе | NEEDS_OWNER / needs_verification | MCP-инструмент для подключения дополнительного репозитория был недоступен в момент прохода (сервер переподключался). Зафиксировано как gap в Current State Reconciliation §8. | Codex (следующий проход) | Villa reuse plan (Phase 2/PR-04+) |
| DOC-003 | 2026-07-30 | Не изменять "Project overview" в `CLAUDE.md`/`AGENTS.md` (устаревшее упоминание бренда KORA вместо Selena Systems) в этом проходе | NEEDS_OWNER | Изменение публичного позиционирования/канонических документов вне разрешённого scope discovery-прохода (SSOT §27.2/§30: "Do not change production feature code, public copy, routes..."). Зафиксировано как конфликт в Current State Reconciliation §6.2. | Selena | Репозиторные инструкции для будущих агентов |
| DOC-004 | 2026-07-30 | Не создавать тестовый скрипт/фреймворк в этом проходе, несмотря на отсутствие `npm test` | NEEDS_OWNER | SSOT §22.5 требует явного решения вместо придуманной команды; выбор конкретного test runner — инженерное решение, относящееся к PR-01 реализации, а не к read-only discovery. Зафиксировано в Current State Reconciliation §2. | Selena / Codex (PR-01) | Test infrastructure (PR-01+) |

## 3. Как обновлять этот документ

1. Новая строка добавляется, не переписывается существующая — если решение меняется, старая строка получает статус `SUPERSEDED` со ссылкой на новую строку.
2. Каждый approved owner decision должен получить дату, имя решившего и точную ссылку на affected PR/scope.
3. Ни один PR из `SELENA_VISIBILITY_IMPLEMENTATION_PLAN_V1.md` не должен пересекать свой gate, если блокирующий его D-### всё ещё `NEEDS_OWNER`.
