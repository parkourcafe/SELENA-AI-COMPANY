# Premium master prompt для Claude Code

Ты работаешь как senior product strategist, cinematic web director, UX architect, conversion copywriter, visual systems designer и frontend implementation agent.

Нужно не просто сверстать аккуратный сайт. Нужно собрать премиальный, визуально сильный, быстрый и конверсионный сайт для KORA: AI-внедрение, автоматизация и обучение для русскоязычного бизнеса.

Сайт должен ощущаться как дорогая экспертная система, а не как очередной лендинг «нейросети изменят вашу жизнь», после которого хочется закрыть ноутбук и уйти в лес без Wi-Fi.

---

## 1. Source of truth

Перед началом прочитай:

1. `CLAUDE.md`
2. `AGENTS.md`
3. `docs/01-site-architecture.md`
4. `docs/02-homepage-wireframe.md`
5. `docs/03-homepage-copy.md`
6. `docs/04-services-catalog.md`
7. `docs/05-design-system.md`
8. `docs/06-seo-and-metadata.md`
9. `docs/07-lead-form-brief.md`
10. `docs/08-content-qa-checklist.md`
11. `docs/09-implementation-tasks.md`
12. `docs/10-premium-cinematic-brief.md`
13. `docs/11-developer-tz-premium.md`
14. файлы в `data/`

Если между документами есть конфликт, приоритет такой:

1. `CLAUDE.md`
2. этот файл
3. `docs/10-premium-cinematic-brief.md`
4. `docs/11-developer-tz-premium.md`
5. остальные `docs/`
6. `data/`

Нельзя выдумывать факты, кейсы, отзывы, цифры, клиентов, сертификаты, гарантии, юридические заявления или конкретные интеграции, которых нет в исходных документах.

---

## 2. Project constants

Project name:
KORA / KORA AI

Website status:
New build. There is no existing production site to preserve unless the repository already contains routes or app logic.

Product category:
Premium expert/service website for AI implementation, no-code automation, AI training, AI content systems, AI concierge/bots, knowledge systems and AI-assisted packaging for Russian-speaking business.

Primary audience:
Russian-speaking entrepreneurs, experts, service businesses, personal brands, SPA/beauty/wellness projects, consultants, online educators and small teams.

Payer:
Usually founder, owner, expert, managing partner or team lead.

End user:
Founder/owner, assistant, admin, marketer, content manager, sales/admin team or service team.

Main business goal:
Generate qualified leads for AI audit, AI training, AI automation, AI content system, AI concierge or AI implementation.

Primary conversion:
`Разобрать мою задачу`

Secondary conversions:
`Посмотреть услуги`, `Хочу AI-аудит`, `Хочу обучение`, `Хочу автоматизацию`, `Хочу AI-консьержа`, `Собрать контент-систему`, `Заполнить бриф`.

Core loop:
Chaotic business process → diagnosis → process map → AI/no-code scenario → implementation → team instruction → iteration/support.

Main positioning:
KORA helps Russian-speaking entrepreneurs, experts and small teams turn fragmented AI experiments, manual routines and scattered tools into clear AI-supported workflows through diagnosis, automation, training and implementation.

Honest promise:
KORA helps identify where AI can realistically save time, organize work, support content, improve lead handling and reduce repetitive manual actions. KORA does not promise guaranteed revenue, full employee replacement or magic automation.

Future vision:
KORA can grow into a premium AI implementation studio for Russian-speaking founders and service businesses.

Must preserve:
- Russian language
- Clear service architecture
- Honest claims
- MVP routes
- Form brief
- Practical, calm premium tone

Must not claim:
- guaranteed revenue growth
- AI replaces employees
- certified security/compliance unless provided
- fake case studies
- fake metrics
- fake client logos
- fake testimonials
- universal automation of everything

Must not show:
- fake private data
- fake CRM records with real-looking personal details
- fake payment/legal/medical documents
- fake certifications
- fake press logos
- generic robot/brain/neon AI visuals
- generic SaaS dashboards that do not explain KORA’s service

Legal/trust constraints:
Use clear privacy and consent language for forms. Do not collect unnecessary sensitive data. If privacy/terms pages are not implemented, mark them as release blockers or create simple placeholder pages with TODO notes.

Language:
Russian.

---

## 3. Reframed wedge

The site must communicate one primary wedge:

> KORA помогает русскоязычному бизнесу перейти от ручной рутины, хаотичного AI и разбросанных инструментов к понятным AI-процессам через диагностику, обучение, автоматизацию и внедрение.

This is a service website, not a SaaS dashboard. Do not force product-app language such as “request demo” everywhere. Use diagnostic, audit, brief and implementation language.

---

## 4. Page architecture

Create these MVP routes:

```text
/
/services
/ai-training
/ai-automation
/ai-content
/about
/contact
```

Optional but recommended if implementation time allows:

```text
/privacy
/terms
```

Do not create fake `/demo`, `/pricing`, `/security`, `/customers` pages unless the content is honest and supported.

Use this navigation:

- Услуги
- Обучение
- Автоматизация
- Контент
- Обо мне
- Связаться
- Primary CTA: Разобрать задачу

---

## 5. Homepage story

Homepage must follow this logic:

1. Cinematic Hero
2. Problem / Chaos
3. KORA Core Loop
4. Services / Productized modules
5. For whom
6. Implementation examples
7. Process
8. Trust / Scope Control
9. Packages / Starting points
10. FAQ
11. Final CTA

Every major section must move toward the primary CTA.

---

## 6. Cinematic hero

Hero goal:
Make the core value obvious within 5 seconds.

Hero headline:
`AI-внедрение и обучение для бизнеса без хаоса и сложного кода`

Subheadline:
`Помогаю русскоязычным предпринимателям, экспертам и небольшим командам внедрять AI в контент, клиентские коммуникации, CRM, Telegram/WhatsApp, Notion, Make/Zapier и рабочие процессы.`

Primary CTA:
`Разобрать мою задачу`

Secondary CTA:
`Посмотреть услуги`

Trust line:
`Сначала задача и процесс. Потом инструмент, автоматизация и обучение.`

Hero visual concept:
Show messy business inputs transforming into a structured AI operating system.

Messy inputs:
- messages
- leads
- content ideas
- CRM notes
- repetitive questions
- scattered documents
- team tasks

Structured outputs:
- AI audit map
- content system
- AI concierge flow
- CRM/Telegram automation
- knowledge base
- training playbook

Hero UI mockup must contain 2–3 floating cards.

Card 1:
Title: `AI-аудит`
Object: `Карта возможностей`
Statuses:
- `Контент: высокая нагрузка`
- `Заявки: ручная обработка`
- `Команда: разные AI-сценарии`
Next action: `Выбрать 3 быстрых сценария`
CTA: `Открыть карту`

Card 2:
Title: `AI-консьерж`
Insight: `7 типовых вопросов можно вынести в первый сценарий`
Evidence: `цены, запись, подготовка, адрес, формат услуги`
Status: `Нужен human review перед запуском`
CTA: `Собрать FAQ`

Card 3:
Title: `Контент-система`
Outcome: `1 экспертный материал → 5 форматов`
Status: `Черновики готовы к редактуре`
CTA: `Собрать контент-план`

No fake numbers. No fake customer data.

---

## 7. Premium visual direction

The visual system should feel like:

- premium editorial studio
- calm AI operations room
- warm consulting brand
- structured workflow map
- quiet luxury, not cyberpunk nightclub for exhausted founders

Palette direction:

- primary background: warm ivory / `#F7F2EA`
- surface: soft white / `#FFFDF8`
- dark surface: charcoal / `#181614`
- text: near black / `#161413`
- muted text: taupe / `#6E6258`
- accent: burnished copper / `#B9825B`
- secondary accent: muted sage / `#9AA48C`
- line: warm sand / `#E6DDD1`

Typography:
Use strong editorial headlines and readable premium sans-serif body text. Use system fonts or project-safe web fonts. Do not include paid font files.

Motion:
Use subtle scroll storytelling, reveal animations, sticky visual panels, soft parallax and product-card transitions only when they clarify the transformation from chaos to system.

Respect `prefers-reduced-motion`.

Avoid:
- random gradients
- floating blobs
- neon brains
- generic robots
- fake dashboards
- stock business people smiling at laptops because apparently that is how civilization represents productivity
- animation that exists only to prove someone discovered Framer Motion

---

## 8. Core reusable sections

Build reusable sections:

- `CinematicHero`
- `ChaosToSystemSection`
- `CoreLoopSection`
- `ServiceModuleGrid`
- `AudiencePathways`
- `ImplementationExamples`
- `ProcessTimeline`
- `TrustBoundarySection`
- `PackageCards`
- `FAQSection`
- `FinalCTA`
- `ContactForm`

Each section must have a clear content purpose, not decorative filler.

---

## 9. Trust and scope control

Add a trust/scope section on homepage and relevant pages.

Headline:
`AI полезен только там, где есть понятный процесс`

Cards:

1. `Без фейковых обещаний`
   No guaranteed revenue, no “AI replaces everyone”.

2. `Human review там, где он нужен`
   Client communication, public content and sensitive decisions need human control.

3. `Ваши данные — не демо-игрушка`
   Do not ask for unnecessary sensitive data. Demo visuals must use fictional placeholders.

4. `Сначала процесс, потом инструмент`
   KORA does not install tools for the sake of tools.

5. `Ограничения проговариваются заранее`
   If something is not possible or not worth automating, say it clearly.

This section should increase trust, not sound defensive.

---

## 10. Service modules

Display these services as productized modules:

1. AI-аудит
2. AI-обучение
3. AI-автоматизация
4. AI-контент-система
5. AI-консьерж
6. AI-база знаний
7. AI-упаковка
8. AI-сопровождение

Each module card must include:

- name
- short description
- who it is for
- what the client receives
- CTA

---

## 11. Contact form

Primary form name:
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
- Consent checkbox for personal data processing

For MVP:

- client-side validation
- accessible labels
- error states
- success state
- no random external submissions
- TODO for email/Telegram/CRM integration

---

## 12. Technical implementation

If starting fresh, use:

- Next.js App Router or Vite + React
- TypeScript
- Tailwind CSS or clean CSS design tokens
- Framer Motion only if it does not bloat or complicate the build
- responsive components
- accessible forms
- optimized media placeholders
- reduced-motion support

Do not add heavy libraries unless required.

If media generation is not available, create premium CSS/HTML/SVG-style visual systems instead of using stock photos.

---

## 13. Copywriting rules

Tone:

- premium
- clear
- direct
- practical
- calm
- commercially sharp
- Russian-first

Avoid:

- “инновационное решение”
- “революционная платформа”
- “AI сделает всё за вас”
- “гарантированный результат”
- “AI заменит сотрудников”
- fake urgency
- fake metrics
- fake testimonials
- fake enterprise claims
- vague startup language

Use:

- concrete tasks
- before/after transformation
- real workflow language
- honest boundaries
- clear CTAs
- service outcomes
- client-owned language

---

## 14. Acceptance criteria

Ready means:

- all MVP pages exist
- homepage communicates core value within 5 seconds
- hero feels premium and memorable, not generic
- all copy is in Russian
- no unsupported claims
- no fake cases, metrics, clients or testimonials
- service modules are clear
- primary CTA is visible above the fold
- contact form is accessible and validates fields
- mobile layout works
- reduced motion is respected
- SEO metadata exists
- privacy/terms are created or marked as blockers
- build/lint/typecheck run if commands exist
- final response includes changed files, run instructions, assumptions, blockers and QA checklist

Do not stop at planning. Do not only create mockups. Execute the build.
