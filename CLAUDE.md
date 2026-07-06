# CLAUDE.md

## Project overview

This project is a Russian-language website for KORA, an AI services brand focused on AI implementation, business-process automation, AI training, AI content systems, AI concierge/bots, and knowledge systems for entrepreneurs, experts, service businesses, and small teams.

The website must feel practical, calm, premium, and clear. It should not look like a generic “AI future neon brain” landing page.

## Core positioning

KORA helps Russian-speaking entrepreneurs, experts, and small teams implement AI into real workflows:

- content;
- client communication;
- lead handling;
- CRM;
- Telegram/WhatsApp;
- Notion;
- Make/Zapier;
- internal processes;
- team training.

Main message:

> AI should save time and bring order, not create another layer of chaos.

## Audience

Primary audience:

- Russian-speaking entrepreneurs;
- experts and personal brands;
- service businesses;
- SPA, beauty, wellness, massage studios;
- consultants and online educators;
- small teams and micro-agencies.

Audience pain points:

- too much manual work;
- chaotic content production;
- missed or scattered leads;
- repeated client questions;
- fragmented tools;
- teams using AI inconsistently;
- unclear starting point for AI implementation.

## Brand voice

Use Russian copy. Tone should be:

- clear;
- confident;
- practical;
- human;
- direct;
- not corporate;
- not hype-driven;
- not too technical.

Allowed phrases:

- “без хаоса”;
- “без сложного кода”;
- “AI в реальные бизнес-процессы”;
- “сначала задача, потом инструмент”;
- “спокойное внедрение AI”.

Avoid:

- “проводник в мир AI”;
- “заработайте на нейросетях”;
- “AI заменит сотрудников”;
- “автоматизируем всё”;
- fake urgency;
- fake guarantees;
- fake metrics;
- fake testimonials.

## Content integrity rules

Never invent:

- client names;
- cases;
- numbers;
- testimonials;
- certifications;
- awards;
- revenue claims;
- conversion improvements;
- specific integrations that are not in the docs.

If a section needs proof but no proof exists, either omit it or use an honest placeholder.

## MVP site map

```text
/
/services
/ai-training
/ai-automation
/ai-content
/about
/contact
```

Future pages:

```text
/cases
/blog
/for-service-business
/for-experts
/free-ai-map
/privacy
/terms
```

## Page goals

### `/`

Explain the whole offer quickly and direct users to contact/brief.

### `/services`

Show the full service catalog and help users choose the right starting point.

### `/ai-training`

Sell practical AI training for entrepreneurs and teams.

### `/ai-automation`

Sell no-code AI automation and workflow implementation.

### `/ai-content`

Sell AI content systems and AI-assisted product/personal-brand packaging.

### `/about`

Build trust through positioning, background, approach, and principles.

### `/contact`

Collect qualified leads through a structured brief.

## Technical conventions

If the repository is empty, use a modern React/Next.js setup with TypeScript and Tailwind CSS.

If a framework already exists, follow the existing conventions instead of replacing everything.

Prefer:

- simple component architecture;
- data-driven content where useful;
- semantic HTML;
- accessible form controls;
- reusable sections;
- mobile-first responsive layout;
- clear naming.

Do not add heavy dependencies unless necessary.

## Suggested component structure

```text
components/
├── layout/Header.tsx
├── layout/Footer.tsx
├── ui/Container.tsx
├── ui/Button.tsx
├── ui/Badge.tsx
├── sections/Hero.tsx
├── sections/AudienceSection.tsx
├── sections/ServicesSection.tsx
├── sections/ProcessSection.tsx
├── sections/FAQSection.tsx
├── sections/CTASection.tsx
└── forms/ContactForm.tsx
```

## Design direction

Use the design system in `docs/05-design-system.md`.

Visual principles:

- light background;
- warm neutral palette;
- strong typography;
- large spacing;
- clean cards;
- subtle borders;
- restrained accent color;
- no neon cyberpunk;
- no generic robot stock imagery.

## UX rules

Every page should answer:

1. What is this?
2. Who is it for?
3. What problem does it solve?
4. What exactly is included?
5. What result can I expect?
6. What should I do next?

Primary CTA:

> Разобрать мою задачу

Secondary CTAs:

- Посмотреть услуги
- Хочу AI-аудит
- Хочу обучение
- Хочу автоматизацию
- Хочу AI-консьержа
- Собрать контент-систему
- Заполнить бриф

## SEO rules

Use metadata from `docs/06-seo-and-metadata.md`.

Each page should have:

- one clear H1;
- descriptive title;
- meta description;
- Russian language content;
- internal links to relevant services/contact.

## Contact form rules

Use fields from `docs/07-lead-form-brief.md`.

For MVP, the form can be front-end only with validation and a success state. Leave clear TODO comments for backend integration.

Do not send data to random third-party endpoints.

## Quality gates

Before final response:

- run lint if configured;
- run typecheck if configured;
- run build if configured;
- fix obvious UI and TypeScript errors;
- report remaining TODOs honestly.

## Premium cinematic execution layer

This website is a premium expert/service website, not a SaaS dashboard. Use cinematic product storytelling only when it clarifies the service transformation: messy business inputs become structured AI-supported workflows.

Visual concept:

- chaos → system;
- scattered messages, leads, content ideas, CRM notes and documents → AI audit map, content system, AI concierge, automation flow and knowledge base;
- premium editorial layout;
- warm neutral palette;
- subtle motion;
- no neon AI brain clichés;
- no fake dashboards or fake private data.

Homepage must feel more like a calm premium AI operations studio than a generic landing page. Every animation and visual object must explain the business value.

Use `00-claude-code-premium-master-prompt.md`, `docs/10-premium-cinematic-brief.md` and `docs/11-developer-tz-premium.md` for the upgraded build direction.

Do not literally copy SaaS-only patterns such as `/demo`, `/security`, `/customers` or pricing tables unless the content is honest and supported. For KORA, the primary conversion is a qualified brief: `Разобрать мою задачу` / `Заполнить бриф`.


## Conversion funnel execution layer v2

The site must now be built as a premium diagnostic funnel, not only as a polished service brochure.

Primary conversion:

> Получить AI-карту возможностей

Secondary conversions:

- Посчитать рутину
- Разобрать 1 процесс
- Посмотреть услуги
- Заполнить бриф
- Хочу AI-аудит
- Хочу обучение
- Хочу автоматизацию
- Хочу AI-консьержа

Updated homepage logic:

1. Hero with time-loss question
2. Time-loss calculator
3. Goal selector
4. KORA core loop
5. Product ladder
6. Service modules
7. Implementation examples
8. Founder story
9. Trust / scope control
10. FAQ
11. Final AI-map CTA

Updated hero H1:

> Сколько часов в неделю ваш бизнес теряет на заявки, ответы, контент и ручную рутину?

Updated trust line:

> Сначала разбираем процесс. Потом решаем, где нужен AI, автоматизация или человек.

Required route:

```text
/free-ai-map
```

Required components:

```text
components/sections/TimeLossCalculator.tsx
components/sections/GoalSelectorSection.tsx
components/sections/ProductLadderSection.tsx
components/sections/FounderStorySection.tsx
components/sections/AIMapCTASection.tsx
components/forms/AIMapBriefForm.tsx
```

The calculator must never promise guaranteed savings. Use “кандидаты на AI-сценарии” and “предварительная оценка” language.

Use these updated docs as priority:

- `00-claude-code-conversion-master-prompt.md`
- `docs/12-productcamps-funnel-adaptation.md`
- `docs/13-homepage-conversion-wireframe-v2.md`
- `docs/14-calculator-and-lead-magnet-spec.md`
- `docs/15-developer-tz-conversion-v2.md`

## Competitive research execution layer v3

The site now includes an internal competitive research layer based on international AI education, AI operations, no-code, newsletter, and AI agency projects.

Use this layer strategically, not literally. Do not copy competitor design, names, prices, claims, testimonials, logos, or product structures.

Strategic patterns to adapt:

- AI Operations and playbooks instead of generic “AI tools”;
- free diagnostic entry before paid services;
- task-based navigation instead of service-first confusion;
- product ladder: free AI-map → AI audit → training → implementation → support;
- future content engine: “AI без хаоса” newsletter/Telegram;
- future recurring product: KORA AI Library as waitlist only unless launched.

Updated public category:

> AI-внедрение и AI-playbooks для русскоязычного бизнеса.

Required new docs:

- `docs/16-competitive-research-layer.md`
- `docs/17-developer-tz-competitive-v3.md`

Required new data:

- `data/competitors.json` — internal only, never public page copy;
- `data/product-ladder-v3.json`;
- `data/newsletter-ai-without-chaos.json`;
- `data/ai-playbooks.json`.

Required new components if building v3:

```text
components/sections/AIPlaybookSection.tsx
components/sections/NewsletterLeadSection.tsx
components/sections/FutureLibrarySection.tsx
components/forms/NewsletterForm.tsx
```

Homepage v3 order:

```text
Header
Hero
TimeLossCalculator
GoalSelectorSection
AIPlaybookSection
CoreLoopSection
ProductLadderSection
ServiceModuleGrid
NewsletterLeadSection
ImplementationExamples
FounderStorySection
FutureLibrarySection
TrustBoundarySection
FAQSection
AIMapCTASection
Footer
```

Public pages must not mention competitor names. Competitive research is an internal strategy source, not public copy.


---

## Competitor-informed strategy layer v3

Use the competitor research only as a source of market mechanics, not as a visual-copying brief.

KORA should borrow these mechanics:

- AI Operations language: scenarios, playbooks, workflow maps, team instructions;
- education library thinking: future KORA AI Library, but not sold before content exists;
- implementation agency process: diagnose → build → train/adopt;
- founder-led trust: practical story, not fake authority;
- newsletter/content engine: “AI без хаоса”;
- tool-by-task categorization: tools should be explained through business tasks;
- no-code accessibility: language for non-technical business owners.

Primary site path v3:

```text
Hero question
→ TimeLossCalculator
→ GoalSelector
→ Free AI-map
→ AI audit / training / implementation
→ support or future library
```

Current primary CTA:

> Получить AI-карту возможностей

Future/backlog offers must be clearly marked and not sold as active:

- KORA AI Library;
- 5-day email mini-course;
- resources/tool directory;
- formal certification;
- public case-study archive.

Do not claim membership, certification, client results, subscriber counts, awards, enterprise logos or exact pricing unless the user provides approved facts.

If v3 docs conflict with older docs, follow:

1. `00-claude-code-competitor-informed-master-prompt.md`
2. `docs/19-developer-tz-competitor-informed-v3.md`
3. `docs/17-kora-offer-ladder-v3.md`
4. `docs/18-content-and-lead-magnet-engine.md`
5. older docs


## Market-informed conversion layer v3

Use `00-claude-code-market-informed-master-prompt.md` as the main prompt for the current build.

The site now includes a competitor-informed funnel layer based on AI operations, education platforms, AI automation agencies, newsletter-first products and productivity workflow creators.

Priority docs:

- `docs/16-global-ai-competitor-benchmark.md`
- `docs/17-kora-market-informed-strategy.md`
- `docs/18-kora-content-engine-and-lead-magnets.md`
- `docs/19-developer-addendum-market-informed-v3.md`

Do not copy competitor visuals, claims, prices, proof, testimonials, certification language or audience-size claims. Use competitors only as structural inspiration.

Primary conversion remains:

> Получить AI-карту возможностей

The website must support:

- diagnostic funnel;
- time-loss calculator;
- goal selector;
- AI-map page;
- founder-led trust;
- newsletter/content engine CTA;
- future product ladder foundation.

Do not add `/pricing`, `/certification`, `/community`, `/library`, `/customers` or `/security` to main navigation until real supported content exists.
