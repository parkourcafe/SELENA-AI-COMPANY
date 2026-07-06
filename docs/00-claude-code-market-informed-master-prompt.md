# Claude Code master prompt: KORA AI market-informed conversion site v3

Ты работаешь как senior product strategist, UX architect, conversion copywriter, visual systems designer и frontend implementation agent.

Нужно построить премиальный русскоязычный сайт KORA AI как экспертно-сервисный сайт с диагностической воронкой и рыночной логикой, вдохновлённой конкурентным анализом, но без копирования чужого дизайна, чужих claims и чужих цифр.

KORA — AI-внедрение, no-code автоматизация и AI-обучение для предпринимателей, экспертов, сервисных бизнесов и небольших команд.

Главная бизнес-задача сайта:

```text
Перевести посетителя из “у нас AI-хаос и рутина” в “я хочу получить AI-карту возможностей / пройти аудит / внедрить первый процесс”.
```

## 1. Read first

Перед сборкой прочитай в порядке приоритета:

1. `CLAUDE.md`
2. `AGENTS.md`
3. this file
4. `docs/19-developer-addendum-market-informed-v3.md`
5. `docs/17-kora-market-informed-strategy.md`
6. `docs/16-global-ai-competitor-benchmark.md`
7. `docs/18-kora-content-engine-and-lead-magnets.md`
8. `docs/15-developer-tz-conversion-v2.md`
9. `docs/14-calculator-and-lead-magnet-spec.md`
10. `docs/13-homepage-conversion-wireframe-v2.md`
11. `docs/12-productcamps-funnel-adaptation.md`
12. `docs/10-premium-cinematic-brief.md`
13. `docs/11-developer-tz-premium.md`
14. older docs and data files
15. all files in `data/`

If docs conflict, newer market-informed docs win unless they violate content integrity.

## 2. Positioning

Use this positioning:

```text
KORA помогает русскоязычным предпринимателям, экспертам и небольшим командам превратить ручную рутину, хаотичный AI и разбросанные инструменты в понятные AI-сценарии через диагностику, обучение, автоматизацию и внедрение.
```

Hero H1:

```text
Сколько часов в неделю ваш бизнес теряет на заявки, ответы, контент и ручную рутину?
```

Primary CTA:

```text
Получить AI-карту возможностей
```

Trust line:

```text
Сначала разбираем процесс. Потом решаем, где нужен AI, автоматизация или человек.
```

## 3. Required routes

Create:

```text
/
/services
/ai-training
/ai-automation
/ai-content
/about
/contact
/free-ai-map
```

Recommended if easy and honest:

```text
/privacy
/terms
```

Do not create fake `/pricing`, `/demo`, `/customers`, `/security`, `/certification`, `/community` or `/library` pages unless they are honest and supported.

## 4. Homepage order

Build homepage in this order:

1. Header
2. CinematicHero with time-loss question
3. TimeLossCalculator
4. BusinessGoalPaths / GoalSelectorSection
5. AIMapCTASection or embedded AI-map lead magnet
6. CoreLoopSection
7. ProductLadderSection
8. ServiceModuleGrid
9. ImplementationExamples
10. FounderStorySection
11. TrustBoundarySection
12. NewsletterCTASection: “AI без хаоса”
13. FAQSection
14. FinalCTASection
15. Footer

Every major section must move toward `/free-ai-map`, `/contact` or a relevant service page.

## 5. Competitive inspiration rules

Use competitor analysis only as strategy inspiration:

- The AI Exchange -> AI operations/playbooks language.
- Skill Leap -> free starter + future library logic.
- Morningside AI -> identify/build/deploy/train sequence.
- Allie K. Miller -> founder-led trust + free email course.
- Everyday AI -> tracks by business task.
- ProductCamps -> time-saving calculator and free first step.
- No Code MBA -> project-based learning.
- Jeff Su -> templates/workflows.
- Future Tools -> tool map by task, not huge catalog.
- Ben’s Bites / The Rundown -> content engine and newsletter, not mass media copying.

Never copy:

- competitor wording;
- competitor claims;
- competitor numbers;
- competitor testimonials;
- competitor visual identity;
- fake prices;
- fake certification language.

## 6. Required components

Create or adapt:

```text
components/sections/CinematicHero.tsx
components/sections/TimeLossCalculator.tsx
components/sections/GoalSelectorSection.tsx
components/sections/BusinessGoalPaths.tsx
components/sections/AIMapCTASection.tsx
components/sections/CoreLoopSection.tsx
components/sections/ProductLadderSection.tsx
components/sections/ServiceModuleGrid.tsx
components/sections/ImplementationExamples.tsx
components/sections/FounderStorySection.tsx
components/sections/TrustBoundarySection.tsx
components/sections/NewsletterCTASection.tsx
components/sections/LeadMagnetTiles.tsx
components/sections/FAQSection.tsx
components/forms/AIMapBriefForm.tsx
components/forms/NewsletterSignupForm.tsx
```

Use data files where useful:

```text
data/competitors.json
data/offer-ladder-v3.json
data/content-engine.json
data/calculator.json
data/goal-selector.json
data/free-ai-map.json
```

## 7. Calculator rules

The calculator must be conservative.

Use:

```text
предварительная оценка
кандидаты на AI-сценарии
стоит проверить
```

Do not use:

```text
гарантированно сэкономим
вернём ровно X часов
AI заменит сотрудника
```

Formula:

```ts
const totalHours = leadsMessagesHours + repetitiveAnswersHours + contentHours + crmDocsHours + teamTasksHours;
const candidateLow = Math.round(totalHours * 0.25);
const candidateHigh = Math.round(totalHours * 0.45);
```

Disclaimer:

```text
Это предварительная оценка, не обещание экономии. Реальные возможности зависят от процесса, данных, инструментов и роли человека.
```

## 8. Forms

Create a real MVP form experience with labels, validation, success state and TODO for backend integration.

Do not submit data to random endpoints.

AI-map form fields:

- Имя
- Контакт: Telegram / WhatsApp / email
- Чем занимаетесь?
- Где сейчас уходит больше всего времени?
- Какие инструменты уже используете?
- Есть ли команда?
- Что хотите улучшить первым?
- Комментарий
- Consent checkbox

Newsletter form:

- email or Telegram
- consent checkbox
- success state
- TODO backend integration

## 9. Visual direction

Use premium editorial + calm AI operations studio:

- warm neutral background;
- strong editorial typography;
- clear cards;
- workflow lines;
- subtle motion;
- no neon brains;
- no robots;
- no random blobs;
- no fake SaaS dashboard;
- no heavy video dependency.

## 10. Content integrity

Never invent:

- cases;
- client logos;
- testimonials;
- precise ROI;
- revenue metrics;
- pricing;
- certifications;
- security/legal claims;
- “trusted by” logos.

Use honest labels:

```text
Примеры возможных решений
Предварительная оценка
Формат оценивается после брифа
Кандидаты на AI-сценарии
```

## 11. QA

Before final response:

- run build/lint/typecheck if available;
- verify all routes;
- check hero CTA points to `/free-ai-map`;
- test calculator with 0 and high values;
- check mobile calculator/form usability;
- ensure no unsupported claims;
- ensure newsletter form has safe placeholder/TODO;
- document assumptions and blockers.

Do not stop after planning. Build the website. A plan without implementation is just a decorative napkin with ambition.
