# SELENA VISIBILITY — PR-01 RECONCILIATION V1.2

**Дата:** 30 июля 2026
**Против:** Codex Execution ТЗ V1.2 / PR-01
**Канонический документ:** `docs/architecture/SELENA_SYSTEMS_VISIBILITY_PLATFORM_ARCHITECTURE_AND_CODEX_TZ_V1_2.md`

Один документ вместо пяти, как требует ТЗ («one concise reconciliation document, not five duplicative reports»). Ранее созданные пять discovery-документов относятся к предыдущему циклу и остаются как история; актуальная сверка — здесь.

---

# 1. Baseline

```text
repository:      parkourcafe/SELENA-AI-COMPANY
branch:          claude/discovery-documentation-efk2bo
HEAD до работы:  51747719112ed366b5063b4d31dc44f251da3e60
dirty state:     clean
package manager: npm 10.9.7 (package-lock.json)
node:            v22.22.2
```

| Команда | Результат до работы | Результат после |
|---|---|---|
| `npm ci` | OK, 498 пакетов | — |
| `npm run typecheck` | OK | OK |
| `npm run lint` | OK, 0 warnings | OK, 0 warnings |
| `npm test` | 60/60 pass | 83/83 pass |
| `npm run build` | OK, 34 маршрута | OK, 34 маршрута |

Предсуществующих несвязанных падений не обнаружено. `npm audit` показывает 5 high advisories (`next`, транзитивные `postcss`/`sharp`) — они были до этой работы, не относятся к Visibility и не чинились здесь намеренно (ТЗ: «Do not silently repair unrelated product areas»).

---

# 2. Извлечённое текущее состояние

**[ИЗВЛЕЧЕНО]**

- Next.js 15.5.20, React 19.1, TypeScript 5.8, Tailwind 4.1, Vercel. Тестраннер — `node --test` + `tsx`.
- Локали: `/` и `/en/*` — английский; остальные bare-root маршруты (`/services`, `/about`, `/contact`, `/free-ai-map`) — **русские**. Новые английские Visibility-маршруты живут на bare root и распознаются явным списком в `lib/visibility/routes.ts` (`isBareEnglishVisibilityPath`).
- `/ru/ai-map` работает и не тронут.
- Дизайн-система: `Container`, `Card`, `Button`, `Reveal`, `SectionHeader`, `PageHero`; палитра charcoal/ivory/copper.
- Метаданные централизованы в `lib/metadata.ts` (`buildMetadata`), sitemap — явный список в `app/sitemap.ts`.
- Лиды: `app/api/leads/route.ts` → Telegram/webhook. Visibility этот путь не использует.
- Аналитика: не подключена (0 совпадений по `gtag`/`GA_MEASUREMENT`).
- Privacy/Terms: все четыре страницы помечены как черновики, требующие юридической проверки.

---

# 3. Конфликты с ТЗ V1.2

## 3.1. Ветка — РАЗРЕШЕНО

**ТЗ:** `Create and work only in: feat/selena-visibility-pr01-v1-2`.
**Было:** работа велась в `claude/discovery-documentation-efk2bo` — ветке, назначенной постоянной инструкцией сессии, которая запрещает пуш в другую ветку без явного разрешения.
**Разрешение:** владелец подтвердил переход. Ветка `feat/selena-visibility-pr01-v1-2` создана на коммите `de28b46` и запушена; PR открывается из неё.

Прежняя ветка оставлена на remote как история предыдущих циклов (PR-00…PR-04, V1.0 → V1.1). Удаление remote-ветки отдельно не запрашивалось и не выполнялось.

## 3.2. Раздел K «OUT OF SCOPE» против уже реализованного — РЕШЕНО (код остаётся)

**ТЗ K** запрещает в PR-01: живой краулер, URL fetch API, SSRF-слой, Supabase, n8n, сбор email, mocked end-to-end job.

**Факт:** SSRF-слой (`lib/visibility/security/`), схема Supabase-миграций (`supabase/migrations/`, нигде не применена), mocked end-to-end поток (`app/api/checks`, `app/api/reports`) и детерминированный скоринг (`lib/visibility/scoring/`) уже находятся в репозитории — они были реализованы в предыдущем цикле.

**Разрешение:** оставлено без удаления. Обоснование:

1. Это в точности scope, который сам ТЗ V1.2 называет следующим шагом: «NEXT SAFE PR: PR-02 — scanner contracts, evidence schema, secure URL-fetch design and mocked end-to-end job».
2. Ничего из этого не достижимо из публичного пути: всё закрыто `VISIBILITY_FREE_CHECK_ENABLED` / `VISIBILITY_LIVE_CRAWLER_ENABLED` со значением по умолчанию «выключено». Проверено вручную: при выключенных флагах `POST /api/checks` → 503, `/report/<token>` → 404.
3. Supabase-миграции — файлы, не применённые ни к какому проекту (D-005 не решён).
4. Удаление рабочего, покрытого 60 тестами кода ради формального соответствия порядку PR было бы разрушительным и не даёт владельцу никакой ценности.

**Статус:** владелец делегировал решение (30.07.2026). Зафиксировано: код остаётся. Подключение к публичному пути — отдельный осознанный шаг следующего PR, и до него обязательны rate limiting на `/api/checks` и асинхронная модель задач вместо синхронного краулинга в HTTP-запросе (V1.1 §9.9, V1.2 §11). Откат при желании остаётся тривиальным — `git revert` трёх коммитов.

## 3.3. «Do not collect email in this PR» — ОТМЕНЕНО ВЛАДЕЛЬЦЕМ

**ТЗ:** раздел D — `Do not collect email in this PR`; раздел K — `email collection` в out of scope.

**Решение владельца (30.07.2026):** сбор лидов восстановлен как продуктовое требование — в этом и смысл бесплатной версии. Подтверждается самой архитектурой: §4.1 и §5.2 описывают бесплатную диагностику именно как лид-механизм.

**Как реализовано:** форма `/check` собирает контакт (Telegram/WhatsApp/email) плюс бриф и отправляет через **уже существующий** канал `/api/leads` → Telegram/webhook — тот же, что обслуживает `/contact`, `/free-ai-map` и подписку. Новый тип лида `visibility_check`.

**Почему это не создаёт новой юридической экспозиции:** поток данных не новый. Действующая `/privacy` уже описывает сбор через формы и доставку в Telegram/CRM; страница дополнена явным упоминанием полей брифа видимости. Supabase, почтовый провайдер и биллинг не потребовались.

**Что сохранено из честных ограничений ТЗ:** нет анимации фейкового прогресса, нет утверждения о выполненной автоматической проверке; копия прямо говорит «автоматическое сканирование не запускается», а обещание — ручной разбор. Согласие обязательное и явное, отдельным чекбоксом со ссылкой на privacy; сервер отклоняет заявку без согласия (`CONSENT_REQUIRED`) и без обязательных полей (`MISSING_REQUIRED_FIELDS`) — проверено вживую.

**Открыто:** конкретный срок ручного разбора не зафиксирован — это D-019 (`Human review scope and SLA`, `NEEDS_OWNER`). Копия обещает работу, но не срок.

Динамический `/report/[token]` из PR-03 с его email-unlock остаётся за выключенным флагом и отдаёт 404; `/report/sample` email не собирает.

## 3.4. Villa Response Check

**V1.1 §4.3** описывал Villa как отдельный вертикальный вход. **ТЗ V1.2 решение 14** вводит Local Business Mode как профиль общего движка и решение 16 запрещает трогать Villa-репозиторий.

**Разрешение:** реализован Local Business Mode; Villa-репозиторий не открывался и не менялся. В V1.2 §9 это зафиксировано как отменённое.

---

# 4. Файлы

## 4.1. Созданы

```text
docs/architecture/SELENA_SYSTEMS_VISIBILITY_PLATFORM_ARCHITECTURE_AND_CODEX_TZ_V1_2.md
docs/visibility/SELENA_VISIBILITY_PR01_RECONCILIATION_V1_2.md
lib/visibility/measurement.ts
lib/visibility/sample-report-data.ts
components/visibility/MeasurementLayers.tsx
components/visibility/ActionReadinessCard.tsx
components/visibility/ActionPathTimeline.tsx
components/visibility/ActionReadinessSection.tsx
components/visibility/EvidenceList.tsx
components/visibility/SampleReport.tsx
tests/unit/visibilityContentV12.test.ts
```

## 4.2. Изменены

```text
docs/architecture/..._V1_1.md          — добавлен баннер superseded (содержимое не тронуто)
docs/visibility/SELENA_VISIBILITY_DECISION_LOG.md — записи DOC-014…DOC-017
lib/visibility/types.ts                 — новые поля формы, четыре слоя, Action Readiness, Local Business Mode
lib/visibility/content.en.ts            — вся новая копия V1.2
lib/visibility/content.ru.ts            — вся новая копия V1.2
components/visibility/VisibilityCheckForm.tsx — 2 новых поля, убран сетевой вызов
app/report/sample/page.tsx              — полный отчёт из 9 секций
app/ru/report/sample/page.tsx           — то же
app/visibility/page.tsx                 — обязательные секции V1.2
app/ru/visibility/page.tsx              — то же
app/methodology/page.tsx                — слои, Action Readiness, Local Business Mode, «не утверждаем»
app/ru/methodology/page.tsx             — то же
app/check/page.tsx                      — убран флаг mock-потока
app/ru/check/page.tsx                   — то же
```

## 4.3. Сохранены без изменений

`app/page.tsx`, `app/ru/page.tsx`, `app/ru/ai-map/page.tsx`, `app/free-ai-map/**`, `app/services/**`, `app/contact/**`, `app/en/**`, `app/privacy/**`, `app/terms/**`, `app/api/leads/route.ts`, `lib/site.ts`, `lib/metadata.ts`, `lib/structured-data.ts`, весь `components/sections/**` и `components/landing/**` кроме уже добавленного ранее teaser-модуля.

---

# 5. Блокеры и `needs_verification`

| Пункт | Статус | Нужно до |
|---|---|---|
| ~~Имя рабочей ветки~~ | **РЕШЕНО** — `feat/selena-visibility-pr01-v1-2` | — |
| ~~Откатывать ли PR-02/03/04 scope~~ | **РЕШЕНО** — код остаётся, выключен флагами | — |
| Legal entity, privacy-контакт | `NEEDS_OWNER` (D-001, D-002) | Любого реального сбора email |
| Провайдер транзакционной почты | `NEEDS_OWNER` (D-003) | Email unlock |
| Supabase project/region | `NEEDS_OWNER` (D-005) | Персистентности |
| SE Ranking доступ и бюджет | `NEEDS_OWNER` (D-007) | Живой AI-выборки |
| Платёжный провайдер | `NEEDS_OWNER` (D-014) | Открытия checkout |
| Фактический COGS на 50 pilot runs | `NEEDS_OWNER` (D-021) | Открытия платного Monitor |
| Privacy-копия под будущий сбор URL/email | Не менялась намеренно | PR-06 |

Privacy-страницы сознательно не редактировались: ТЗ J запрещает «pretend that data is collected when it is not», а сейчас Visibility не собирает ничего. Что потребуется дописать перед живым сбором — зафиксировано в V1.2 §8.

---

# 6. Rollback

Изменения PR-01 аддитивны и не меняют существующие маршруты.

**Полный откат:**

```bash
git revert --no-commit <PR-01-commit-sha>
git commit -m "Revert PR-01 V1.2 visibility slice"
```

**Частичный откат (спрятать Visibility, оставив код):** удалить пункты «Visibility» / «Видимость» из `nav`, `enNav`, `homepage.nav`, `ruHomepage.nav` в `lib/site.ts` / `lib/data/homepage*.ts` и убрать `<VisibilityEntryTeaser />` из `components/landing/B2BHomeLanding.tsx`. Маршруты останутся доступны по прямой ссылке, но исчезнут из навигации.

**Что откат не затрагивает:** `/ru/ai-map`, `/free-ai-map`, лид-форма и её доставка, Villa-репозиторий, любые внешние сервисы — ни один не был подключён.

---

# 7. Верификация

```text
npm run typecheck   OK
npm run lint        OK, 0 warnings
npm test            83/83 pass
npm run build       OK, 34 маршрута
```

Route QA (локальный production-сервер, порт 3930): все 17 проверенных маршрутов вернули 200, включая `/ru/ai-map` и `/free-ai-map`. `/report/sample` и `/ru/report/sample` отдают `noindex, nofollow`; в `sitemap.xml` нет ни одного вхождения `/report`. Canonical и hreflang на `/visibility` ↔ `/ru/visibility` взаимны и корректны. На главной подтверждены новые CTA (`Run Free Visibility Check` / `Проверить видимость бесплатно`) и обязательный блок про агента. На `/pricing` — `$9/month · $90/year` и `Checkout not open`; тарифа Growth нет.
