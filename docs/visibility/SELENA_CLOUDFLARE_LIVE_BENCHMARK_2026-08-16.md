# Selena / Cloudflare live benchmark record

**Captured:** 16 August 2026, Asia/Makassar
**Target:** `https://www.selenasystems.com`
**Cloudflare checker:** `https://isitagentready.com`
**Record:** `data/visibility/cloudflare-selena-live-benchmark-2026-08-16.json`

## Method

The same public URL was submitted to the current public Cloudflare Agent
Readiness checker and to Selena's canonical `/check` flow. This was a
read-only browser run. It did not change the public site, DNS, payment state,
or provider configuration. Selena reported `paidProviderCalls = 0`.

Cloudflare returned an overall score of `21/100` (`Basic Web Presence`):
Discoverability `2/4`, Content `0/1`, Bot Access Control `1/2`, API/Auth/MCP/
Skill Discovery `0/7`, and Commerce `Not checked`. Selena returned a separate
Public Readiness score of `36/100`, with `100%` evidence coverage and three
pages read. These scores are not combined: the denominators and weighting
models are different.

## Release-gate comparison

All applicable Cloudflare checks observed in the live result have a Selena
rule mapping in `CF-D01…CF-D04`, `CF-C01`, `CF-B01…CF-B03` and
`CF-P01…CF-P08`. Selena's result exposes the target/evidence, rule identifier
and version, concrete fix and verification path for these findings. Selena
also retains additional protocol, commerce, safety, multilingual and
entity/citability checks beyond the Cloudflare surface.

The live comparison therefore passes the release gate:

- unmapped Cloudflare checks: `0`;
- applicable Selena evidence gaps: `0`;
- Selena fix/verification gaps: `0`;
- false `Not applicable` findings: `0`.

This record does not claim that Selena's numeric score is a Cloudflare score,
or that either score proves observed AI visibility. It records coverage and
evidence parity for the public benchmark run only. The controlled fixture
matrix remains a separate reproducible contract and still correctly states
that it does not call Cloudflare.
