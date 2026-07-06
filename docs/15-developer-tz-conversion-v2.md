# Developer TZ v2: conversion funnel upgrade for KORA

This document updates `docs/11-developer-tz-premium.md`. Use it as the highest-priority development brief after `CLAUDE.md` and the active master prompt.

## 1. Goal

Build a premium, cinematic, conversion-focused MVP website for KORA with a diagnostic funnel.

The site must not only explain services. It must help the visitor:

1. recognize lost time;
2. estimate routine with a calculator;
3. choose their goal;
4. request a free AI-map or submit a qualified brief.

Primary CTA changes from:

`Разобрать мою задачу`

To:

`Получить AI-карту возможностей`

Secondary CTA remains:

`Посмотреть услуги` / `Посчитать рутину` / `Заполнить бриф`.

## 2. Routes

Required MVP routes:

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

Recommended legal routes:

```text
/privacy
/terms
```

Do not create fake `/demo`, `/customers`, `/security`, or pricing routes unless real content exists.

## 3. Navigation

Desktop:

- Услуги
- Обучение
- Автоматизация
- Контент
- Обо мне
- Связаться
- CTA: `Получить AI-карту`

Mobile:

- accessible menu;
- visible CTA inside menu;
- no layout break;
- no intrusive popups.

## 4. Homepage sections v2

Build homepage in this order:

1. Header
2. Hero with time-loss question
3. Time-loss calculator
4. Goal selector
5. KORA core loop
6. Product ladder
7. Service modules
8. Implementation examples
9. Founder story
10. Trust / scope control
11. FAQ
12. Final AI-map CTA
13. Footer

## 5. Hero copy

Eyebrow:

`AI-внедрение и обучение для бизнеса`

H1:

`Сколько часов в неделю ваш бизнес теряет на заявки, ответы, контент и ручную рутину?`

Subheadline:

`Помогаю русскоязычным предпринимателям, экспертам и небольшим командам находить повторяющиеся задачи, собирать AI-сценарии, обучать команду и внедрять автоматизации без сложного кода.`

Primary CTA:

`Получить AI-карту возможностей`

Secondary CTA:

`Посчитать рутину`

Trust line:

`Сначала разбираем процесс. Потом решаем, где нужен AI, автоматизация или человек.`

## 6. Required new components

Add these components:

```text
components/sections/TimeLossCalculator.tsx
components/sections/GoalSelectorSection.tsx
components/sections/ProductLadderSection.tsx
components/sections/FounderStorySection.tsx
components/sections/AIMapCTASection.tsx
components/forms/AIMapBriefForm.tsx
```

Existing premium components remain:

```text
components/sections/CinematicHero.tsx
components/sections/ChaosToSystemSection.tsx
components/sections/CoreLoopSection.tsx
components/sections/ServiceModuleGrid.tsx
components/sections/ImplementationExamples.tsx
components/sections/TrustBoundarySection.tsx
components/sections/FAQSection.tsx
```

## 7. Calculator implementation

Implement `TimeLossCalculator` as a client component.

Inputs:

- `leadsMessagesHours`
- `repetitiveAnswersHours`
- `contentHours`
- `crmDocsHours`
- `teamTasksHours`
- optional `hourValue`

Formula:

```ts
const totalHours = leadsMessagesHours + repetitiveAnswersHours + contentHours + crmDocsHours + teamTasksHours;
const candidateLow = Math.round(totalHours * 0.25);
const candidateHigh = Math.round(totalHours * 0.45);
```

Do not describe `candidateLow` / `candidateHigh` as guaranteed saved time.

Label:

`Стоит проверить на AI-сценарии`

Disclaimer:

`Это предварительная оценка, не обещание экономии. Реальные возможности зависят от процесса, данных, инструментов и роли человека.`

CTA:

`Получить AI-карту возможностей`

## 8. Goal selector implementation

Use six cards:

1. `Меньше отвечать на одни и те же вопросы` → AI-консьерж
2. `Регулярный контент без хаоса` → AI-контент-система
3. `Чтобы команда одинаково использовала AI` → AI-обучение
4. `Связать заявки, CRM и чаты` → AI-автоматизация
5. `Понять, с чего начать` → AI-аудит
6. `Собрать знания и инструкции` → AI-база знаний

Each card must contain:

- pain;
- recommended KORA service;
- outcome;
- CTA.

## 9. Product ladder implementation

Cards:

1. `Бесплатная AI-карта возможностей`
2. `AI-аудит`
3. `AI-обучение`
4. `AI-система под ключ`
5. `AI-сопровождение`

Do not invent prices.

If price display is required, use:

`Стоимость зависит от задачи и формата. Начните с брифа.`

## 10. `/free-ai-map` page

Purpose:

Capture qualified leads through a mini diagnostic.

Page structure:

1. Hero
2. What user gets
3. AIMapBriefForm
4. Trust/disclaimer
5. FAQ

H1:

`Получите AI-карту возможностей для вашего бизнеса`

Subheadline:

`Ответьте на несколько вопросов, и я покажу 3 задачи, с которых можно начать AI-внедрение: контент, заявки, клиентские ответы, CRM/Notion, команда или база знаний.`

CTA/Form title:

`Мини-бриф на AI-карту`

Form fields:

- Имя
- Контакт: Telegram / WhatsApp / email
- Чем занимаетесь?
- Где сейчас уходит больше всего времени?
- Какие инструменты уже используете?
- Есть ли команда?
- Что хотите улучшить первым?
- Комментарий
- Consent checkbox

Success state:

`Спасибо. Бриф отправлен. Следующий шаг — разобрать ответы и выбрать 3 задачи-кандидата для AI-внедрения.`

If backend is missing:

- do not fake submission;
- create TODO comment;
- show local success only if clearly marked in code as MVP placeholder.

## 11. Proof and examples

Until real proof exists:

Use:

- `Примеры возможных решений`;
- process diagrams;
- sample AI-map UI;
- sample content system;
- sample concierge flow.

Do not use:

- fake testimonials;
- fake client logos;
- fake results;
- fake “hours saved”;
- fake before/after screenshots with real-looking data.

## 12. Visual direction

Keep premium editorial + calm AI operations studio.

Add more commercial energy through:

- sharper hero question;
- calculator card;
- outcome-focused CTA buttons;
- goal selector cards;
- product ladder;
- founder story;
- mini-brief.

Do not make it look like a hype course funnel. The site should be premium and calm, not screaming “limited seats, wealth unlocked, neurons blessed”.

## 13. SEO updates

Recommended page metadata:

### Home

Title:

`KORA AI — AI-внедрение, автоматизация и обучение для бизнеса`

Description:

`Помогаю русскоязычным предпринимателям, экспертам и небольшим командам находить повторяющиеся задачи, внедрять AI-сценарии, автоматизации, AI-консьержей и контент-системы без сложного кода.`

### /free-ai-map

Title:

`Бесплатная AI-карта возможностей для бизнеса — KORA AI`

Description:

`Ответьте на мини-бриф и получите первичную AI-карту: 3 задачи, с которых можно начать внедрение AI в заявки, контент, клиентские ответы, CRM/Notion, команду или базу знаний.`

## 14. QA additions

In addition to `docs/08-content-qa-checklist.md`, verify:

- calculator works with 0 values;
- calculator works with high values;
- no output promises guaranteed savings;
- recommendation mapping is correct;
- `/free-ai-map` route works;
- all CTA buttons lead to either calculator, `/free-ai-map`, services, or contact;
- form has consent checkbox;
- form has accessible labels and validation;
- mobile calculator is usable;
- no sticky CTA covers form fields;
- no fake proof is introduced.

## 15. Definition of done v2

Done means:

- homepage has time-loss hook;
- calculator is implemented;
- goal selector is implemented;
- product ladder is implemented;
- `/free-ai-map` exists;
- AIMapBriefForm exists;
- CTAs consistently point to AI-map / brief;
- services remain clear;
- no unsupported claims;
- build/lint/typecheck pass or issues are documented;
- developer final summary includes changed files, commands, QA, assumptions, blockers.

