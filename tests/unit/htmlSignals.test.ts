import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractHtmlSignals,
  hasContactPath,
  hasAboutLink,
  findServicePageLink,
  hasOrgLikeJsonLd,
} from "@/lib/visibility/checks/htmlSignals";

const SAMPLE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Other Bali — Villa Management</title>
  <link rel="canonical" href="https://otherbali.com/" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="index, follow" />
  <script type="application/ld+json">
    { "@context": "https://schema.org", "@type": "LocalBusiness", "name": "Other Bali", "areaServed": "Bali" }
  </script>
</head>
<body>
  <h1>Villa management in Bali</h1>
  <nav>
    <a href="/about">About</a>
    <a href="/services/villa-management">Services</a>
    <a href="/contact">Contact</a>
    <a href="mailto:hello@otherbali.com">Email us</a>
  </nav>
</body>
</html>
`;

test("extractHtmlSignals reads title, single h1, canonical, viewport and robots", () => {
  const signals = extractHtmlSignals(SAMPLE_HTML);
  assert.equal(signals.title, "Other Bali — Villa Management");
  assert.equal(signals.h1Count, 1);
  assert.equal(signals.h1Text, "Villa management in Bali");
  assert.equal(signals.canonicalUrl, "https://otherbali.com/");
  assert.equal(signals.hasViewportMeta, true);
  assert.equal(signals.metaRobots, "index, follow");
});

test("extractHtmlSignals parses valid JSON-LD and reports zero parse errors", () => {
  const signals = extractHtmlSignals(SAMPLE_HTML);
  assert.equal(signals.jsonLdBlocks.length, 1);
  assert.equal(signals.jsonLdParseErrors, 0);
});

test("extractHtmlSignals counts malformed JSON-LD as a parse error, not a silent skip", () => {
  const broken = `<script type="application/ld+json">{ not valid json </script>`;
  const signals = extractHtmlSignals(broken);
  assert.equal(signals.jsonLdBlocks.length, 0);
  assert.equal(signals.jsonLdParseErrors, 1);
});

test("extractHtmlSignals flags multiple H1s instead of picking one silently", () => {
  const signals = extractHtmlSignals("<h1>First</h1><h1>Second</h1>");
  assert.equal(signals.h1Count, 2);
});

test("hasContactPath detects mailto/tel/whatsapp/contact-page links", () => {
  const signals = extractHtmlSignals(SAMPLE_HTML);
  assert.equal(hasContactPath(signals), true);
  assert.equal(hasContactPath(extractHtmlSignals("<a href='/pricing'>Pricing</a>")), false);
});

test("hasAboutLink and findServicePageLink detect the right hrefs", () => {
  const signals = extractHtmlSignals(SAMPLE_HTML);
  assert.equal(hasAboutLink(signals), true);
  assert.equal(findServicePageLink(signals), "/services/villa-management");
});

test("hasOrgLikeJsonLd recognizes LocalBusiness/Organization/Product/Service types", () => {
  const signals = extractHtmlSignals(SAMPLE_HTML);
  assert.equal(hasOrgLikeJsonLd(signals), true);

  const noOrg = extractHtmlSignals(
    `<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[]}</script>`,
  );
  assert.equal(hasOrgLikeJsonLd(noOrg), false);
});

test("hasOrgLikeJsonLd looks inside @graph arrays", () => {
  const withGraph = extractHtmlSignals(
    `<script type="application/ld+json">{"@graph":[{"@type":"WebSite"},{"@type":"Organization","name":"Example"}]}</script>`,
  );
  assert.equal(hasOrgLikeJsonLd(withGraph), true);
});
