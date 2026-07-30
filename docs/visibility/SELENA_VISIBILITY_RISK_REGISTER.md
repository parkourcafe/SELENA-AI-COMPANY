# SELENA VISIBILITY — RISK REGISTER

**Версия:** 1.1
**Дата:** 30 июля 2026
**Основано на:** `docs/architecture/SELENA_SYSTEMS_VISIBILITY_PLATFORM_ARCHITECTURE_AND_CODEX_TZ_V1_1.md`, `SELENA_VISIBILITY_CURRENT_STATE_RECONCILIATION_V1.md`

Минимальные категории заданы SSOT §27.3. Каждый риск получает: описание, откуда взят (evidence), фаза, в которой материализуется, и mitigation, уже заложенный в SSOT или предлагаемый здесь.

> **Обновлено под SSOT V1.1.** Topvisor-специфичный риск снят (регион-провайдеры вне scope), риск дешёвого тарифа переписан под фактическую цену `$9/мес.` и добавлен новый риск: экономика на грани при такой низкой цене (§4.4 COGS guardrail).

---

## 1. Product truth

| Риск | Evidence | Фаза | Mitigation |
|---|---|---|---|
| LLM генерирует "красивое предположение" вместо `unknown` при неуверенности в entity-фактах | SSOT §8.4 | Phase 2 (Entity Clarity) | Deterministic evaluator по schema; LLM только предлагает candidate statements, не считает score. |
| Одна дата / один provider маскируется как обобщённый факт "видимости" | SSOT §0.1, §8.5 | Phase 1+ | Каждая метрика обязана иметь denominator, дату, provider/environment (SSOT §22.1). |
| Отсутствующий результат провайдера трактуется как `0%` вместо `not measured` | SSOT §8.5, §8.3 | Phase 1+ | `not_measured` не входит в denominator; UI визуально отличает `unavailable` от `fail` (SSOT §27.5). |
| `llms.txt` или наличие JSON-LD ошибочно преподносится как гарантия AI-цитирования | SSOT §8.8, §8.9, найдено как existing overclaim в Villa checker (Current State §8, SSOT §2.5) | Phase 2 | Score weight `llms.txt` = 0; schema — "machine-readable corroboration", не causal claim. |
| Единый "Business Health Score" случайно возникает из-за упрощения UI на поздних этапах | SSOT §1.3 — явный [НЕ ДЕЛАТЬ] | Все фазы | Явный запрет зафиксирован в SSOT и в этом реестре; ревью каждого PR должно проверять, что показываются раздельные `Public Readiness` / `Entity Clarity` / AI-counts, а не единый score. |

## 2. Legal / privacy

| Риск | Evidence | Фаза | Mitigation |
|---|---|---|---|
| Email собирается до готовности Privacy-страницы под новый data flow | Current State §9: `/privacy`, `/en/privacy`, `/en/terms`, `/terms` уже помечены как draft; D-001/D-002 = `NEEDS_OWNER` | PR-06 | Stop condition SSOT §27.9: "неизвестен legal entity" блокирует зависимую реализацию. |
| Marketing consent включается автоматически вместе с transactional delivery consent | SSOT §5.3 — явный запрет | PR-06 | Два раздельных consent state с версионированием (`consent_class`, `marketing_consent_version`). |
| Raw provider answer (полный текст AI-ответа) публикуется без проверки provider terms | SSOT §9.2, §15.3 | PR-05 | Public report использует только normalized evidence + короткие excerpt; raw payload — server-only, `raw_private_ref`. |
| Персональные данные пользователя (email) утекают в публичный report token/URL | SSOT §14.5, §12.1 (`reports` table не содержит email) | PR-03/PR-06 | Cryptographic random token, hash хранится вместо email в связке; PDF export не может раскрывать private provider payload или email (SSOT §7.6). |
| Данные из чужого сайта (private dashboards, cookies, formы target-сайта) случайно собираются краулером | SSOT §15.1 | PR-04 | Explicit "do not collect" список; crawler ограничен публичными GET-страницами без form submit/auth. |

## 3. Security / SSRF

| Риск | Evidence | Фаза | Mitigation |
|---|---|---|---|
| Пользователь отправляет private/loopback/link-local/metadata-host URL, сервер делает внутренний запрос | SSOT §14.1 — детальный required-list | **PR-04 — реализовано и протестировано** | `lib/visibility/security/ipClassification.ts` блокирует все private/loopback/link-local/multicast/reserved IPv4 и IPv6 диапазоны плюс известные metadata-хосты; 24 unit-теста (`ipClassification.test.ts`) покрывают это исчерпывающе. Движок не подключён к live pipeline (см. Decision Log DOC-011) — риск закрыт на уровне библиотеки, не на уровне production request path. |
| DNS rebinding между валидацией и фактическим fetch | SSOT §14.1, §27.9 | **PR-04 — реализовано и протестировано** | `lib/visibility/security/url-safety.ts` резолвит хост один раз и коннектится на резолвленный IP напрямую (`host: pinnedAddress`), а не переrезолвливает при открытии сокета — второй DNS-ответ физически не может подменить адрес. Stop condition SSOT §27.9 для самого движка закрыт (Decision Log DOC-013); включение `VISIBILITY_LIVE_CRAWLER_ENABLED` в реальном pipeline остаётся отдельным шагом (DOC-011). |
| Redirect chain уводит на internal host после начальной валидации внешнего URL | SSOT §14.1 | **PR-04 — реализовано и протестировано** | Каждый redirect hop заново парсится, резолвится и пиннится с нуля (`safeFetch` цикл по `maxRedirects`); протестировано `urlSafety.test.ts` (redirect-following, redirect-limit enforcement). |
| Webhook endpoint (`/api/webhooks/n8n`) принимает неподписанные или replay-запросы | SSOT §13.5 | PR-03 (когда появляется webhook receiver) | HMAC-SHA256 подпись с timestamp, отклонение stale timestamp/replay/oversized payload. Пока не реализовано — webhook receiver ещё не создан (нет n8n endpoint, D-006 `NEEDS_OWNER`). |
| `/api/checks` не имеет per-IP/per-domain rate limiting; `Idempotency-Key` валидируется, если передан, но не обязателен | Current State §4 предупреждал об этом риске заранее; реализация PR-03 (`app/api/checks/route.ts`) подтверждает: rate-limiting не реализован | PR-02/PR-03 — **частично не закрыто** | Полноценный per-IP/per-domain rate limit требует персистентного состояния (счётчики между запросами) — без Supabase (D-005) это либо no-op, либо ненадёжный in-memory счётчик, который не переживёт serverless cold start/множественные инстансы. Сейчас mitigating factor: `/api/checks` в mocked-фазе не выполняет никакой дорогой работы (нет реального crawl/AI call), поэтому abuse cost минимален. Настоящий rate-limit — обязательный gate перед включением `VISIBILITY_LIVE_CRAWLER_ENABLED`/`VISIBILITY_AI_SAMPLE_ENABLED` в PR-04+/PR-05, не раньше. |

## 4. Provider mismatch

| Риск | Evidence | Фаза | Mitigation |
|---|---|---|---|
| Generic LLM API-ответ маркируется как "результат ChatGPT Search" | SSOT §8.7, §0.1 — явный запрет | PR-05 | Provider naming honesty: "ChatGPT tracked environment via SE Ranking" вместо "ChatGPT result". |
| Региональный provider (Яндекс/Topvisor/Alice AI) добавляется "на всякий случай" без платящего рынка, проверенной capability и owner approval | SSOT V1.1 §9.3, §32.2 — явное [РЕШЕНИЕ ВЛАДЕЛЬЦА]: региональные providers вне обязательного ядра и roadmap V1.1 (снято относительно V1.0, где Topvisor был supplemental-провайдером; см. Decision Log D-008 (v1.1), SUPERSEDED) | Все фазы | Общий provider adapter сохраняется архитектурно, но новый regional connector требует: конкретный платящий рынок/клиент, подтверждённую official API capability, измеренную стоимость, отдельное owner approval scope/public claim (SSOT §9.3, п.1-4). Русскоязычный UI ≠ обещание Яндекса. |
| Официальная документация провайдера устарела к моменту рантайм-интеграции | SSOT §32 — все провайдерские факты помечены [ИЗВЛЕЧЕНО] на дату 30 июля 2026 с явным требованием "Codex должен перепроверять" | PR-05 | Обязательная runtime-проверка (`verified_at` поле в Provider Capability Matrix) перед включением live flag. |
| Region/language semantics провайдера не совпадают с заявленным market/language пользователя | SSOT §8.5 | PR-05 | Market и language фиксируются в prompt run record; несоответствие помечается как `needs_verification` в конкретном run, а не игнорируется. |

## 5. Cost / abuse

| Риск | Evidence | Фаза | Mitigation |
|---|---|---|---|
| Анонимный Free Check используется для bulk/automated сканирования чужих доменов | SSOT §14.4 | PR-02/PR-04 | IP hash с rotating salt, per-IP/per-domain caps, CAPTCHA только при превышении abuse threshold. |
| Live AI-provider budget превышается без circuit breaker | SSOT §11.2, §14.4, §24.2 | PR-05 | Provider budget cap + cost circuit breaker alert; job останавливается, report помечается partial. |
| Повторные сканы одного домена без cooling period увеличивают provider cost без пропорциональной ценности | SSOT §4.1 (`один leadId и upsert`), D-015 (`NEEDS_OWNER`) | PR-06 | Enforced cooling period перед rerun; решение о длительности блокирует PR-06. |
| PageSpeed / Apify вызываются синхронно в user-facing request и создают cost-неопределённость при таймауте/ретраях | SSOT §9.9 ("не помещать весь crawl + PageSpeed + 6 AI calls... в один synchronous request") | PR-03/PR-04 | Асинхронная job model (SSOT §11.1) с bounded retry policy. |
| Реальный COGS на активный платный Monitor-проект превышает цену $9/мес и делает тариф убыточным | SSOT V1.1 §4.4 (economics guardrail: target ≤$3.50, hard stop >$5.00 / project / month) — новое в V1.1 относительно $149-гипотезы V1.0 | PR-05/PR-08 | Минимум 50 pilot runs до public checkout; при hard stop — не поднимать цену, а сначала урезать prompt/engine entitlement, применить batching/cache, пересмотреть provider contract; при невозможности экономики — не открывать paid Monitor вовсе (SSOT V1.1 §4.4, п.1-5). Зафиксировано как Decision Log D-021. |

## 6. Reliability

| Риск | Evidence | Фаза | Mitigation |
|---|---|---|---|
| Provider timeout приводит к полному провалу отчёта вместо partial | SSOT §11.2, §22.4 | PR-03+ | `partial` — валидное terminal/partial state; missing section = `not measured`, не failure всего run. |
| Duplicate submit создаёт дублирующиеся leads/runs | SSOT §11.2, §13.1 | PR-02/PR-03 | `Idempotency-Key` обязателен на `POST /api/checks`. |
| UI показывает выдуманный процент прогресса ("87%") вместо реальных стадий | SSOT §13.2, §17.2 | PR-01 (уже применимо к mock-preview) | Реальные stage names (`Website discovered`, ...), никогда fake percent. |
| Изменение scoring config пересчитывает исторические отчёты молча | SSOT §8.3, §27.6 | PR-04 | `scoring_version` версионируется; исторический report не пересчитывается без явного re-evaluation job. |

## 7. Data retention

| Риск | Evidence | Фаза | Mitigation |
|---|---|---|---|
| Raw HTML/evidence хранится бессрочно без задокументированной политики | SSOT §12.3 ("raw HTML retention configurable"), D-011 (`NEEDS_OWNER`) | PR-02/PR-06 | Retention период — owner decision до публичного запуска; до тех пор — консервативный короткий default. |
| Удаление lead ломает агрегированную продуктовую аналитику | SSOT §12.3 | PR-02 | "Deletion can remove lead identity without corrupting aggregate product analytics" — требование к схеме с первого PR с БД. |
| Public report token не имеет expiration/revocation | SSOT §14.5, D-012 (`NEEDS_OWNER`) | PR-03/PR-06 | Токен поддерживает optional expiration и revoke capability с первой реализации, даже если политика ещё не выбрана. |

## 8. SEO / canonical

| Риск | Evidence | Фаза | Mitigation |
|---|---|---|---|
| `app/en/page.tsx` продолжает собираться как статическая страница, хотя `next.config.ts` перекрывает её permanent redirect на `/` | **Найдено в этом проходе** — Current State Reconciliation §6.1 | Pre-existing, не создано этим документом | File-specific cleanup candidate (архивировать страницу или снять redirect) — вне scope Visibility PR-01, требует отдельного small PR с owner review. |
| `/report/[token]` индексируется поисковиками | SSOT §14.5, §22.6 | PR-03 | `noindex, nofollow` + исключение из sitemap с первой реализации route. |
| Старый `/ru/ai-map` редиректится на `/ru/process-check` раньше functional parity | SSOT §6.3, §19.1, D-016 (`NEEDS_OWNER`) | Phase 2 | "До parity — старый маршрут остаётся live, никаких ранних 301 на пустую страницу." |
| Дублирующиеся Visibility-страницы создают conflicting canonical | SSOT §22.6 | PR-01+ | Один canonical per intent, hreflang pairs проверяются тестами PR-01 (SSOT §29.7). |

## 9. Migration

| Риск | Evidence | Фаза | Mitigation |
|---|---|---|---|
| AI Map (`/ru/ai-map`) удаляется до того, как Process Check достиг feature parity | SSOT §19.1, §27.4 (запрет "удалять старый AI Map до parity и redirect gate") | Phase 2 | Явный migration map: section → keep/rewrite/remove → новый Process Check компонент, создаётся перед любым удалением. |
| Villa production host меняется без отдельного owner gate | SSOT §4.3, §27.4 | Phase 2+ (Villa vertical) | "Не трогать Villa production host" — жёсткое правило до отдельного functional+SEO parity gate. |
| Второй публичный бренд/домен возникает случайно при построении Visibility | SSOT §1.1, §27.4 — явный запрет | Все фазы | Visibility остаётся продуктовой линией внутри Selena Systems, не отдельным брендом; проверяется на каждом PR review. |

## 10. Billing

| Риск | Evidence | Фаза | Mitigation |
|---|---|---|---|
| Billing включается до выбора payment provider и до owner approval | SSOT §27.4 (запрет "включать billing"), D-014 (`NEEDS_OWNER`) | PR-08 | Явный stop condition; PR-08 не начинается раньше Phase 4 gate. |
| Monitor at $9/мес заявлен как финальный, необратимый прайс без пометки founding/economics-gate | SSOT V1.1 §4.4 (цена помечена "[РЕШЕНИЕ ВЛАДЕЛЬЦА / FOUNDING PRICE]" и явно обусловлена COGS guardrail: "entitlements may shrink if COGS fails") | PR-01 (уже реализовано на pricing page), PR-08 | Pricing copy уже показывает Monitor как "checkout not yet open" (SSOT §29.4), не как открытый прайс; entitlements (5 prompts/2 environments/1 competitor/1 run) должны быть server-enforced до открытия checkout, не только заявлены в copy. |
| Failed payment behavior не определён до включения подписок | SSOT §22.4, §25 | PR-08 | Часть Phase 4 gate checklist. |

## 11. Support burden

| Риск | Evidence | Фаза | Mitigation |
|---|---|---|---|
| Тариф $9/мес привлекает объём support-запросов, непропорциональный revenue на пользователя | SSOT V1.1 §4.4 ("Почему цена $9": low-friction продолжение бесплатного отчёта, маржа строится на Audit/Sprint/Business OS, а не на Monitor) | Все фазы, обостряется в Phase 4 | В тарифе $9 явно нет: human-reviewed memo, ручного исследования конкурентов, onboarding call, priority support (SSOT §4.4, "Monitor — это не услуга человека"); support-модель должна закладывать self-serve/FAQ-first подход, а не человеческую поддержку на $9 ARPU. |
| Пользователи ожидают daily monitoring, получают monthly и создают эскалации | SSOT V1.1 §4.4 ("Частота": Free Check one-off, Monitor — один scheduled run в месяц; weekly/daily explicitly вне MVP) | Phase 4 | Частота явно указана в pricing copy per plan ("1 scheduled run/month"); daily/weekly — только отдельный будущий продукт после подтверждения спроса и экономики, не default. |
| Human review queue для paid Audit не имеет определённого SLA | SSOT V1.1 §26 (D-019, `NEEDS_OWNER`) | PR-06+ (Paid Audit routing) | Blocker до масштабирования Audit-очереди; Growth/Managed как отдельная human-review подписка **не существует** в V1.1 MVP (SSOT §4.4 "Чего нет в публичном MVP", §20 Phase 5 "no public Growth or Managed plan"), поэтому этот риск относится только к $500 Audit, не к несуществующему подписочному human-review tier. |

---

## Итог

Ни один из рисков выше не требует немедленного действия в рамках discovery-прохода: они предназначены как чеклист, который каждый последующий PR обязан явно закрыть (или сознательно принять и задокументировать) перед тем, как пересечь свой GO/STOP gate из `SELENA_VISIBILITY_IMPLEMENTATION_PLAN_V1.md`.
