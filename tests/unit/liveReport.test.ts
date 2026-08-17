import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { runLiveCheck } from "@/lib/visibility/liveReport";
import { getRecommendation, getPassedTitle, sortBySeverity } from "@/lib/visibility/checks/recommendations";
import { PRIMARY_ACTIONS } from "@/lib/visibility/measurement";

/**
 * End-to-end tests for the free check against a real HTTP server.
 *
 * These deliberately use a live socket rather than a mocked fetch: the
 * thing under test is whether we can read a site as it actually is, and a
 * stubbed response would prove only that our stub matches our parser.
 */

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve((server.address() as AddressInfo).port));
  });
}

/** A site that gets most things right, so passes and failures both appear. */
function goodSite() {
  return http.createServer((req, res) => {
    const url = req.url ?? "/";
    if (url === "/robots.txt") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n");
      return;
    }
    if (url === "/sitemap.xml") {
      res.writeHead(200, { "Content-Type": "application/xml" });
      res.end("<urlset></urlset>");
      return;
    }
    if (url === "/about" || url === "/services") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<html><head><title>${url}</title></head><body><h1>${url}</h1></body></html>`);
      return;
    }
    if (url !== "/") {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<html><body>Not found</body></html>");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      `<html><head>
        <title>Example Spa — massage in Canggu</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="/" />
        <script type="application/ld+json">{"@type":"LocalBusiness","name":"Example Spa"}</script>
      </head><body>
        <h1>Example Spa</h1>
        <a href="/about">About</a>
        <a href="/services">Services</a>
        <a href="/contact">Contact</a>
        <a href="https://wa.me/6281234567890">WhatsApp us</a>
      </body></html>`,
    );
  });
}

/** A site that is reachable but tells machines to go away. */
function blockedSite() {
  return http.createServer((req, res) => {
    if (req.url !== "/") {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html", "X-Robots-Tag": "noindex" });
    res.end("<html><head></head><body><p>hello</p></body></html>");
  });
}

async function withServer<T>(server: http.Server, fn: (baseUrl: string) => Promise<T>): Promise<T> {
  const port = await listen(server);
  try {
    return await fn(`http://127.0.0.1:${port}/`);
  } finally {
    server.close();
  }
}

test("the free check returns Public Readiness only and makes zero paid provider calls", async () => {
  await withServer(goodSite(), async (baseUrl) => {
    const report = await runLiveCheck({
      url: baseUrl,
      primaryAction: "whatsapp",
      locale: "en",
      unsafeAllowPrivateHostsForTesting: true,
    });

    assert.equal(report.reachable, true);
    assert.equal(report.kind, "public_readiness");
    assert.equal(report.paidProviderCalls, 0);
    assert.deepEqual(
      report.layers.map((l) => l.id),
      ["discoverability", "understanding", "action_readiness"],
    );
    assert.equal(report.readiness.components.length, 9);
    assert.equal(report.readiness.components.find((item) => item.id === "llms_txt")?.weight, 0);
    assert.match(report.visibilityClaim, /not observed AI visibility/i);
    assert.ok(!JSON.stringify(report).includes("recommendation_evidence"));
  });
});

test("the check reads the submitted site, not a stored sample", async () => {
  await withServer(goodSite(), async (baseUrl) => {
    const report = await runLiveCheck({
      url: baseUrl,
      primaryAction: "whatsapp",
      locale: "en",
      unsafeAllowPrivateHostsForTesting: true,
    });

    assert.ok(report.finalUrl.startsWith(baseUrl.replace(/\/$/, "")), "must report the URL it read");
    assert.ok(report.pagesChecked.length > 1, "must read more than the homepage when links exist");
    assert.ok(
      report.pagesChecked.every((page) => page.status === 200),
      "only successfully fetched pages should be reported as read",
    );
    assert.ok(new Date(report.checkedAt).getTime() > 0, "the run must be dated");
    assert.ok(report.pagesChecked.length <= 5, "the free scope must never read more than five key pages");
    assert.ok(report.readiness.pages.every((page) => Boolean(page.capturedAt)), "page evidence must be dated");
    assert.ok(
      report.readiness.pages.filter((page) => page.status === 200).every((page) => Boolean(page.contentHash)),
      "successfully read pages need reproducible content hashes",
    );
  });
});

test("crawler access is evaluated per named user agent from robots evidence", async () => {
  const server = http.createServer((req, res) => {
    if (req.url === "/robots.txt") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n");
      return;
    }
    if (req.url !== "/") {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<html><head><title>Example</title></head><body><h1>Example</h1><p>A complete public answer for customers in Bali.</p></body></html>");
  });

  await withServer(server, async (baseUrl) => {
    const report = await runLiveCheck({
      url: baseUrl,
      primaryAction: "call",
      locale: "en",
      unsafeAllowPrivateHostsForTesting: true,
    });
    const gptBot = report.readiness.crawlerAccess.find((item) => item.userAgent === "GPTBot");
    const searchBot = report.readiness.crawlerAccess.find((item) => item.userAgent === "OAI-SearchBot");
    assert.equal(gptBot?.status, "blocked");
    assert.equal(gptBot?.matchedRule, "Disallow: /");
    assert.equal(searchBot?.status, "allowed");
    assert.ok(report.findings.some((finding) => finding.ruleId === "crawler.access"));
  });
});

test("block citability keeps page, selector, rule version and text evidence", async () => {
  await withServer(goodSite(), async (baseUrl) => {
    const report = await runLiveCheck({
      url: baseUrl,
      primaryAction: "whatsapp",
      locale: "en",
      unsafeAllowPrivateHostsForTesting: true,
    });
    assert.ok(report.readiness.blocks.length > 0);
    for (const block of report.readiness.blocks) {
      assert.ok(block.pageUrl.startsWith(baseUrl.replace(/\/$/, "")));
      assert.match(block.selectorOrPath, /^h[1-3]:nth-heading\(/);
      assert.ok(block.ruleResults.every((rule) => Boolean(rule.ruleVersion)));
      assert.ok(block.textSnapshot.length > 0);
    }
  });
});

test("readiness findings retain rule, evidence and fix provenance", async () => {
  await withServer(goodSite(), async (baseUrl) => {
    const report = await runLiveCheck({
      url: baseUrl,
      primaryAction: "whatsapp",
      locale: "en",
      unsafeAllowPrivateHostsForTesting: true,
    });
    assert.ok(report.readiness.findings.length > 0);
    for (const finding of report.readiness.findings) {
      assert.ok(finding.ruleId.length > 0);
      assert.ok(finding.ruleVersion.length > 0);
      assert.ok(finding.pageUrl.startsWith(baseUrl.replace(/\/$/, "")));
      assert.ok(finding.evidenceType.length > 0);
      assert.ok(finding.textEvidence || finding.htmlEvidence || Object.keys(finding.evidence).length > 0);
      assert.equal(finding.sourceEngine, "selena-public-readiness");
      assert.ok(finding.sourceVersion.length > 0);
      assert.ok(finding.capturedAt.length > 0);
      assert.equal(finding.generatedFixId, null);
      assert.equal(finding.verificationStatus, "not_requested");
    }
  });
});

test("publishing llms.txt cannot change the weighted Public Readiness score", async () => {
  function site(includeLlms: boolean) {
    return http.createServer((req, res) => {
      if (req.url === "/llms.txt" && includeLlms) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("# Example business\nPublic reference only.");
        return;
      }
      if (req.url === "/robots.txt") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("User-agent: *\nAllow: /\n");
        return;
      }
      if (req.url !== "/") {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html><head><title>Example in Bali</title><meta name=\"viewport\" content=\"width=device-width\"></head><body><h1>Example in Bali</h1><p>Example offers a documented service for businesses in Bali. Contact the team to request a confirmed scope.</p><a href=\"/contact\">Contact</a></body></html>");
    });
  }

  const withoutLlms = await withServer(site(false), (url) => runLiveCheck({
    url,
    primaryAction: "other",
    locale: "en",
    unsafeAllowPrivateHostsForTesting: true,
  }));
  const withLlms = await withServer(site(true), (url) => runLiveCheck({
    url,
    primaryAction: "other",
    locale: "en",
    unsafeAllowPrivateHostsForTesting: true,
  }));

  assert.equal(withoutLlms.readiness.score, withLlms.readiness.score);
  assert.equal(withoutLlms.readiness.components.find((item) => item.id === "llms_txt")?.score, 0);
  assert.equal(withLlms.readiness.components.find((item) => item.id === "llms_txt")?.score, 100);
  assert.equal(withLlms.readiness.components.find((item) => item.id === "llms_txt")?.weight, 0);
});

test("a site that blocks indexing produces a critical finding, not a silent pass", async () => {
  await withServer(blockedSite(), async (baseUrl) => {
    const report = await runLiveCheck({
      url: baseUrl,
      primaryAction: "call",
      locale: "en",
      unsafeAllowPrivateHostsForTesting: true,
    });

    const discoverability = report.layers.find((l) => l.id === "discoverability")!;
    const noindex = discoverability.findings.find((f) => f.ruleId === "access.noindex");
    assert.ok(noindex, "an X-Robots-Tag: noindex header must be reported");
    assert.equal(noindex?.severity, "critical");
    assert.ok(noindex?.action.length, "every finding must carry a concrete fix");

    assert.ok(report.topBlocker, "a site with critical problems must name the first thing to fix");
    assert.equal(report.topBlocker?.severity, "critical");
  });
});

test("a bot-protection block page is not scored as the owner's homepage", async () => {
  // A WAF or CDN block returns a perfectly parseable HTML body. Treating
  // "has HTML" as "reachable" would score the block page's markup and
  // report it back as findings about the customer's site.
  const server = http.createServer((_req, res) => {
    res.writeHead(403, { "Content-Type": "text/html" });
    res.end("<html><head><title>Access denied</title></head><body><h1>Blocked</h1></body></html>");
  });

  await withServer(server, async (baseUrl) => {
    const report = await runLiveCheck({
      url: baseUrl,
      primaryAction: "call",
      locale: "en",
      unsafeAllowPrivateHostsForTesting: true,
    });

    assert.equal(report.reachable, false, "a 403 body is not a reachable homepage");
    assert.match(report.fetchError ?? "", /403/, "the status must be reported");
    assert.deepEqual(report.pagesChecked, [], "a blocked page was not read");
    for (const layer of report.layers) {
      assert.equal(layer.measured, false, `${layer.id} must not be measured from a block page`);
      assert.equal(layer.score, null, `${layer.id} must carry no score`);
    }
  });
});

test("an unreachable site reports nothing rather than reporting zeros", async () => {
  // Port 1 on loopback: nothing is listening, so the connection is refused.
  const report = await runLiveCheck({
    url: "http://127.0.0.1:1/",
    primaryAction: "call",
    locale: "en",
    totalBudgetMs: 3_000,
    unsafeAllowPrivateHostsForTesting: true,
  });

  assert.equal(report.reachable, false);
  for (const layer of report.layers) {
    assert.equal(layer.measured, false, `${layer.id} must not claim a measurement`);
    assert.equal(layer.score, null, `${layer.id} must not report a score`);
    assert.ok(layer.notMeasuredReason, `${layer.id} must say why it was not measured`);
  }
});

test("human-ready never implies agent-executable", async () => {
  // The good site exposes a WhatsApp link — a person can act on it, and
  // nothing about it lets a machine complete or verify the action.
  await withServer(goodSite(), async (baseUrl) => {
    const report = await runLiveCheck({
      url: baseUrl,
      primaryAction: "whatsapp",
      locale: "en",
      unsafeAllowPrivateHostsForTesting: true,
    });

    const layer = report.layers.find((l) => l.id === "action_readiness")!;
    const passedHuman = layer.passed.some((title) => /customer|complete/i.test(title));
    const agentFinding = layer.findings.find((f) => f.ruleId === "action.agent_executable");

    assert.ok(passedHuman, "a reachable WhatsApp link should pass human readiness");
    assert.ok(agentFinding, "agent-executable must not be marked met by a contact link");
    assert.notEqual(agentFinding?.state, "pass");
  });
});

test("a Russian report contains no English evidence text", async () => {
  // The readiness detector runs server-side for a report that may be read
  // in either language, so it must return keys, not sentences.
  const englishLeak =
    /Structured data|No documented endpoint|A form is present|Generic contact|was found|does not describe/i;

  await withServer(goodSite(), async (baseUrl) => {
    const report = await runLiveCheck({
      url: baseUrl,
      primaryAction: "book",
      locale: "ru",
      unsafeAllowPrivateHostsForTesting: true,
    });

    for (const finding of report.findings) {
      assert.ok(
        !englishLeak.test(finding.detail),
        `${finding.ruleId} leaked English into a Russian report: ${finding.detail}`,
      );
    }
  });
});

test("Action Readiness is measured but deliberately carries no score", async () => {
  // Three independent states averaged into one number would invent a
  // precision the layer does not have — but "no score" is not "not measured".
  await withServer(goodSite(), async (baseUrl) => {
    const report = await runLiveCheck({
      url: baseUrl,
      primaryAction: "whatsapp",
      locale: "en",
      unsafeAllowPrivateHostsForTesting: true,
    });

    const layer = report.layers.find((l) => l.id === "action_readiness")!;
    assert.equal(layer.measured, true);
    assert.equal(layer.score, null);
    assert.equal(layer.notMeasuredReason, undefined, "a measured layer must not carry that reason");
  });
});

test("findings are ordered by cost to the owner, not by discovery order", async () => {
  await withServer(blockedSite(), async (baseUrl) => {
    const report = await runLiveCheck({
      url: baseUrl,
      primaryAction: "call",
      locale: "ru",
      unsafeAllowPrivateHostsForTesting: true,
    });

    const rank = { critical: 0, important: 1, later: 2 } as const;
    for (const layer of report.layers) {
      const order = layer.findings.map((f) => rank[f.severity]);
      assert.deepEqual(order, [...order].sort((a, b) => a - b), `${layer.id} findings must be sorted`);
    }
  });
});

test("every rule that can be reported has a fix and a passed phrasing in both locales", () => {
  const ruleIds = [
    "access.fetchable",
    "access.noindex",
    "access.canonical",
    "access.viewport",
    "access.sitemap_discovered",
    "identity.jsonld_valid",
    "identity.jsonld_entity_present",
    "identity.brand_name_consistent",
    "offer.title_present",
    "offer.single_h1",
    "offer.service_page_discovered",
    "conversion.contact_path_present",
    "conversion.about_page_discovered",
    "action.human_ready",
    "action.machine_readable",
    "action.agent_executable",
  ];

  for (const locale of ["en", "ru"] as const) {
    for (const ruleId of ruleIds) {
      const rec = getRecommendation(ruleId, locale);
      assert.ok(rec, `${locale} ${ruleId} needs a recommendation`);
      assert.ok(rec!.action.length > 0, `${locale} ${ruleId} needs a concrete action`);
      assert.ok(rec!.doesNotProve.length > 0, `${locale} ${ruleId} must state its limit`);
      assert.ok(getPassedTitle(ruleId, locale), `${locale} ${ruleId} needs a positive phrasing`);
    }
  }
});

test("a passed check is never described with its problem phrasing", () => {
  // Regression: "OK: No canonical URL is declared" shipped once because the
  // passed state reused the recommendation title.
  for (const locale of ["en", "ru"] as const) {
    const passed = getPassedTitle("access.canonical", locale)!;
    const problem = getRecommendation("access.canonical", locale)!.title;
    assert.notEqual(passed, problem);
    assert.ok(!/^No |^Не /i.test(passed), `${locale} passed title reads as a problem: ${passed}`);
  }
});

test("sortBySeverity is stable within a severity band", () => {
  const make = (ruleId: string, severity: "critical" | "important" | "later") => ({
    ruleId,
    state: "fail" as const,
    severity,
    title: ruleId,
    detail: "",
    action: "",
    doesNotProve: "",
  });
  const sorted = sortBySeverity([
    make("b", "important"),
    make("a", "critical"),
    make("c", "important"),
    make("d", "later"),
  ]);
  assert.deepEqual(
    sorted.map((f) => f.ruleId),
    ["a", "b", "c", "d"],
  );
});

test("every primary action the form offers is understood by the readiness detector", async () => {
  await withServer(goodSite(), async (baseUrl) => {
    for (const action of PRIMARY_ACTIONS) {
      const report = await runLiveCheck({
        url: baseUrl,
        primaryAction: action,
        locale: "en",
        unsafeAllowPrivateHostsForTesting: true,
      });
      const layer = report.layers.find((l) => l.id === "action_readiness")!;
      assert.equal(layer.measured, true, `${action} must be measurable`);
      assert.ok(
        layer.passed.length + layer.findings.length === 3,
        `${action} must report all three readiness states`,
      );
    }
  });
});
