# SELENA VISIBILITY — CURRENT STATE RECONCILIATION
## Первый discovery-проход против SELENA_SYSTEMS_VISIBILITY_PLATFORM_ARCHITECTURE_AND_CODEX_TZ_V1_0

**Версия:** 1.0
**Дата прохода:** 30 июля 2026
**Тип прохода:** read-only discovery. Production feature code, public copy, routes, pricing, database, deployment и внешние интеграции не менялись.
**Канонический источник:** `docs/architecture/SELENA_SYSTEMS_VISIBILITY_PLATFORM_ARCHITECTURE_AND_CODEX_TZ_V1_0.md`

Статусы доказательности используются по правилам SSOT (`§0`): **[ИЗВЛЕЧЕНО]**, **[ИНТЕРПРЕТИРОВАНО]**, **[РЕШЕНИЕ ВЛАДЕЛЬЦА]**, `needs_verification`, **[НЕ ДЕЛАТЬ]**.

---

## 1. Baseline

**[ИЗВЛЕЧЕНО]**

```text
repository:      parkourcafe/SELENA-AI-COMPANY
remote:          origin (proxied)
branch:          claude/discovery-documentation-efk2bo
HEAD SHA:        26714935190b408034674334337bbb35cc1fe12c
dirty state:     clean (git status: "nothing to commit, working tree clean") at run start
node:            v22.22.2
npm:             10.9.7
package manager: npm (package-lock.json present; no yarn.lock / pnpm-lock.yaml)
```

Наблюдение: HEAD SHA прохода **совпадает** с SHA, зафиксированным как baseline в SSOT (`26714935190b408034674334337bbb35cc1fe12c`, документ §title). Это означает, что репозиторий не изменился с момента наблюдения SSOT — SSOT актуален на дату этого прохода. SSOT сам предупреждает не считать этот SHA автоматически актуальным (`§27.2.5`); в данном случае проверка подтвердила совпадение явно, а не по умолчанию.

## 2. Результаты baseline-команд

**[ИЗВЛЕЧЕНО]**

| Команда | Результат |
|---|---|
| `npm ci` | OK. 488 packages installed. `npm audit`: 5 high severity advisories (см. §7). |
| `npm run typecheck` (`tsc --noEmit`) | OK, без ошибок. |
| `npm run lint` (`next lint`) | OK, "No ESLint warnings or errors". Next.js предупреждает, что `next lint` deprecated в Next 16. |
| `npm run build` | OK. 23 маршрута сгенерированы (см. §3). |
| `npm test` | **Отсутствует.** В `package.json` нет скрипта `test`. Тестовых файлов/директорий (`tests/`, `*.test.*`, `*.spec.*`) в репозитории нет. |
| `npm run test:e2e` | Отсутствует по той же причине. |

`needs_verification`: приемлемо ли для Phase 0 отсутствие тестовой инфраструктуры, или Codex должен явно создать пустой `test`-скрипт с сообщением "no tests yet" вместо того, чтобы отчёт молчал об отсутствующей команде (SSOT §22.5 требует явного решения, а не придуманной прошедшей команды).

## 3. Текущая карта маршрутов

**[ИЗВЛЕЧЕНО]** (из `next build` output и файловой структуры `app/`)

| Route | Файл | Locale | Назначение |
|---|---|---|---|
| `/` | `app/page.tsx` | EN | Главная EN, `B2BHomeLanding` + `lib/data/homepage.ts` |
| `/ru` | `app/ru/page.tsx` | RU | Главная RU, `B2BHomeLanding` + `lib/data/homepage-ru.ts` |
| `/ru/ai-map` | `app/ru/ai-map/page.tsx` | RU | Диагностический landing `RussianHomeLanding` (cinematic hero, calculator, goal selector, product ladder и т.д.) |
| `/free-ai-map` | `app/free-ai-map/page.tsx` | RU | Лид-магнит форма `AIMapBriefForm` + `data/free-ai-map.json` |
| `/services` | `app/services/page.tsx` | RU | Каталог из 8 модулей, `PackageCards` |
| `/ai-training` | `app/ai-training/page.tsx` | RU | — |
| `/ai-automation` | `app/ai-automation/page.tsx` | RU | — |
| `/ai-content` | `app/ai-content/page.tsx` | RU | — |
| `/about` | `app/about/page.tsx` | RU | Founder positioning |
| `/contact` | `app/contact/page.tsx` | RU | `ContactForm` → `/api/leads` |
| `/en` | `app/en/page.tsx` | EN | **См. конфликт в §6.1** — статическая страница существует, но перекрыта permanent redirect на `/` |
| `/en/contact` | `app/en/contact/page.tsx` | EN | `EnglishContactForm` → `/api/leads` |
| `/en/privacy` | `app/en/privacy/page.tsx` | EN | Помечена как draft, требует legal review |
| `/en/terms` | `app/en/terms/page.tsx` | EN | Помечена как draft |
| `/privacy` | `app/privacy/page.tsx` | RU | Явный раздел "Статус документа": рабочая редакция для юридической проверки |
| `/terms` | `app/terms/page.tsx` | RU | Аналогично |
| `/api/leads` | `app/api/leads/route.ts` | — | Единственный существующий API route. POST-only, серверная валидация, доставка через Telegram Bot API и/или generic webhook |
| `/sitemap.xml` | `app/sitemap.ts` | — | Явный список 15 URL с alternates |
| `/robots.txt` | `app/robots.ts` | — | `allow: "/"` для всех user-agent, ссылка на sitemap |
| `/icon.svg` | `app/icon.svg` | — | Framework icon route |
| `public/google701d47690a232c57.html` | — | — | Google Search Console verification file (подтверждает начатую, но не завершённую GSC-интеграцию) |

Согласно SSOT (`§6.2`) целевые маршруты `/visibility`, `/check`, `/report/[token]`, `/process-check`, `/methodology`, `/pricing`, `/app` и соответствующие `/ru/*` **не существуют** — это ожидаемо, они относятся к Phase 1+.

## 4. Карта данных и компонентов

**[ИЗВЛЕЧЕНО]**

```text
lib/site.ts            — единый источник brand/nav/cta/contact channels (EN+RU)
lib/metadata.ts         — buildMetadata(): canonical/OG/Twitter contract
lib/structured-data.ts  — buildHomeStructuredData(): Organization/WebSite JSON-LD (@graph)
lib/leads.ts            — LeadType union (contact_brief | ai_map_brief | newsletter_signup), error taxonomy
components/seo/JsonLd.tsx — рендер JSON-LD <script>
components/forms/        — ContactForm, EnglishContactForm, AIMapBriefForm, NewsletterSignupForm
components/sections/     — 19 секций, включая TimeLossCalculator, GoalSelectorSection,
                            ProductLadderSection, FounderStorySection, TrustBoundarySection,
                            AIMapCTASection, NewsletterCTASection, CoreLoopSection,
                            ServiceModuleGrid, ImplementationExamples
lib/data/homepage.ts     — EN контент (стоимость пакетов, proof-проекты)
lib/data/homepage-ru.ts  — RU контент
lib/data/faq.ts          — общий FAQ (без гарантий, без выдуманных метрик)
data/*.json              — 15 JSON-файлов: seo-control, competitors, ai-playbooks,
                            product-ladder-v3, newsletter-ai-without-chaos,
                            offer-ladder-v3, lead-magnets-v3, content-engine,
                            calculator, goal-selector, navigation-v2,
                            conversion-funnel, homepage-v3, free-ai-map,
                            competitor-patterns
```

Ни одна из существующих зависимостей не включает Supabase, n8n-клиент, Apify SDK, SE Ranking/Topvisor SDK или PageSpeed-клиент. Единственные упоминания этих имён в репозитории — строки внутри `data/competitors.json` (описание конкурентов/рынка) и `package-lock.json` (случайные транзитивные совпадения имени пакета, не относящиеся к провайдерам). Это подтверждает раздел SSOT §9.1/§32: greenfield-интеграция, ничего готового переиспоставлять на backend-уровне.

## 5. CTA и pricing на текущем сайте

**[ИЗВЛЕЧЕНО]** (`lib/site.ts`, `lib/data/homepage.ts`)

```text
RU primary CTA:    "Получить AI-карту возможностей" → /free-ai-map
RU secondary CTA:  "Посмотреть услуги" → /services
EN primary CTA:    "Book AI Audit" → /en/contact  (см. app/page.tsx: cta.label = "Book AI Audit")
EN home nav CTA:   homepage.cta = { label: "Book AI Audit", href: "/en/contact" }
RU home nav CTA:   ruHomepage.cta = { label: "Записаться на AI-аудит", href: "/contact" }
```

Три публичных пакета (`lib/data/homepage.ts:138-152`):

```text
AI Audit          — $500
AI Sprint         — $4,000
AI Business OS    — from $10,000
```

Пять proof-проектов (`lib/data/homepage.ts:164-189`): KORA Food Hall, PetID.care, Doki.help, remhaos.com, otherbali.com. Все значения совпадают с SSOT §2.1 дословно.

## 6. Confirmed conflicts / duplicate register

### 6.1. `/en` — статическая страница, перекрытая redirect'ом

**[ИЗВЛЕЧЕНО]**

`next.config.ts` содержит:

```ts
async redirects() {
  return [{ source: "/en", destination: "/", permanent: true }];
}
```

При этом `app/en/page.tsx` существует, полностью реализован (собственный hero, EnglishContactForm, metadata) и попадает в build output как самостоятельная статическая страница (`○ /en  189 B  116 kB`). В Next.js App Router `redirects()` из `next.config.ts` разрешаются на уровне routing до рендера filesystem-маршрута, поэтому при точном совпадении `source: "/en"` эта страница фактически недостижима через обычную навигацию в production, хотя продолжает собираться и индексироваться в build. `sitemap.ts` корректно **не включает** голый `/en` (только `/en/contact`, `/en/privacy`, `/en/terms`), то есть sitemap уже соответствует намерению redirect'а — конфликт локализован в наличии самого файла `app/en/page.tsx`, а не в SEO-слое.

Это не блокер для Visibility discovery, но file-specific candidate для отдельной cleanup-задачи (архивировать или удалить `app/en/page.tsx`, либо снять redirect, если страница нужна) — решение вне scope этого прохода, `needs_verification` от владельца.

### 6.2. CLAUDE.md / AGENTS.md описывают бренд «KORA», репозиторий уже полностью «Selena Systems»

**[ИЗВЛЕЧЕНО]**

Корневые `CLAUDE.md` и `AGENTS.md` (project overview) описывают русскоязычный сайт бренда **KORA** с MVP site map `/`, `/services`, `/ai-training`, `/ai-automation`, `/ai-content`, `/about`, `/contact` и ссылаются на несуществующие `docs/01…09-*.md`. Фактический production-код полностью переименован в **Selena Systems**:

```text
package.json:        "name": "selena-systems-website"
lib/site.ts:          site.name = "Selena Systems"
lib/site.ts comment:  "Public-facing tagline (Russian only, per CLAUDE.md)"
metadata/JSON-LD:      Organization name = Selena Systems везде
proof-проекты:         "KORA Food Hall" упоминается только как один из 5 портфолио-проектов,
                       не как имя всего сайта
```

MVP site map из `CLAUDE.md`/`AGENTS.md` реализован (все 7 маршрутов существуют), но title/description/OG везде — Selena Systems, а не KORA. Более поздние слои (`## Conversion funnel execution layer v2`, `## Competitive research execution layer v3`, `## Market-informed conversion layer v3` в том же `CLAUDE.md`) фактически уже реализованы: `/free-ai-map` существует, `TimeLossCalculator`/`GoalSelectorSection`/`ProductLadderSection`/`FounderStorySection`/`AIMapCTASection`/`AIMapBriefForm` существуют, `data/ai-playbooks.json`, `data/product-ladder-v3.json`, `data/newsletter-ai-without-chaos.json`, `data/competitors.json` существуют. Единственное несоответствие — верхняя секция `CLAUDE.md` "Project overview" / "canonical brand" не была обновлена при ребрендинге на Selena Systems.

`needs_verification` / **[РЕШЕНИЕ ВЛАДЕЛЬЦА]**: обновить ли `CLAUDE.md`/`AGENTS.md` "Project overview" на Selena Systems явно, чтобы будущие агенты не начинали с устаревшей бренд-модели. Это не входит в разрешённый scope текущего discovery-прохода (документ требует не трогать production copy/branding без explicit PR), поэтому изменение не внесено — только зафиксировано.

### 6.3. Отсутствующие `docs/01`–`docs/09`

**[ИЗВЛЕЧЕНО]** `AGENTS.md` ссылается на `docs/01-site-architecture.md` … `docs/09-implementation-tasks.md`. Ни один из этих файлов не существует; нумерация `docs/` начинается с `00-*` и `10-*`…`21-*`. Не блокер для Visibility, но существующий pre-existing док-долг — упомянут для полноты `current-to-target` картины.

### 6.4. `npm audit`: 5 high severity транзитивных advisories

**[ИЗВЛЕЧЕНО]**

```text
next@15.5.20     — DoS/SSRF/cache-confusion advisories в Server Actions/Image Optimization
postcss (<=8.5.17, via next) — path traversal в sourceMappingURL
sharp (<0.35.0, via @remotion/cli) — libvips CVEs
```

`sharp`/`postcss` тянутся транзитивно через `next` и `@remotion/cli` (используется только для `remotion:still:*` dev-скриптов генерации превью-картинок, не участвует в production request path). `needs_verification`: обновление `next` до патченной минорной версии — отдельная, не-visibility задача; не выполнялось в этом read-only проходе, чтобы не менять production-код.

## 7. AI Map inventory (`/ru/ai-map`)

**[ИЗВЛЕЧЕНО]**

`RussianHomeLanding` (`components/landing/RussianHomeLanding.tsx`) рендерит последовательность:

```text
CinematicHero
TimeLossCalculator
GoalSelectorSection
AIMapCTASection
CoreLoopSection
ProductLadderSection
ServiceModuleGrid
ImplementationExamples
FounderStorySection
TrustBoundarySection
NewsletterCTASection
FAQSection
FinalCTA
```

Соответствует SSOT §2.2 дословно. Согласно SSOT §19.1, при построении Process Check нужно **сохранить**: time-loss thinking, вопросы о ручных процессах, goal selector, human-control boundaries, founder context, service ladder; и **убрать/переписать**: противоречивый прайсинг, отдельную product identity, дублирование homepage, newsletter как обязательный gate. Конкретное сопоставление "секция → keep/rewrite/remove → новый Process Check компонент" — задача PR-01+ (Phase 2), не этого прохода; в этом документе зафиксирован только инвентарь.

## 8. Villa Response Readiness Funnel (`parkourcafe/Bali-OS-VILLA-2026`)

`needs_verification` — **не проинспектировано в этом проходе.**

SSOT (`§27.2.1`, `§30` шаг 5) требует read-only инспекцию `parkourcafe/Bali-OS-VILLA-2026` для составления reuse/extract плана. Этот репозиторий не входит в текущий GitHub scope сессии (`parkourcafe/selena-ai-company` only), а инструмент подключения дополнительного репозитория (`add_repo`, MCP `Claude_Code_Remote`) был недоступен на момент выполнения этого прохода (MCP-сервер был отключён/переподключался во время сессии). Это не изменяет вывод SSOT §2.3–2.5 (тезисно повторены как cited facts из документа-источника, не как заново проверенные в этом проходе), но означает: пункты SSOT §19.2 ("что портировать", "что не переносить без изменений" из Villa-чекера) остаются `needs_verification` до отдельного прохода с доступом к этому репозиторию.

Рекомендация: следующий discovery-подпроход должен явно запросить `add_repo(owner="parkourcafe", repo="Bali-OS-VILLA-2026", access="read")` до начала PR, который претендует на переиспользование Villa-логики (Phase 2/PR-04 и далее).

## 9. Legal / privacy gaps

**[ИЗВЛЕЧЕНО]**

- `/en/privacy`, `/en/terms`, `/privacy`, `/terms` — все четыре страницы явно называют себя рабочим/draft-документом и указывают на необходимость проверки юристом перед полным публичным запуском.
- `/privacy` (RU) уже содержит структурированные разделы (какие данные собираются, зачем, каналы обработки — Telegram/webhook, кому не передаются, хранение, как удалить, безопасность) — качественная база для расширения под Visibility, но:
  - не называет legal entity/юрисдикцию (SSOT D-001);
  - не называет privacy-контакт как отдельный email/канал (D-002);
  - не покрывает будущий email-unlock flow, publicly-shared report tokens, provider-provided AI-answer evidence или payment data — потому что этих потоков ещё не существует в коде.
- Нет отдельной cookie/analytics-политики — потому что аналитика (GA4/Yandex Metrica/любой tracking pixel) не найдена нигде в репозитории (`grep` по `gtag`, `GA_MEASUREMENT`, `analytics` — 0 совпадений в коде, только в документации-планах).
- `.env.example` содержит только: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_TELEGRAM`, `NEXT_PUBLIC_CONTACT_WHATSAPP`, `LEADS_TELEGRAM_BOT_TOKEN`, `LEADS_TELEGRAM_CHAT_ID`, `LEADS_WEBHOOK_URL`. Нет Supabase/n8n/provider ключей — ожидаемо для текущей фазы.

Согласно SSOT §15.2 и §26 (D-001, D-002), полноценная Privacy-страница под email unlock не может быть выпущена до решения владельца о legal entity и privacy-контакте.

## 10. Current-to-target file matrix (сокращённая, Phase 0/1 relevant)

**[ИНТЕРПРЕТИРОВАНО]** — вывод из фактов выше, сопоставленный с целевой структурой SSOT §10.4.

| Целевой путь (SSOT §10.4) | Текущее состояние | Действие |
|---|---|---|
| `lib/site.ts` | Существует, зрелый, EN+RU, contact channels | Переиспользовать как есть; не дублировать nav/cta логику в `lib/visibility/*` |
| `lib/metadata.ts` | Существует, `buildMetadata()` покрывает canonical/OG/Twitter | Переиспользовать для `/visibility`, `/check`, `/methodology`, `/pricing` |
| `lib/structured-data.ts` | Есть Organization/WebSite JSON-LD builder | Расширить, не пересоздавать, для Service-level structured data будущих Visibility-страниц |
| `components/sections/*` | 19 существующих секций, включая почти весь набор, нужный Process Check | Переиспользовать паттерны (`Reveal`, `Container`, `Button`) вместо новой визуальной системы |
| `components/visibility/*` | Не существует | Создать в PR-01, строго по component map SSOT §29.6 |
| `lib/visibility/*` | Не существует | Создать в PR-01 |
| `data/visibility/*` | Не существует | Создать начиная с Phase 1/2 (score/prompt configs) |
| `app/api/leads/route.ts` | Существует, POST-only, in-memory validation, Telegram+webhook delivery, без БД | Не путать с будущим `/api/checks`; это разные lead-типы (`contact_brief`, `ai_map_brief`, `newsletter_signup` vs будущий `visibility_check`) |
| `supabase/` | Не существует | Phase 4-relevant; не создавать раньше |
| `automation/n8n/` | Не существует | Phase 1+ по мере одобрения D-006 |
| `app/visibility`, `/check`, `/methodology`, `/pricing`, `/report/[token]` и RU-эквиваленты | Не существуют | PR-01 (route shells only, без live providers) |

## 11. Итоговый статус прохода

```text
STATUS: GO (для документационного пакета этого прохода)

- baseline воспроизведён и SHA совпадает с наблюдавшимся в SSOT;
- все текущие routes подтверждены и ни один не изменён;
- legal blockers задокументированы (D-001, D-002 остаются open);
- дублирующей продуктовой модели (второй Business Health Score, второй бренд) не найдено;
- build/typecheck/lint проходят зелёным; test/test:e2e отсутствуют как скрипты (задокументировано, не придумано);
- один file-specific конфликт найден (§6.1, /en) и один doc-brand конфликт (§6.2, CLAUDE.md/AGENTS.md) —
  оба являются кандидатами на отдельные small PR, не блокерами для Visibility PR-01.
```

Feature code не менялся. Все команды в этом документе воспроизводимы из корня репозитория на branch `claude/discovery-documentation-efk2bo`.
