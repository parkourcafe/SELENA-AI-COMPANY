# SEO Control Cadence

The machine-readable scorecard is stored in `data/seo-control.json`. This page defines how to use it without turning SEO into a daily list of disconnected tasks.

## Daily control (10 minutes)

1. Confirm 200 responses for `/`, `/ru`, `/contact`, `/en/contact`, `/robots.txt`, `/sitemap.xml` and the Google verification file.
2. Confirm `/en` permanently redirects to `/` and the apex domain redirects to `www` without a chain.
3. Review Search Console critical alerts, manual actions and sudden indexing losses. Do not react to normal daily position noise.
4. Review failed lead-delivery logs. A visible form with a broken destination is a production incident.
5. Record deployments or URL changes that could explain movement in search data.

## Weekly review (45 minutes)

Use trailing 28 days versus the previous 28 days. Split branded and non-branded queries.

1. Export GSC by query, page, country and device.
2. Update the three primary KPIs: top-5 priority clusters, non-brand organic clicks and qualified organic leads.
3. Review driver metrics: valid indexed money pages, top-20 clusters, impressions, CTR and pages with query cannibalization.
4. Review guardrails: lead quality, failed leads, excluded canonical URLs, Core Web Vitals and uptime.
5. Choose one action only: improve an existing money page, publish the next approved page, fix indexation, or earn proof/links.

## Monthly decision rules

- High impressions + position 6-15: strengthen intent match, proof, internal links and title; do not publish a duplicate page.
- Position 1-10 + low CTR: test title/description and validate that the query is commercially relevant.
- Clicks + no qualified leads: fix offer, proof, CTA and form path before adding traffic content.
- Page not indexed after two clean crawl cycles: inspect canonical, rendering, internal links, duplication and quality.
- No impressions after 6-8 weeks: reassess query demand and page intent; do not keep expanding the same assumption.
- One page ranking for unrelated clusters: split only when each new page can provide distinct, useful content and proof.

## Baseline requirement

Volume targets remain unset until at least 14 days of GSC and lead-attribution data are available. Position milestones can be used immediately, but top-5 success is evaluated on a trailing 28-day average, not a screenshot.
