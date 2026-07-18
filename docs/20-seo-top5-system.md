# Selena Systems SEO Top-5 System

Status: active roadmap
Baseline date: 2026-07-18
Primary market assumption: English global + Russian-speaking global/CIS; Google first, Yandex second for Russian demand.

## What "top 5" means

The objective is not an unverifiable promise to rank the homepage for a broad phrase such as "AI automation". Success means that a growing set of high-intent query clusters has a Selena Systems page in positions 1-5 and produces qualified AI Audit leads.

North-star metric: count of priority commercial query clusters whose best canonical URL has a trailing 28-day average position of 5 or better, with qualified organic leads as the business guardrail.

## Baseline

| Area | Current state | Decision |
|---|---|---|
| Production | `https://www.selenasystems.com` returns 200; apex redirects to `www` | Keep `www` canonical |
| Index discovery | Search sampling finds the English homepage; broader index coverage is not yet measurable here | Use verified Google Search Console as source of truth |
| Languages | English exists at both `/` and `/en`; Russian home is `/ru`, while older Russian inner pages use root-level URLs | Redirect `/en` to `/`; migrate Russian inner pages under `/ru` in a controlled later phase |
| Metadata | Self-canonical URLs and RU/EN alternates exist on key pages | Add `x-default`, remove incorrect pairings and keep reciprocal alternates only for true translations |
| Sitemap | Live and valid, but included `/en` and assigned the same generated `lastmod` to every URL | Keep only canonical URLs and omit inaccurate `lastmod` values |
| Structured data | No JSON-LD on the homepage | Add visible, truthful Organization, WebSite and Service data |
| Social search surface | Large Twitter card declared without an image | Add existing Selena Systems process media to OG/Twitter metadata |
| Measurement | Google verification file exists; no GSC export, Yandex verification or privacy-approved analytics is present in the repo | Establish a 14-day baseline before setting click and lead volume targets |
| Lead attribution | Form backend records only the pathname | Preserve query parameters so UTM attribution reaches Telegram/webhook |

## SERP findings

The broad category is crowded and visually repetitive. Generalist competitors lead with vague automation claims; stronger pages narrow the buyer, workflow and outcome.

- English generalists such as [Qrousel](https://qrousel.com/), [NexusAI Solution](https://nexusaisolution.co.uk/) and [Axe Automation](https://www.axeautomation.co/) combine a workflow audit, fixed implementation process, security language and operational proof.
- Hospitality leaders such as [Leo Hospitality](https://www.getleo.net/) and [ServeOS](https://serveos.ai/) describe connected restaurant operations rather than generic AI tools.
- Clinic pages such as [HelloHealthAI](https://www.hellohealthai.com/) and [Neyrix Dental](https://neyrix.ru/dental) focus on missed calls, booking, no-shows, escalation and privacy.
- Real-estate pages such as [Prathos](https://www.prathos.com/real-estate), [Daiyn Solutions](https://daiynsolutions.com/industries/real-estate) and [Hildi Consulting](https://hildiconsulting.com/ru/cases/crm-sales-pipeline-automation-real-estate) focus on lead routing, CRM, documents and response time.
- Russian restaurant AI implementation has less exact-match competition than clinics or real estate. KORA is therefore the strongest first vertical if real implementation details can be published.

## Target architecture

Use one page per search intent. Do not create thin location or keyword variants.

| Priority | Cluster | Planned canonical page | Proof asset |
|---|---|---|---|
| P0 | AI systems audit / AI-аудит процессов | `/services/ai-systems-audit` and `/ru/services/ai-audit-biznesa` | Audit method + anonymized sample map |
| P0 | AI automation for hospitality / ресторанов | `/industries/hospitality-ai-automation` and `/ru/industries/ai-avtomatizaciya-restoranov` | KORA Food Hall |
| P1 | AI automation for real estate | `/industries/real-estate-ai-automation` and `/ru/industries/ai-avtomatizaciya-nedvizhimosti` | ARHIDOM |
| P1 | AI automation for clinics | `/industries/clinic-ai-automation` and `/ru/industries/ai-avtomatizaciya-klinik` | ZubiLook + explicit non-clinical boundaries |
| P1 | AI workflow sprint / 7-day implementation | `/services/ai-systems-sprint` and `/ru/services/ai-systems-sprint` | Day-by-day sprint and deliverables |
| P2 | AI knowledge base / content operations | Dedicated EN/RU service pages after demand appears in GSC | Doki.help, PetID.care, Makeup.cafe |

Each money page needs: one buyer and workflow, before/after process, concrete deliverables, integrations, human-control rules, privacy boundary, timeline, price or qualification rule, project evidence, FAQ and one CTA.

## Execution roadmap

### 24-72 hours

1. Deploy the canonical, sitemap, hreflang, schema, OG and attribution fixes included with this document.
2. Submit the new sitemap in Google Search Console and request re-indexing for `/`, `/ru`, `/contact` and `/en/contact`.
3. Add and verify the site in Yandex Webmaster; submit the same sitemap.
4. Confirm `LEADS_*` production delivery and record one test lead with a non-sensitive `utm_source=seo_test` value.
5. Export the first GSC page/query/country/device baseline. Do not use personalized manual Google searches as rank evidence.

### Weeks 2-4

1. Publish the AI Audit and hospitality money pages in both languages.
2. Publish a KORA case page with real process details; omit unverified revenue or time-saved claims.
3. Create an anonymized AI Audit deliverable preview and restaurant workflow checklist as linkable assets.
4. Add contextual links from both homepages, the services area, proof cards and footer navigation.
5. Move Russian inner pages to `/ru/...` only with one-to-one permanent redirects, reciprocal hreflang and updated internal links.

### Weeks 5-8

1. Publish real-estate money pages and an ARHIDOM case page.
2. Publish clinic pages only after privacy/security boundaries and ZubiLook claims are approved.
3. Add two useful playbooks per live vertical, based on Search Console queries rather than a fixed blog quota.
4. Earn relevant links from owned project sites, partner profiles, founder profiles and genuine implementation mentions.

### Weeks 9-12

1. Refresh titles and introductions only where impressions exist but CTR or position is weak.
2. Expand the winning cluster with comparison, implementation and cost-intent pages.
3. Consolidate pages that compete for the same query instead of publishing more variants.
4. Review organic lead quality and sales outcomes before increasing content volume.

## Non-negotiable quality rules

- No fabricated case metrics, testimonials, certifications, addresses or client claims.
- No mass-generated city pages, doorway pages or near-duplicate RU/EN content.
- No FAQ or review schema for content that is not visible and verifiable on the page.
- No analytics scripts before the privacy policy and consent approach cover the actual tools used.
- No top-5 claim based on a single device, personalized result or one-day rank check.

## Sources of truth

- Rankings, impressions, clicks and indexing: Google Search Console; Yandex Webmaster for Russian coverage.
- Leads: production webhook/CRM or Telegram log with `sourcePath` and UTM parameters.
- Site health: production HTTP checks, Search Console indexing/CWV reports and deployment logs.
- Search architecture guidance: [Google canonical documentation](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [Google localized versions](https://developers.google.com/search/docs/advanced/crawling/localized-versions), [Google Organization schema](https://developers.google.com/search/docs/appearance/structured-data/organization), [Yandex localized pages](https://yandex.com/support/webmaster/en/yandex-indexing/locale-pages).
