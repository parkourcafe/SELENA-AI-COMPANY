# ТЗ для разработчика: premium MVP сайта KORA

## 1. Задача

Создать production-ready MVP сайта KORA — премиального русскоязычного сайта для AI-внедрения, автоматизации, AI-обучения, AI-контент-систем, AI-консьержа и AI-упаковки.

Сайт должен быть не просто “красивым”, а понятным, конверсионным и честным. Главная задача: привести посетителя к действию `Разобрать мою задачу` / `Заполнить бриф`.

## 2. Тип проекта

Это экспертно-сервисный сайт, не SaaS-продукт.

Не использовать по умолчанию паттерны:

- `Request demo`, если нет демо;
- `/security`, если нет реальных security claims;
- `/customers`, если нет реальных клиентов;
- fake dashboard screenshots;
- pricing table с выдуманными ценами;
- fake metrics and testimonials.

## 3. Технический стек

Если репозиторий пустой:

- Next.js App Router
- TypeScript
- Tailwind CSS
- CSS variables/design tokens
- optional: Framer Motion for controlled section animation

Если репозиторий уже существует:

- сохранить стек;
- не ломать существующие маршруты;
- не переписывать проект без причины.

## 4. Routes MVP

Обязательные страницы:

```text
/
/services
/ai-training
/ai-automation
/ai-content
/about
/contact
```

Рекомендуемые юридические страницы:

```text
/privacy
/terms
```

Если юридические страницы не созданы, отметить это как release blocker.

## 5. Navigation

Desktop:

- Услуги
- Обучение
- Автоматизация
- Контент
- Обо мне
- Связаться
- CTA button: `Разобрать задачу`

Mobile:

- accessible menu button
- visible CTA inside menu
- no layout shift

## 6. Homepage sections

Главная страница должна включать:

1. Header
2. Cinematic Hero
3. Problem / Chaos
4. KORA Core Loop
5. Service Modules
6. Audience Pathways
7. Implementation Examples
8. Process Timeline
9. Trust / Scope Control
10. Packages / Starting Points
11. FAQ
12. Final CTA
13. Footer

## 7. Hero specification

H1:
`AI-внедрение и обучение для бизнеса без хаоса и сложного кода`

Subheadline:
`Помогаю русскоязычным предпринимателям, экспертам и небольшим командам внедрять AI в контент, клиентские коммуникации, CRM, Telegram/WhatsApp, Notion, Make/Zapier и рабочие процессы.`

Primary CTA:
`Разобрать мою задачу`

Secondary CTA:
`Посмотреть услуги`

Trust line:
`Сначала задача и процесс. Потом инструмент, автоматизация и обучение.`

Hero visual:

- right-side premium workflow UI;
- 2–3 floating cards;
- tags/messages/leads/content ideas flowing into structured outputs;
- warm neutral palette;
- no fake customer data.

## 8. Design direction

Use premium editorial + calm AI operations style.

Palette tokens:

```css
--color-bg: #F7F2EA;
--color-surface: #FFFDF8;
--color-surface-dark: #181614;
--color-text: #161413;
--color-muted: #6E6258;
--color-accent: #B9825B;
--color-accent-2: #9AA48C;
--color-line: #E6DDD1;
```

Design rules:

- large spacing;
- strong heading scale;
- readable body text;
- warm borders;
- premium cards;
- subtle shadows;
- no neon AI clichés;
- no random stock imagery;
- no decorative animation that does not explain value.

## 9. Components

Recommended structure:

```text
components/
├── layout/Header.tsx
├── layout/Footer.tsx
├── ui/Container.tsx
├── ui/Button.tsx
├── ui/Badge.tsx
├── ui/Card.tsx
├── ui/SectionHeader.tsx
├── sections/CinematicHero.tsx
├── sections/ChaosToSystemSection.tsx
├── sections/CoreLoopSection.tsx
├── sections/ServiceModuleGrid.tsx
├── sections/AudiencePathways.tsx
├── sections/ImplementationExamples.tsx
├── sections/ProcessTimeline.tsx
├── sections/TrustBoundarySection.tsx
├── sections/PackageCards.tsx
├── sections/FAQSection.tsx
├── sections/FinalCTA.tsx
└── forms/ContactForm.tsx
```

## 10. Services to display

Use these service modules:

1. AI-аудит
2. AI-обучение
3. AI-автоматизация
4. AI-контент-система
5. AI-консьерж
6. AI-база знаний
7. AI-упаковка
8. AI-сопровождение

Each service card:

- service name;
- short outcome;
- 2–3 included items;
- audience fit;
- CTA.

## 11. Contact form

Form title:
`Бриф на AI-задачу`

Fields:

- Имя
- Контакт: Telegram / WhatsApp / email
- Чем занимаетесь?
- Какая задача сейчас важнее всего?
- Что сейчас не работает?
- Какие инструменты уже используете?
- Есть ли команда?
- Какой формат интересен?
- Комментарий
- Consent checkbox

Requirements:

- accessible labels;
- client-side validation;
- success state;
- error states;
- no random external submission;
- TODO for backend integration.

## 12. Content integrity

Never invent:

- clients;
- testimonials;
- case studies;
- revenue growth;
- conversion growth;
- certifications;
- awards;
- prices;
- compliance/security claims;
- integrations not mentioned in docs.

If a proof section is needed, use honest wording:

`Примеры возможных решений` instead of fake `Кейсы`.

## 13. SEO

Each page needs:

- one H1;
- title;
- meta description;
- Russian language metadata;
- Open Graph basics if supported;
- internal links to contact/brief.

Use `docs/06-seo-and-metadata.md` as source.

## 14. Accessibility

Must have:

- semantic HTML;
- accessible navigation;
- form labels;
- visible focus states;
- keyboard navigation;
- sufficient contrast;
- reduced-motion support;
- alt text or decorative image handling.

## 15. Performance

Must have:

- no huge unoptimized images;
- lazy loading for heavy visuals;
- no full-screen video requirement unless optimized fallback exists;
- no heavy animation libraries unless justified;
- mobile-first layout;
- responsive typography.

## 16. Implementation order

1. Inspect repository.
2. Identify framework and scripts.
3. Create or adapt design tokens.
4. Build layout, header, footer.
5. Build reusable UI components.
6. Build homepage sections.
7. Build MVP pages.
8. Add contact form.
9. Add SEO metadata.
10. Add responsive styles.
11. Add reduced-motion handling.
12. Run lint/typecheck/build if available.
13. Fix errors.
14. Provide final summary.

## 17. Definition of done

Done means:

- all required routes work;
- homepage feels premium and intentional;
- copy is Russian and aligned with KORA positioning;
- hero clearly shows AI/process transformation;
- services are understandable;
- CTAs are visible and consistent;
- form works as front-end MVP;
- no unsupported claims;
- mobile layout is polished;
- accessibility basics are covered;
- build/lint/typecheck pass or issues are documented;
- remaining TODOs are clearly listed.

## 18. Final response from developer/agent

The final response must include:

- what was implemented;
- files created/changed;
- local run commands;
- QA performed;
- assumptions made;
- blockers/TODOs;
- unsupported claims removed or avoided.

Do not stop after design direction. Build the site. Planning alone is not a deliverable, как ни трагично для любителей бесконечных стратегических документов.
