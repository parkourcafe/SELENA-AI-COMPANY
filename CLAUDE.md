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

