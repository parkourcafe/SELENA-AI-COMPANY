# Calculator and lead magnet specification

This document defines the KORA time-loss calculator and the free AI-map lead magnet.

## 1. Purpose

The calculator is not a toy widget. Shocking, but websites should occasionally do useful things.

Its purpose:

- make the visitor quantify routine;
- show which process may be worth reviewing first;
- move the visitor to the free AI-map brief;
- create a stronger lead than a generic contact form.

## 2. Component: TimeLossCalculator

### Location

Homepage, directly after hero.

Optional additional placement:

- `/free-ai-map`
- `/contact`

### Inputs

Use sliders or stepper inputs.

```ts
type CalculatorInput = {
  leadsMessagesHours: number;
  repetitiveAnswersHours: number;
  contentHours: number;
  crmDocsHours: number;
  teamTasksHours: number;
  hourValue?: number;
};
```

Labels:

- `Заявки и переписки`
- `Повторяющиеся ответы клиентам`
- `Контент`
- `CRM / таблицы / Notion`
- `Задачи команды`
- optional: `Сколько стоит час вашего времени?`

Ranges:

- hours: 0–20 per category;
- hour value: 0–500, optional.

Defaults:

- leads/messages: 3
- repetitive answers: 2
- content: 4
- CRM/docs: 2
- team tasks: 2
- hour value: empty or 50, depending on currency decision.

## 3. Calculation logic

### Conservative candidate range

```ts
const totalHours = leadsMessagesHours + repetitiveAnswersHours + contentHours + crmDocsHours + teamTasksHours;
const candidateLow = Math.round(totalHours * 0.25);
const candidateHigh = Math.round(totalHours * 0.45);
```

Do not call this “hours saved”. Call it “hours to review as automation candidates”.

### Monetary value

If `hourValue` is provided:

```ts
const yearlyCandidateLow = candidateLow * 52 * hourValue;
const yearlyCandidateHigh = candidateHigh * 52 * hourValue;
```

Safe wording:

`Если эти часы действительно можно сократить, потенциальная ценность проверки процесса может быть в диапазоне {low}–{high} в год. Это оценка для разговора, не финансовая гарантия.`

If no hour value, hide monetary output.

## 4. Recommendation logic

Choose the category with the highest input.

Mapping:

```ts
const recommendations = {
  leadsMessagesHours: {
    service: 'AI-автоматизация / AI-консьерж',
    reason: 'Заявки и переписки часто можно структурировать через формы, CRM, Telegram/WhatsApp и сценарии первичного ответа.',
    cta: 'Разобрать заявки'
  },
  repetitiveAnswersHours: {
    service: 'AI-консьерж / AI-база знаний',
    reason: 'Повторяющиеся вопросы лучше превращать в FAQ, сценарии ответа и базу знаний с human review.',
    cta: 'Разобрать клиентские вопросы'
  },
  contentHours: {
    service: 'AI-контент-система',
    reason: 'Контент можно ускорить через рубрики, tone of voice, промпты, шаблоны и перепаковку материалов.',
    cta: 'Разобрать контент'
  },
  crmDocsHours: {
    service: 'AI-автоматизация / AI-база знаний',
    reason: 'CRM, таблицы и документы часто страдают от копипасты и разрозненных инструкций.',
    cta: 'Разобрать CRM/Notion'
  },
  teamTasksHours: {
    service: 'AI-обучение / AI-база знаний',
    reason: 'Если команда тратит время по-разному, нужны единые сценарии, промпты и правила проверки.',
    cta: 'Разобрать команду'
  }
};
```

## 5. Output copy

### Total label

`Ручная рутина в неделю`

### Candidate label

`Стоит проверить на AI-сценарии`

### Result copy by range

0–4 hours:

`Пока лучше не строить сложную автоматизацию. Начните с одной повторяющейся задачи и проверьте, есть ли там смысл для AI.`

5–10 hours:

`Есть смысл разобрать 1–2 процесса. Чаще всего быстрый старт дают заявки, повторяющиеся ответы или контент.`

11–20 hours:

`У вас уже достаточно рутины для AI-карты. Начните с приоритетного сценария и небольшого прототипа.`

21+ hours:

`Здесь, скорее всего, проблема не только в AI, а в структуре процессов. Начинать нужно с аудита, иначе автоматизация просто ускорит бардак.`

## 6. Disclaimer

Place below output:

`Калькулятор показывает предварительную оценку. Он не обещает экономию часов или денег. Реальные возможности зависят от процесса, данных, инструментов и того, где нужен человеческий контроль.`

## 7. Lead magnet: Free AI Map

### Route

`/free-ai-map`

### Page H1

`Получите AI-карту возможностей для вашего бизнеса`

### Subheadline

`Ответьте на несколько вопросов, и я покажу 3 задачи, с которых можно начать AI-внедрение: контент, заявки, клиентские ответы, CRM/Notion, команда или база знаний.`

### What user receives

- 3 candidate processes;
- recommended starting service;
- notes on what not to automate yet;
- next step suggestion.

### Format language

Use:

`Бесплатная первичная AI-карта`

Do not use:

`Полный аудит бесплатно`

Because if everything is a “full audit”, words have died and we are just decorating invoices.

## 8. AIMapBriefForm fields

Required:

- Имя
- Контакт: Telegram / WhatsApp / email
- Чем занимаетесь?
- Где сейчас уходит больше всего времени?
- Какие инструменты уже используете?
- Есть ли команда?
- Что хотите улучшить первым?
- Consent checkbox

Optional:

- website/social link;
- monthly lead volume;
- number of team members;
- preferred format: audit/training/automation/not sure.

## 9. Submission behavior

For MVP:

- client-side validation;
- success state;
- show “integration needed” TODO;
- do not send data to a random endpoint.

Future integrations:

- Telegram notification;
- email;
- Notion database;
- Google Sheets;
- CRM.

## 10. Accessibility

Required:

- real labels;
- keyboard-operable sliders or numeric inputs;
- visible focus;
- text output not only color-coded;
- motion not required for understanding;
- mobile-friendly layout.

