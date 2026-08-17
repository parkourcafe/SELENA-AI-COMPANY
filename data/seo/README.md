# SEO route governance

`route-inventory.csv` is the maintained route contract for the public Selena
Systems site. It separates canonical indexable pages from legacy aliases and
technical endpoints. The sitemap is generated from `app/sitemap.ts`; a route
must not be added to the sitemap until its owner, parent product, canonical,
primary CTA and indexability decision are recorded here.

## Hreflang policy

- English public product pages use the bare canonical paths (`/visibility`,
  `/check`, `/pricing`, `/methodology`) and Russian counterparts under `/ru`.
- The company contact page is the documented exception: `/contact` is the
  Russian canonical and `/en/contact` is the English canonical.
- Legal pages follow the same explicit English/Russian pair.
- `x-default` points to the English page for paired routes and to `/` for the
  homepage.
- Alternates must be HTTPS, query-free, canonical URLs and must link back.

## Redirect policy

Legacy aliases are permanent redirects and are excluded from the sitemap.
`data/seo/redirect-exceptions.json` is reserved for a documented one-hop
redirect that remains temporarily necessary in a sitemap; it is intentionally
empty for the current release.
