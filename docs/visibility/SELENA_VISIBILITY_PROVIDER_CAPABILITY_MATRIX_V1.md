# SELENA VISIBILITY — PROVIDER CAPABILITY MATRIX V1

**Версия:** 1.0
**Дата:** 30 июля 2026
**Основано на:** `docs/architecture/SELENA_SYSTEMS_VISIBILITY_PLATFORM_ARCHITECTURE_AND_CODEX_TZ_V1_0.md` §9, §32

## Как читать этот документ

Все строки ниже воспроизводят факты, которые **SSOT** уже пометил как **[ИЗВЛЕЧЕНО]** из официальной документации провайдеров на 30 июля 2026 года. Этот discovery-проход был read-only **инспекцией репозитория**, а не рантайм-проверкой внешних API: ни один провайдерский endpoint не вызывался, ни один API-ключ не запрашивался и не тестировался. Поэтому колонка `verified_at` для каждого провайдера ниже помечена как непроверенную в этом проходе — это соответствует правилу SSOT §0: провайдерская способность остаётся `needs_verification`, пока её не подтвердит реальный API-вызов, актуальная официальная документация на момент внедрения или production-тест, а не только повторное чтение SSOT.

Ни один из перечисленных провайдеров не имеет установленного SDK, клиента, ключа или интеграции в текущем репозитории (подтверждено в `SELENA_VISIBILITY_CURRENT_STATE_RECONCILIATION_V1.md` §4) — вся строка "Current repo integration" ниже одинакова для всех провайдеров: **отсутствует**.

---

## 1. SE Ranking (AI Results Tracker API)

| Поле | Значение |
|---|---|
| Official capability | AI Results Tracker: ChatGPT, Perplexity, Gemini, Google AI Overview, Google AI Mode; brands, prompts, rankings, full answer evidence, source URLs, detected brand mentions, competitor/source analysis (SSOT §9.2, §32.1) |
| Authentication | Не проверено в этом проходе. `needs_verification`. |
| Unit/pricing contract | Не подтверждено документально в этом проходе — SSOT явно требует "Обязательная runtime-проверка: ... API cost" (§9.2) до включения. `needs_verification`. |
| Region/language controls | Заявлено как поддерживаемое официальной документацией; точная семантика region/language не проверена рантаймом. `needs_verification`. |
| Answer text availability | Полный текст AI-ответа доступен через API (согласно официальной документации) — но публикация raw текста ограничена provider terms (SSOT §9.2, §15.3): "do not expose full raw answer publicly unless provider terms allow". |
| Citation/source availability | Отдельные Sources/Competitors endpoints (SSOT §9.2). |
| Competitor/brand extraction | Да, официально заявлено. |
| History/retention | Историю результатов провайдер хранит; retention limits на стороне Selena должны уважать text retention limits провайдера (SSOT §9.2). |
| Rate limits | Не проверено. `needs_verification`. |
| Known limitations | Является API-вызовом модели, не воспроизводит буквально consumer-интерфейс ChatGPT/Perplexity — запрещено маркировать как "ChatGPT result" без честной атрибуции (SSOT §8.7). |
| Allowed for | Primary candidate: Free (ограниченная выборка), Monitor, Growth, Audit — согласно product architecture (SSOT §4.1–§4.5). Финальное распределение по планам — часть PR-05 design, не решено в этом проходе. |
| Fallback behavior | При недоступности — report помечает AI sample секцию `unavailable`/`partial`, не превращается в отказ всего отчёта (SSOT §11.2). |
| `verified_at` | Не проверено в этом discovery-проходе. Источник: SSOT §9.2/§32.1, датированный 30 июля 2026. Требуется отдельная runtime-проверка перед PR-05 (SSOT gate: "provider contract верифицирован"). |

## 2. Topvisor (AI Tracker / API)

| Поле | Значение |
|---|---|
| Official capability | AI Tracker: mentions, visibility, sentiment, relative position, competitors, scheduled checks, API access, несколько AI-моделей (SSOT §9.3, §32.2) |
| Authentication | Не проверено. `needs_verification`. |
| Unit/pricing contract | Не проверено. `needs_verification`. |
| Region/language controls | Официально заявлены region/language controls (SSOT §32.2); не проверено рантаймом. |
| Answer text availability | Не детализировано в SSOT сверх общего "mentions/visibility/sentiment". `needs_verification`. |
| Citation/source availability | Не заявлено как web-grounded citation source — модели **не используют web search/reasoning** (SSOT §9.3, официально указано провайдером). |
| Competitor/brand extraction | Да. |
| History/retention | Не детализировано. `needs_verification`. |
| Rate limits | Не проверено. `needs_verification`. |
| Known limitations | Явный запрет: "не смешивать его citation claims с web-grounded environments"; должен маркироваться в отчёте как `no-web model sample` (SSOT §9.3). Не заменяет Google AI Overview tracking. |
| Allowed for | Supplemental provider, особенно для RU/Alice AI (SSOT §9.3). Не единственный источник для RU market. |
| Fallback behavior | При недоступности — RU AI sample может частично полагаться на SE Ranking (где поддерживается) или помечаться `unavailable`. |
| `verified_at` | Не проверено в этом проходе. Источник: SSOT §9.3/§32.2, датирован 30 июля 2026. |

## 3. Apify (Actors)

| Поле | Значение |
|---|---|
| Official capability | Public crawling, Google AI Overview/AI Mode capture, provider fallback, batch URL discovery, queueable background jobs (SSOT §9.4) |
| Authentication | Не проверено. `needs_verification`. |
| Unit/pricing contract | Не проверено; SSOT требует cost cap перед использованием (§9.4, §14.4). |
| Region/language controls | Зависит от конкретного Actor; не проверено. |
| Answer text availability | Зависит от Actor (capture-специфично); не проверено. |
| Citation/source availability | Возможно через Google AI Overview capture Actor; не проверено рантаймом. |
| Competitor/brand extraction | Не встроено нативно — реализуется через собственную нормализацию поверх Actor output. |
| History/retention | Хранится Actor run ID; retention — на стороне Selena storage, не Apify. |
| Rate limits | Не проверено. |
| Known limitations | SSOT explicit rules: pin Actor/version, validate output schema, store run ID, timeout + cost cap, не зависеть от unversioned community Actor как единственного источника, без CAPTCHA bypass, без login bypass, без private data, проверка terms и geographical legality (§9.4). |
| Allowed for | Secondary/optional provider fallback (SSOT §9.1 matrix: "Secondary / later"). |
| Fallback behavior | Optional — отсутствие Apify не блокирует core Free Check flow. |
| `verified_at` | Не проверено в этом проходе. Источник: SSOT §9.4, датирован 30 июля 2026. |

## 4. Google Search Console API

| Поле | Значение |
|---|---|
| Official capability | Search analytics (query/page/country/device), verified properties, sitemaps — только для владельца, подтвердившего property через OAuth (SSOT §9.5, §32.3) |
| Authentication | OAuth, ownership verification обязательна перед использованием. |
| Unit/pricing contract | Бесплатный API от Google; quota limits применяются (не детализированы, `needs_verification`). |
| Region/language controls | N/A — это first-party analytics владельца, не публичный сторонний сигнал. |
| Answer text availability | N/A. |
| Citation/source availability | N/A — это не AI-citation источник, это search performance data. |
| Competitor/brand extraction | N/A. |
| History/retention | Управляется Google; Selena хранит копию экспортированных данных согласно собственной retention-политике. |
| Rate limits | Не детализировано; стандартные Google API quotas. |
| Known limitations | Явный запрет: "Не использовать GSC в anonymous Free Check" (SSOT §9.5) — это connected-data layer только для Growth и paid Audit, требует OAuth и подтверждённого владения. Уже существует Google verification file в репозитории (`public/google701d47690a232c57.html`), но OAuth-flow и API-интеграция отсутствуют. |
| Allowed for | Growth, paid Audit (не Free, не anonymous). |
| Fallback behavior | Отсутствие подключения не блокирует Free/Monitor — GSC-слой относится к Phase 5. |
| `verified_at` | Не проверено в этом проходе. Существование verification file подтверждено в репозитории (Current State Reconciliation §3), сам OAuth API — не проверен рантаймом. |

## 5. PageSpeed Insights API

| Поле | Значение |
|---|---|
| Official capability | Mobile и desktop lab data, Lighthouse categories, performance evidence, selected actionable audits (SSOT §9.6, §32.4) |
| Authentication | API key (стандартный Google API key flow); не проверено в этом проходе. |
| Unit/pricing contract | Есть quota/rate limits согласно SSOT §32.4; точные цифры не проверены. |
| Region/language controls | N/A — технический performance-сигнал, не языковой. |
| Answer text availability | N/A. |
| Citation/source availability | N/A. |
| Competitor/brand extraction | N/A. |
| History/retention | Single-run snapshot; Selena должен кэшировать и не пересчитывать нестабильно на каждый запрос. |
| Rate limits | Есть; не детализированы, `needs_verification`. |
| Known limitations | Explicit rule: "Не превращать нестабильный single-run score в главный Selena score" (SSOT §9.6); failure не должен делать весь report failed (SSOT §32.4). |
| Allowed for | Free, Monitor, Growth, Audit — как optional technical evidence, cached и failure-tolerant. |
| Fallback behavior | `PAGESPEED_UNAVAILABLE` — определённый error code (SSOT §13.6); Public Readiness score продолжает считаться по измеренным check, PageSpeed failure не обнуляет остальное. |
| `verified_at` | Не проверено в этом проходе. Источник: SSOT §9.6/§32.4, датирован 30 июля 2026. |

## 6. Supabase

| Поле | Значение |
|---|---|
| Official capability | Postgres, Row Level Security, Edge Functions, Cron, Queues (SSOT §9.8, §32.5) |
| Authentication | Service role (server-only) + anon key (client, ограниченный RLS); стандартная Supabase модель. |
| Unit/pricing contract | Зависит от выбранного плана/региона — блокировано D-005 (`NEEDS_OWNER`, project и region не выбраны). |
| Region/language controls | Region выбирается при создании проекта — часть D-005. |
| Answer text availability | N/A — это хранилище, не AI-провайдер. |
| Citation/source availability | N/A. |
| Competitor/brand extraction | N/A. |
| History/retention | Полностью управляется схемой Selena (миграции описаны в Implementation Plan §4); Supabase не диктует retention. |
| Rate limits | Зависит от плана; не проверено. |
| Known limitations | Explicit rule: "Heavy external crawling не должен бездумно исполняться внутри пользовательского request-response пути" (SSOT §9.8) — Supabase Edge Functions не заменяют полноценную async job architecture (n8n/queue). |
| Allowed for | Canonical product database для persistent MVP и далее (PR-02+). Не нужен для PR-01 (route shells без backend). |
| Fallback behavior | N/A — при недоступности БД весь backend deliverable недоступен; это canonical source of truth, без него Phase 2+ не функционирует. |
| `verified_at` | Не проверено в этом проходе — проект ещё не создан (D-005 open). |

## 7. n8n

| Поле | Значение |
|---|---|
| Official capability | Оркестрация provider jobs, нормализация callbacks, transactional email, lead routing, internal alerts (SSOT §9.7) |
| Authentication | Webhook signing (HMAC-SHA256) между n8n и приложением (SSOT §13.5); production endpoint/credentials — D-006 (`NEEDS_OWNER`). |
| Unit/pricing contract | Зависит от хостинга (self-hosted vs n8n cloud) — не решено. |
| Region/language controls | N/A. |
| Answer text availability | N/A — n8n не хранит canonical AI-ответы, только оркестрирует их получение. |
| Citation/source availability | N/A. |
| Competitor/brand extraction | N/A. |
| History/retention | Explicit rule: "n8n не является system of record... не единственным местом scoring logic... не единственным местом secrets" (SSOT §9.7). Execution history n8n не заменяет Supabase-хранилище. |
| Rate limits | N/A на уровне провайдера; ограничено собственной queue-архитектурой. |
| Known limitations | Не dashboard, не источник истины по статусу scan. |
| Allowed for | Orchestration layer с PR-03 (async job model) и далее. |
| Fallback behavior | Job stuck/dead-letter alert (SSOT §11.2, §24.2) — недоступность n8n не должна тихо терять уже собранный evidence. |
| `verified_at` | Не проверено в этом проходе — production endpoint не выбран (D-006 open). |

## 8. Vercel

| Поле | Значение |
|---|---|
| Official capability | Next.js UI hosting, thin API routes, authentication boundary, signed webhooks, report serving, cron trigger (SSOT §9.9, §32.6) |
| Authentication | Существующий deployment уже на Vercel (подтверждено package.json/Next.js конвенциями и отсутствием альтернативного hosting config); env vars управляются через Vercel dashboard, не раскрыты в этом документе. |
| Unit/pricing contract | Существующий production hosting — уже используется, не новая интеграция. |
| Region/language controls | N/A. |
| Answer text availability | N/A. |
| Citation/source availability | N/A. |
| Competitor/brand extraction | N/A. |
| History/retention | N/A на уровне hosting; function execution limits применяются к длительным задачам. |
| Rate limits | Vercel Cron вызывает route по расписанию, не гарантирует retry сам по себе; наследует execution limits функций (SSOT §32.6). |
| Known limitations | Explicit rule: "Scheduler/trigger, not the only durable job system" — нельзя полагаться на Vercel Cron как единственный reliable queue (SSOT §9.1 matrix явно исключает "cron as reliable queue" как замену). |
| Allowed for | UI, thin API, cron trigger where suitable — уже используется для текущего сайта. |
| Fallback behavior | Тяжёлая работа (crawl + PageSpeed + AI calls) не должна выполняться синхронно в одном Vercel request (SSOT §9.9). |
| `verified_at` | Существующая production-конфигурация подтверждена косвенно (Next.js/Vercel-ориентированные конвенции репозитория); точные env var names и project settings не раскрывались в этом документе согласно инструкции "без раскрытия values" (SSOT §27.2.2). |

---

## Сводная таблица допуска по планам (предварительная, требует подтверждения в PR-05)

| Provider | Free | Monitor | Growth | Audit (paid, human-reviewed) |
|---|---|---|---|---|
| SE Ranking | Ограниченно (2 engines, 3 prompts) | Да | Да | Да, расширенный (50–100 prompts) |
| Topvisor | Опционально (RU) | Опционально | Опционально | Опционально |
| Apify | Fallback only | Fallback only | Fallback only | Fallback only |
| Google Search Console | Нет | Нет | Да (OAuth) | Да (OAuth) |
| PageSpeed | Да | Да | Да | Да |
| Supabase | — (job metadata) | — | — | — |
| n8n | — (orchestration) | — | — | — |
| Vercel | — (hosting) | — | — | — |

Эта таблица — рабочая гипотеза на основе SSOT §4, не финальное решение; должна быть подтверждена перед PR-05 gate.
