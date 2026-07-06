# Implementation contract — KORA build

This file is the binding contract for every component and page in this repo.
Exact file paths, export names and props are fixed here so independently
written modules integrate without edits. If you are an agent writing a part
of this site: follow this contract exactly; do not rename exports, do not
restructure files, do not edit files outside your assignment.

## Stack already in place

- Next.js 15 App Router + TypeScript + Tailwind CSS v4 (`@theme` tokens in `app/globals.css`).
- Fonts: Lora (serif, headings — applied automatically to `h1–h4`) and Inter
  (sans, body) via `next/font`, already wired in `app/layout.tsx`.
- `app/layout.tsx` already renders `<Header />`, `<main id="main">{children}</main>`, `<Footer />`.
  Pages must NOT render Header/Footer themselves.

## Design tokens (Tailwind utilities available everywhere)

Colors: `bg-ivory` `bg-surface` `bg-charcoal` `bg-charcoal-2` `text-ink`
`text-muted` `text-copper` `text-copper-deep` `text-sage` `text-ivory`
`border-line` `border-line-dark` (+ any `/opacity` variants).

Type scale: `text-display` `text-h1` `text-h2` `text-h3` (fluid clamp sizes).
Headings are serif automatically; body is sans.

Premium primitives (plain CSS classes): `bg-warm-canvas` (layered ivory +
radial copper/sage light), `grid-texture` (faint grid, masked), `card-premium`
(surface + warm border + soft shadow).

Animation utilities: `animate-drift-in` (entrance; set `style={{ animationDelay }}`),
`animate-float-soft` (slow vertical float), `animate-flow-dash` (SVG dash flow).
Scroll reveal: wrap in `<Reveal delay={ms}>` (see below). Reduced motion is
handled globally in CSS — never add your own motion that bypasses it.

## Shared components (import paths are exact)

```tsx
import { Container } from "@/components/ui/Container";   // { children, className?, size?: "default"|"narrow"|"wide" }
import { Button } from "@/components/ui/Button";         // { href, children, variant?: "primary"|"secondary"|"ghost"|"onDark", size?: "md"|"lg", className? }
import { Badge, Eyebrow } from "@/components/ui/Badge";  // Badge: { children, tone?: "neutral"|"copper"|"sage"|"onDark" }; Eyebrow: { children, onDark? }
import { Card } from "@/components/ui/Card";             // { children, className?, hover?: boolean }
import { SectionHeader } from "@/components/ui/SectionHeader"; // { eyebrow?, headline, intro?, onDark?, align?: "left"|"center", className? }
import { Reveal } from "@/components/ui/Reveal";         // client scroll-reveal: { children, className?, delay?: number(ms), as?: "div"|"section"|"li"|"span" }
import { cn } from "@/lib/cn";
```

## Data modules (use these — do NOT hardcode duplicate content)

```tsx
import { site, cta, nav, contact, footerNote } from "@/lib/site";
import { services, getService } from "@/lib/data/services";          // 8 modules
import { chaos, coreLoop, process, audiences, examples, packages, trust } from "@/lib/data/content";
import { faq } from "@/lib/data/faq";                                 // FaqItem[]
import { buildMetadata } from "@/lib/metadata";                       // per-page Metadata
```

## Section components — exact contract

All in `components/sections/`, server components unless marked client.
Every section: full-bleed `<section>` with vertical rhythm `py-20 sm:py-28`,
content inside `<Container>`, opener via `<SectionHeader>`, items staggered
with `<Reveal delay={i * 80}>`.

| File | Export | Props | Notes |
|---|---|---|---|
| `ChaosToSystemSection.tsx` | `ChaosToSystemSection` | none | Data: `chaos`. Cinematic: left column = "before" items as slightly rotated messy chips/cards (muted), right/below = `chaos.transformation` steps as an ordered flowing sequence with numbered copper pills and connecting line. Light bg (`bg-ivory`). |
| `CoreLoopSection.tsx` | `CoreLoopSection` | none | Data: `coreLoop`. DARK contrast moment: `bg-charcoal text-ivory`, `border-line-dark` hairlines, copper accents, big serif numbers (`01–06`), grid 1/2/3 cols. `SectionHeader onDark`. |
| `ServiceModuleGrid.tsx` | `ServiceModuleGrid` | `{ withHeader?: boolean }` default true | Data: `services`. 8 premium cards: index numeral, name (serif `text-h3`), promise, 3 included bullets (copper dot markers), audience line (muted, italic or small), CTA arrow-link `→ s.ctaLabel` to `s.href`. Grid 1/2 cols (lg: 2, xl: 2). When `withHeader` false, render only the grid (for /services page which brings its own hero). |
| `AudiencePathways.tsx` | `AudiencePathways` | none | Data: `audiences`. 4 cards; inside each: pain (muted, prefixed «Боль:» styling optional) → visual arrow/divider → what KORA builds (ink). Grid 1/2/4. |
| `ImplementationExamples.tsx` | `ImplementationExamples` | none | Data: `examples`. 4 scenario cards with `Badge tone="copper"` context chip + title + text. MUST render `examples.disclaimer` visibly under the header (honesty requirement). Consider `bg-surface` band (subtle contrast vs ivory). |
| `ProcessTimeline.tsx` | `ProcessTimeline` | none | Data: `process`. Vertical timeline: copper numbered nodes on a hairline spine, alternating or single column; mobile-first single column. |
| `TrustBoundarySection.tsx` | `TrustBoundarySection` | none | Data: `trust`. 5 cards; quiet, confident design — sage/copper hairline top borders, no icons needed. Grid 1/2/3 with last row balanced. |
| `PackageCards.tsx` | `PackageCards` | none | Data: `packages`. 5 entry-point cards: name (serif), outcome, 3 bullet points, arrow-link «Начать с брифа» → `p.href`. MUST render `packages.priceNote` visibly (no fake prices). |
| `FAQSection.tsx` | `FAQSection` | `{ items?: FaqItem[], withHeader?: boolean }` defaults `faq`, true | Accessible premium accordion using native `<details>/<summary>` styled: `card-premium` rows, serif question, copper rotating chevron (CSS `[&::-webkit-details-marker]:hidden`, `group-open:` styles). Import type: `import { faq, type FaqItem } from "@/lib/data/faq"`. |
| `FinalCTA.tsx` | `FinalCTA` | none | DARK closing moment `bg-charcoal`: headline «Разберём, где AI может помочь вашему бизнесу», intro «Опишите задачу простыми словами. Не нужно заранее знать, какой инструмент вам нужен — сначала разберём процесс.», `Button variant="onDark" size="lg"` → `cta.brief`. Subtle `grid-texture` or radial copper glow allowed. Center aligned. |
| `PageHero.tsx` | `PageHero` | `{ eyebrow: string, title: string, intro?: string, children?: ReactNode }` | Shared cinematic sub-page opener: `bg-warm-canvas`, `pt-32 sm:pt-40 pb-16 sm:pb-20`, `Eyebrow` + serif `h1` `text-h1` + intro `text-muted text-lg`; `children` slot for CTAs/extra. |

Form (client): `components/forms/ContactForm.tsx`, export `ContactForm`, no props.
"use client". Title «Бриф на AI-задачу». Fields (exact, per TZ §11): Имя*;
Контакт (Telegram / WhatsApp / email)*; Чем занимаетесь?; Какая задача сейчас
важнее всего?* (textarea); Что сейчас не работает? (textarea); Какие
инструменты уже используете?; Есть ли команда? (select: Работаю один/одна ·
Команда 2–5 · Команда 6–15 · Больше 15); Какой формат интересен? (select:
Пока не знаю — разобрать задачу · AI-аудит · Обучение · Автоматизация ·
Контент-система · AI-консьерж · Другое); Комментарий (textarea); consent
checkbox* «Согласен(на) на обработку персональных данных для ответа на
заявку» with link to /privacy. Requirements: every input has a real
`<label htmlFor>`; client-side validation on submit (required fields +
consent); per-field error messages (`aria-describedby`, `aria-invalid`,
red-ish but on-palette: use `text-copper-deep`/`border-copper`); success
state replaces the form («Бриф получен…» + what happens next); NO network
request — `// TODO(backend): wire submission to email/Telegram/CRM`; honest
UI note that the form is processed manually. Inputs styling: `bg-surface
border border-line rounded-xl px-4 py-3 focus:border-copper` etc.

## Pages — exact contract

Every page: `export const metadata = buildMetadata({ title, description, path })`
(unique title/description per page, Russian). One `h1` per page (PageHero's).
Do NOT wrap pages in Header/Footer. Homepage is composed in `app/page.tsx`
in this exact order:

CinematicHero (exists), ChaosToSystemSection, CoreLoopSection,
ServiceModuleGrid, AudiencePathways, ImplementationExamples, ProcessTimeline,
TrustBoundarySection, PackageCards, FAQSection, FinalCTA.

| Route file | Content |
|---|---|
| `app/page.tsx` | Composition above. Metadata: title = site.tagline, description = site.description, path "/". |
| `app/services/page.tsx` | PageHero («Услуги», «Восемь модулей — от диагностики до сопровождения…») + short guidance para «Не знаете, с чего начать — начните с брифа» + `ServiceModuleGrid withHeader={false}` + PackageCards + FinalCTA. |
| `app/ai-training/page.tsx` | Sell practical AI training. PageHero + sections: для кого (владелец/команда), что входит (практические сессии на ваших задачах, библиотека промптов, инструкции, форматы: индивидуально/командой), как проходит (использовать `process` данные или собственные 4 шага честно), результат честно (умение применять AI в своих задачах — БЕЗ обещаний дохода), FAQSection (subset: pick 3–4 relevant from `faq` via slice/filter), FinalCTA. |
| `app/ai-automation/page.tsx` | Sell no-code automation. PageHero + что автоматизируем (заявки, коммуникации, CRM/Notion/таблицы, Telegram/WhatsApp, Make/Zapier сценарии — карточки), как выглядит связка (пример потока: Заявка → CRM → Telegram → черновик ответа, с human review), этапы работ, границы честно (не всё стоит автоматизировать), FAQ subset, FinalCTA. |
| `app/ai-content/page.tsx` | Sell content system + packaging. PageHero + проблема (контент рывками), что собираем (система: 1 материал → форматы; шаблоны и промпты; процесс с редактурой; упаковка продукта), для кого, этапы, FAQ subset, FinalCTA. |
| `app/about/page.tsx` | Trust page. PageHero («Обо мне») + positioning: чем занимаюсь, подход («сначала процесс, потом инструмент»), принципы (reuse `trust.cards` data), как я работаю (кратко process), CTA. CRITICAL: do NOT invent biography facts, years of experience, client counts, credentials, education, names. Only positioning/approach/principles. |
| `app/contact/page.tsx` | PageHero («Связаться», «Опишите задачу простыми словами…») + two-col layout: ContactForm (left, wider) + aside: что будет дальше (3 шага: бриф → короткий разбор → предложение формата), примечание про каналы (Telegram/WhatsApp appear here later — `contact` values are null for now, do NOT invent handles; say «Пока удобнее всего — форма брифа»), FAQ subset. |
| `app/privacy/page.tsx` | Honest minimal privacy policy for the brief form: what is collected (только то, что вы указали в форме), purpose (ответ на заявку), no sale/transfer, contact for deletion. Marked `<!-- TODO(legal): review before launch -->` comment in JSX comment form. Simple prose layout (`Container size="narrow"`, prose-like manual styling). |
| `app/terms/page.tsx` | Simple honest terms placeholder: услуги оказываются по договорённости после брифа; сайт носит информационный характер; no guarantees implied. Same TODO note. |
| `app/not-found.tsx` | 404: bg-warm-canvas, big serif «Страница не нашлась», text, Button home + Button contact. No metadata export needed. |
| `app/sitemap.ts` | default export MetadataRoute.Sitemap over routes: / /services /ai-training /ai-automation /ai-content /about /contact /privacy /terms using `site.url`. |
| `app/robots.ts` | default export MetadataRoute.Robots: allow all, sitemap `${site.url}/sitemap.xml`. |

## Copy rules (binding)

- Public copy: Russian only. Calm, premium, concrete, direct. No hype.
- BANNED: «инновационное решение», «революционная платформа», «AI сделает всё
  за вас», «гарантированный результат», «AI заменит сотрудников»,
  «проводник в мир AI», «заработайте на нейросетях», «автоматизируем всё»,
  fake urgency, invented numbers/metrics/cases/clients/testimonials/prices/
  certifications, invented biography facts.
- Tools we may name (from docs): ChatGPT-class AI in general terms, Telegram,
  WhatsApp, Notion, Make, Zapier, CRM (generic), Google-таблицы (generic).
  Do not name other specific integrations.
- Proof sections use honest framing: «Примеры возможных решений», not «Кейсы».
- Prices: never; use «формат оценивается после брифа».

## Hard don'ts

- No new npm dependencies. No Framer Motion — CSS + Reveal only.
- No localStorage/sessionStorage. No external network calls from the form.
- No images/stock photos — CSS/SVG visual systems only.
- No `dark:` variants (site is single warm-light theme with charcoal bands).
- Do not modify: `app/globals.css`, `app/layout.tsx`, shared UI components,
  data modules, `lib/*` — if the contract seems wrong, note it in your
  return message instead of editing shared files.
- Do not run `npm run build` / dev servers (integration happens after all
  parts land).
