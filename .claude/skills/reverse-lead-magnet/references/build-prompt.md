# App build prompt

Customize this with the chosen idea from Phase 1, then run it in **plan mode**
first — enter a short brainstorming phase, answer the model's questions, resolve
blind spots, and only then let it build. Following a real planning phase lets it
one-shot the app.

```
Build me a micro-SaaS single-page web app to be used as a cold email lead magnet.

PURPOSE
[One-sentence purpose from the chosen idea.]

REQUIREMENTS
- Single-page web app, no login required to see the result
- Clean, professional UI using my brand colors: [COLORS]
- Brand name shown: [BRAND NAME]
- Loads fast; delivers visible value in under 60 seconds
- Fully responsive, mobile-first

INPUT
- The lead enters: [a single URL] OR [a company name]
- Support prefill via query param so a cold email can link straight to a
  pre-filled result, e.g. ?url= or ?company=

PROCESSING
- [Describe exactly how the input becomes the output: scans, API calls, AI
  generation, lookups. Keep the logic inside the app — no separate external
  workflow unless I ask for one.]

OUTPUT
- [Describe the exact result the lead sees, and its format.]
- The result must feel custom-built for this specific company.

CALL TO ACTION
- Include one clear primary CTA button: [e.g. "Book a call" / "Get the full build"]
- Add an optional email-capture form to unlock/download the full result (opt-in)

TRACKING
- Add placeholders for a Google Ads pixel and a Meta pixel (I'll paste the IDs).
  If I don't know how, walk me through it.

STACK
- Follow this repo's existing stack and conventions if one exists.
- Otherwise: React/Next.js + TypeScript + Tailwind. For hosting/backend when
  needed, target Vercel + Supabase.

Deliver a working app. Do not invent fake data, fake dashboards, or fake results.
```

## Build principles

- **The app IS the automation.** Prefer self-contained app logic over a separate
  Make/n8n workflow per lead magnet. Add an external backend only if explicitly
  requested.
- **Prefill is mandatory** — the cold-email flow depends on linking to a result
  with the lead's URL/company already filled in.
- **One app per vertical.** Design it to work for every lead in that vertical, not
  a single company.
- **Real data only.** No fabricated metrics, testimonials, or private data
  (enforced by `CLAUDE.md`).

## Beginner / no-terminal path

If the user is not ready for Claude Code + Vercel + Supabase, the same prompts and
strategy work in browser builders (Bolt.new, Lovable) for simpler apps. Trade-offs:
faster to start and zero setup, but less control, weaker on complex backend/API
logic, and a monthly hosting subscription. Recommend graduating to Claude Code
once the app needs real backend logic or multiple tools.
