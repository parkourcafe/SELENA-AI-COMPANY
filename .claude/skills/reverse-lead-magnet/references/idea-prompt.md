# Idea-generation prompt

Fill in the two variables, then run. Use a strong reasoning model. You can run it
across several models and compare the outputs before picking.

```
I run a [OFFER / AGENCY TYPE] agency targeting [TARGET CLIENT / VERTICAL].

Generate 5 micro-SaaS app ideas that I can build as a cold email lead magnet.

For each idea give me:
- App name + one-sentence description
- What the lead inputs — this should be JUST a URL or a company name, nothing more
- What the app outputs
- Why a decision maker would say "yes" to receiving it
- The wow factor (what grabs their attention)

Hard constraints:
- The app must deliver value in under 60 seconds
- The single input must be a URL or company name only
- The output must be something the lead can use immediately, with zero effort
- No login, no long forms, no setup on the lead's side to see the result

Return the 5 ideas as a clean, scannable list.
```

## How to choose the winning idea

Score each idea on:
1. **Single-input simplicity** — is one URL/company name genuinely enough?
2. **Speed** — can it truly return value in <60s?
3. **Yes-obviousness** — would the decision maker obviously want this for free?
4. **Wow factor** — does the output feel custom-built, not generic?
5. **Buildability** — can it be built in ~1 hour with the available stack?

Pick the highest combined score. Prefer ideas where the output visibly proves
your competence (it doubles as your portfolio).

## Worked examples (from the source method)

- **SEO agency → their leads want to rank on AI search (ChatGPT/Perplexity/Claude):**
  app scans the lead's site, identifies backlink opportunities for AI search
  results, and starts building a backlink profile. Input: URL.
- **AI-automation agency → leads on GoHighLevel/Shopify/HubSpot:** app detects the
  lead's tech stack from their site, then builds custom automations for those exact
  tools (importable in one click) and suggests AI workflows. Input: URL.
- **Generic cold-email offer:** "Cold email teardown engine" — analyzes a company's
  site and public signals to tear down their current outbound and show why they
  aren't booking calls. Input: URL/company.
