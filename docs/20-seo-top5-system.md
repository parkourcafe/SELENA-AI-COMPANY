# Selena Systems SEO Top-5 System

Status: active roadmap
Baseline date: 2026-07-18
Market assumption: English global + Russian-speaking global/CIS; Google first, Yandex second for Russian demand.

## What top 5 means

The objective is not an unverifiable promise to rank the homepage for a broad phrase such as "AI automation". Success means that approved high-intent query clusters have a Selena Systems page in positions 1-5 and produce qualified AI Audit leads.

North-star metric: count of priority commercial query clusters whose best canonical URL has a trailing 28-day average position of 5 or better, with qualified organic leads as the business guardrail.

## Baseline

| Area | Current state | Decision |
|---|---|---|
| Production | `https://www.selenasystems.com` returns 200; apex redirects to `www` | Keep `www` canonical |
| Index discovery | Search sampling finds the English homepage; full coverage is not available in this session | Use verified Google Search Console as source of truth |
| Languages | English exists at `/` and `/en`; Russian home is `/ru` while older Russian pages use root URLs | Redirect `/en` to `/`; migrate Russian pages under `/ru` later with one-to-one redirects |
| Metadata | Canonicals and some RU/EN alternates exist | Add `x-default`; use reciprocal alternates only for true translations |
| Sitemap | Valid, but included `/en` and assigned one generated `lastmod` to every URL | Keep canonical URLs and omit inaccurate `lastmod` |
| Structured data | No homepage JSON-LD | Add truthful Organization, WebSite and Service data |
| Social metadata | Large Twitter card declared without an image | Use existing Selena Systems process media |
| Measurement | Google verification exists; no GSC export, Yandex verification or privacy-approved analytics in the repo | Establish a 14-day baseline before numeric traffic targets |
| Lead attribution | Backend records only the pathname | Preserve query parameters so UTM attribution reaches Telegram/webhook |

## SERP findings

The broad category is crowded and visually repetitive. Stronger pages narrow the buyer, workflow and outcome.

- Generalists such as [Qrousel](https://qrousel.com/), [NexusAI Solution](https://nexusaisolution.co.uk/) and [Axe Automation](https://www.axeautomation.co/) combine an audit, fixed process, security language and operational proof.
- Hospitality leaders such as [Leo Hospitality](https://www.getleo.net/) and [ServeOS](https://serveos.ai/) describe connected restaurant operations rather than generic AI tools.
- Clinic pages such as [HelloHealthAI](https://www.hellohealthai.com/) and [Neyrix Dental](https://neyrix.ru/dental) focus on missed calls, booking, no-shows, escalation and privacy.
- Real-estate pages such as [Prathos](https://www.prathos.com/real-estate), [Daiyn Solutions](https://daiynsolutions.com/industries/real-estate) and [Hildi Consulting](https://hildiconsulting.com/ru/cases/crm-sales-pipeline-automation-real-estate) focus on lead routing, CRM, documents and response time.
- Russian restaurant AI implementation has less exact-match competition than clinics or real estate. KORA is the strongest first vertical if real implementation details can be published.

## Target architecture

| Priority | Cluster | Planned canonical pages | Proof |
|---|---|---|---|
| P0 | AI systems audit / AI-аудит процессов | `/services/ai-systems-audit`; `/ru/services/ai-audit-biznesa` | Audit method + anonymized sample map |
| P0 | Hospitality / рестораны | `/industries/hospitality-ai-automation`; `/ru/industries/ai-avtomatizaciya-restoranov` | KORA Food Hall |
| P1 | Real estate | `/industries/real-estate-ai-automation`; `/ru/industries/ai-avtomatizaciya-nedvizhimosti` | ARHIDOM |
| P1 | Clinics | `/industries/clinic-ai-automation`; `/ru/industries/ai-avtomatizaciya-klinik` | ZubiLook + approved privacy boundaries |
| P1 | 7-day sprint | `/services/ai-systems-sprint`; `/ru/services/ai-systems-sprint` | Day-by-day deliverables |

Each money page needs one buyer and workflow, before/after process, deliverables, integrations, human-control rules, privacy boundary, timeline, price or qualification rule, project evidence, FAQ and one CTA.

## Execution roadmap

### 24-72 hours

1. Deploy the canonical, sitemap, hreflang, schema, OG and attribution fixes included with this document.
2. Submit the sitemap in Google Search Console and request re-indexing for `/`, `/ru`, `/contact` and `/en/contact`.
3. Add and verify the site in Yandex Webmaster; submit the sitemap.
4. Confirm `LEADS_*` production delivery with one non-sensitive `utm_source=seo_test` lead.
5. Export the first GSC page/query/country/device baseline. Do not use personalized searches as rank evidence.

### Weeks 2-4

1. Publish bilingual AI Audit and hospitality money pages.
2. Publish a KORA case with real process details and no unverified performance claims.
3. Create an anonymized Audit preview and restaurant workflow checklist.
4. Add contextual links from both homes, services, proof cards and footer navigation.
5. Move Russian pages to `/ru/...` only with permanent redirects and updated internal links.

### Weeks 5-8

1. Publish real-estate pages and an ARHIDOM case.
2. Publish clinic pages only after privacy/security boundaries and ZubiLook claims are approved.
3. Add two useful playbooks per live vertical based on GSC query evidence.
4. Earn relevant links from owned project sites, partners, founder profiles and real implementation mentions.

### Weeks 9-12

1. Refresh pages where impressions exist but CTR or position is weak.
2. Expand the winning cluster with comparison, implementation and cost-intent pages.
3. Consolidate pages that compete for the same query.
4. Review organic lead quality before increasing content volume.

## Quality rules

- No fabricated metrics, testimonials, certifications, addresses or client claims.
- No mass-generated city pages, doorway pages or near-duplicate RU/EN content.
- No schema for content that is not visible and verifiable.
- No analytics scripts before privacy and consent cover the actual tools.
- No top-5 claim based on a screenshot or one-day rank check.

## Sources of truth

- Rankings, clicks and indexation: Google Search Console; Yandex Webmaster for Russian coverage.
- Leads: production webhook/CRM or Telegram log with `sourcePath` and UTM parameters.
- Health: production HTTP checks, Search Console CWV/indexing and deployment logs.
- Guidance: [Google canonical docs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [Google localized versions](https://developers.google.com/search/docs/advanced/crawling/localized-versions), [Google Organization schema](https://developers.google.com/search/docs/appearance/structured-data/organization), [Yandex localized pages](https://yandex.com/support/webmaster/en/yandex-indexing/locale-pages).
