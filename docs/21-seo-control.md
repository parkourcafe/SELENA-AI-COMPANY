# SEO Control Cadence

The machine-readable scorecard is `data/seo-control.json`.

## Daily control (10 minutes)

1. Confirm 200 for `/`, `/ru`, `/contact`, `/en/contact`, `/robots.txt`, `/sitemap.xml` and the Google verification file.
2. Confirm `/en` redirects permanently to `/` and apex redirects to `www` without a chain.
3. Review Search Console critical alerts, manual actions and sudden indexing losses; ignore normal daily rank noise.
4. Review failed lead-delivery logs. A working-looking form with a broken destination is an incident.
5. Record deployments or URL changes that can explain movement.

## Weekly review (45 minutes)

Use trailing 28 days versus the previous 28 days and split branded from non-branded queries.

1. Export GSC by query, page, country and device.
2. Update top-5 priority clusters, non-brand organic clicks and qualified organic leads.
3. Review indexed money pages, top-20 clusters, impressions, CTR and cannibalization.
4. Review lead quality, delivery failures, excluded canonicals, CWV and uptime.
5. Choose one action: improve a money page, publish the next approved page, fix indexation, or earn proof/links.

## Monthly decision rules

- High impressions + position 6-15: strengthen intent match, proof, internal links and title; do not publish a duplicate.
- Position 1-10 + low CTR: test title/description and confirm commercial relevance.
- Clicks + no qualified leads: fix offer, proof, CTA and form before adding traffic content.
- Not indexed after two clean crawl cycles: inspect canonical, rendering, internal links, duplication and quality.
- No impressions after 6-8 weeks: reassess demand and intent.
- Split a page only when each new page can provide distinct useful content and proof.

Volume targets remain unset until at least 14 days of GSC and lead-attribution data exist. Top-5 success uses a trailing 28-day average, not a screenshot.
