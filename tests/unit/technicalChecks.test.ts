import { test } from "node:test";
import assert from "node:assert/strict";
import { runTechnicalChecks, type PageFetchForChecks } from "@/lib/visibility/checks/technicalChecks";

const GOOD_HTML = `
<html><head>
<title>Example — Villas</title>
<link rel="canonical" href="https://example.com/" />
<meta name="viewport" content="width=device-width" />
<script type="application/ld+json">{"@type":"LocalBusiness","name":"Example"}</script>
</head><body>
<h1>Villas in Bali</h1>
<a href="/contact">Contact</a>
<a href="/about">About</a>
<a href="/services">Services</a>
</body></html>`;

function page(overrides: Partial<PageFetchForChecks> = {}): PageFetchForChecks {
  return {
    requestedUrl: "https://example.com/",
    finalUrl: "https://example.com/",
    statusCode: 200,
    headers: {},
    html: GOOD_HTML,
    ...overrides,
  };
}

test("runTechnicalChecks passes a well-formed page", () => {
  const results = runTechnicalChecks(page(), { sitemapFound: true });
  const byId = new Map(results.map((r) => [r.ruleId, r]));
  assert.equal(byId.get("access.fetchable")?.state, "pass");
  assert.equal(byId.get("access.noindex")?.state, "pass");
  assert.equal(byId.get("access.canonical")?.state, "pass");
  assert.equal(byId.get("access.viewport")?.state, "pass");
  assert.equal(byId.get("identity.jsonld_valid")?.state, "pass");
  assert.equal(byId.get("identity.jsonld_entity_present")?.state, "pass");
  assert.equal(byId.get("offer.title_present")?.state, "pass");
  assert.equal(byId.get("offer.single_h1")?.state, "pass");
  assert.equal(byId.get("offer.service_page_discovered")?.state, "pass");
  assert.equal(byId.get("conversion.contact_path_present")?.state, "pass");
  assert.equal(byId.get("conversion.about_page_discovered")?.state, "pass");
});

test("runTechnicalChecks fails noindex when meta robots or X-Robots-Tag say so", () => {
  const withMetaNoindex = page({ html: GOOD_HTML.replace("<head>", '<head><meta name="robots" content="noindex" />') });
  const results = runTechnicalChecks(withMetaNoindex, { sitemapFound: true });
  assert.equal(results.find((r) => r.ruleId === "access.noindex")?.state, "fail");

  const withHeaderNoindex = page({ headers: { "x-robots-tag": "noindex" } });
  const results2 = runTechnicalChecks(withHeaderNoindex, { sitemapFound: true });
  assert.equal(results2.find((r) => r.ruleId === "access.noindex")?.state, "fail");
});

test("runTechnicalChecks marks everything not_measured when there is no HTML, not a fake fail", () => {
  const results = runTechnicalChecks(
    page({ html: null, statusCode: 0, fetchError: "FETCH_TIMEOUT" }),
    { sitemapFound: false },
  );
  const byId = new Map(results.map((r) => [r.ruleId, r]));
  assert.equal(byId.get("access.fetchable")?.state, "fail");
  assert.equal(byId.get("offer.title_present")?.state, "not_measured");
  assert.equal(byId.get("identity.jsonld_valid")?.state, "not_measured");
  assert.equal(byId.get("conversion.contact_path_present")?.state, "not_measured");
});

test("runTechnicalChecks flags zero and multiple H1s distinctly from exactly one", () => {
  const zeroH1 = page({ html: GOOD_HTML.replace("<h1>Villas in Bali</h1>", "") });
  assert.equal(runTechnicalChecks(zeroH1, { sitemapFound: true }).find((r) => r.ruleId === "offer.single_h1")?.state, "fail");

  const twoH1 = page({ html: GOOD_HTML.replace("<h1>Villas in Bali</h1>", "<h1>A</h1><h1>B</h1>") });
  assert.equal(runTechnicalChecks(twoH1, { sitemapFound: true }).find((r) => r.ruleId === "offer.single_h1")?.state, "warn");
});

test("runTechnicalChecks fails contact-path when no contact signal exists", () => {
  const noContact = page({ html: "<html><head><title>x</title></head><body><h1>x</h1></body></html>" });
  const results = runTechnicalChecks(noContact, { sitemapFound: false });
  assert.equal(results.find((r) => r.ruleId === "conversion.contact_path_present")?.state, "fail");
});
