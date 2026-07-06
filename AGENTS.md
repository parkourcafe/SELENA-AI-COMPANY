# AGENTS.md

## Project overview

Russian-language website for KORA: AI implementation, AI automation, AI training, AI content systems, AI concierge/bots, AI knowledge bases, and AI-assisted packaging for entrepreneurs, experts, service businesses, and small teams.

## Main goal

Build a clear, premium, practical website that sells AI services without hype, fake claims, fake case studies, or generic “AI future” clichés.

## MVP pages

```text
/
/services
/ai-training
/ai-automation
/ai-content
/about
/contact
```

## Content source files

Before making content or UI decisions, read:

- `docs/01-site-architecture.md`
- `docs/02-homepage-wireframe.md`
- `docs/03-homepage-copy.md`
- `docs/04-services-catalog.md`
- `docs/05-design-system.md`
- `docs/06-seo-and-metadata.md`
- `docs/07-lead-form-brief.md`
- `docs/08-content-qa-checklist.md`
- `docs/09-implementation-tasks.md`
- files in `data/`

## Setup commands

Use the package manager detected in the repository.

Typical commands if available:

```bash
npm install
npm run dev
npm run lint
npm run build
```

If the project uses pnpm/yarn/bun, use the matching commands instead.

## Code style

- TypeScript where possible.
- Clear component names.
- Mobile-first responsive layout.
- Semantic HTML.
- Accessible forms.
- Reusable content sections.
- No unnecessary dependencies.
- No over-engineering.

## Brand voice

Russian copy should be:

- clear;
- confident;
- practical;
- warm but not fluffy;
- direct;
- not corporate;
- not hype-driven.

Avoid:

- “проводник в мир AI”;
- “AI заменит сотрудников”;
- “заработайте на нейросетях”;
- fake urgency;
- fake metrics;
- fake testimonials.

## Testing instructions

Before finishing:

- run lint if configured;
- run typecheck if configured;
- run build if configured;
- check mobile layout;
- check contact form validation;
- check obvious accessibility issues.

## Security and privacy

Do not hardcode private keys, tokens, emails, API credentials, or webhook URLs.

If a form integration is needed but no endpoint is provided, create a safe placeholder and document the TODO.
