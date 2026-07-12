---
name: reverse-lead-magnet
description: >-
  Build a micro-SaaS "reverse lead magnet" — a tiny, purpose-built web app used
  as a cold-email lead magnet that solves a real problem for a lead's business
  in under 60 seconds. Use when the user wants to design or build a cold-email
  lead magnet, a micro-SaaS tool for outreach, a "perceived value" / "reverse
  lead magnet" app, or generate lead-magnet app ideas for a niche. Runs the full
  loop: generate ideas → pick one → build a single-page app → write the cold
  email sequence.
---

# Reverse Lead Magnet Builder

## What this is

A **reverse lead magnet** flips the classic lead magnet. Instead of giving a lead
something they must implement (a PDF, webinar, free trial), you give them
something **already implemented and working** — a tiny web app that solves an
actual problem for *their* business with zero effort on their end.

The lead's only input is usually a **URL or company name**. The app does the work
and returns a result they can use immediately. In the cold email you offer to
"build something custom" for them; the app is what makes that promise real (and
fast).

Why it works — three forces at once:
1. **Reciprocity** — you did meaningful work for them, so booking a call feels natural.
2. **Proof of competence** — the app *is* your portfolio. You showed, not told.
3. **The app is your website** — it holds your CTA and retargeting pixels, so even
   non-repliers become a retargeting audience.

Key rule: **build once per vertical, use for unlimited leads.** One app for "SEO
agencies" works for every SEO-agency lead regardless of the industries they serve.

## When to use

Trigger this skill when the user wants to:
- design a cold-email lead magnet or "reverse lead magnet"
- brainstorm micro-SaaS app ideas for a niche/vertical
- build a single-page tool that turns a URL/company name into a useful result
- create the outreach copy that presents such a tool

## The workflow

Run these phases in order. Do not skip the brainstorming step before building.

### Phase 1 — Generate ideas

Ask the user (or infer from context) two things:
- **Their offer / agency type** (what they sell)
- **Their target client / vertical** (who they email)

Then use the idea-generation prompt in
`references/idea-prompt.md`. Fill in the two variables and produce **5** ideas.
Each idea must include: app name + one-sentence description, the single input
(URL or company name), the output, why a decision maker says yes, and the wow
factor. Every idea must deliver value in **under 60 seconds**.

Optionally run the same prompt across more than one model and compare, then
recommend the strongest idea (highest wow factor, easiest single input, clearest
"yes").

### Phase 2 — Pick and scope (plan mode)

Before writing any code, **enter a brainstorming/planning phase** with the chosen
idea. Ask clarifying questions: exact input, exact output format, what data
sources or AI calls produce the result, branding (colors, name), and what the
CTA should be. Surface blind spots. Only start building once the scope is clear.

### Phase 3 — Build the app

Use the build prompt in `references/build-prompt.md`. It defines: purpose,
requirements (single-page web app, clean professional UI with brand colors),
inputs, processing, output, a clear CTA button, and tracking pixels.

Build principles:
- **The app is the automation.** Keep the logic inside the app. Do not require a
  separate Make/n8n workflow per lead magnet unless the user explicitly wants one.
- **Single page, fast, professional.** Value in under 60 seconds.
- **One clear CTA** (book a call / reply). Add pixel placeholders (Google Ads,
  Meta) and an optional email-gate form to capture the lead into a list.
- **Prefill support.** The app must accept the lead's URL/company via query
  param (e.g. `?url=` or `?company=`) so cold emails can link straight to a
  pre-filled result.

If this repo already has a stack, follow it (this is a Next.js + TypeScript +
Tailwind project — see `CLAUDE.md`). Otherwise a modern React/Next.js setup is
the default. For hosting + backend, Vercel + Supabase is the recommended free
pairing when one is needed.

### Phase 4 — Write the cold email sequence

Use `references/cold-email-sequence.md`. The two-email pattern:
- **Email 1** — "Would it be OK if I spent some time and built you X?" (offer,
  ask for a yes). No link yet.
- **Email 2** (after they reply yes) — "Here you go" + link to the app with their
  URL/company prefilled + soft CTA to hop on a call.

## Guardrails (project + honesty)

This repo is **KORA**, a Russian-language AI-services brand. Apply its content
integrity rules from `CLAUDE.md` to anything client-facing:
- Never invent client names, cases, numbers, testimonials, certifications, awards,
  revenue claims, or conversion improvements.
- No fake urgency, fake guarantees, fake metrics, fake dashboards, or fake private
  data.
- Reply-rate figures (e.g. "~4%") are **the method's claims, not a promise** —
  never present them to a lead as a guarantee.
- Russian client-facing copy should match KORA's voice: clear, calm, practical,
  human, not hype-driven ("без хаоса", "сначала задача, потом инструмент").

## Reference files

- `references/idea-prompt.md` — the 5-idea generation prompt (fill 2 variables)
- `references/build-prompt.md` — the single-prompt app build spec
- `references/cold-email-sequence.md` — the 2-email outreach sequence (RU + EN)
