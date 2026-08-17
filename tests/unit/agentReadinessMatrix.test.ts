import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { runLiveCheck, type LiveReport } from "@/lib/visibility/liveReport";
import {
  AGENT_READINESS_REGISTRY_VERSION,
  agentReadinessRuleRegistry,
  type AgentCheckId,
} from "@/lib/visibility/readiness/ruleRegistry";
import {
  serializeCodingAgentPrompt,
  serializeFixInstructions,
  serializeFullReadinessReport,
} from "@/lib/visibility/readiness/export";
import type { SiteProfile } from "@/lib/visibility/types";

type FixtureOptions = {
  standards?: "complete" | "broken" | "missing";
  commerce?: boolean;
  platform?: "wordpress" | "nextjs-vercel" | "cloudflare" | "netlify";
  canonicalMismatch?: boolean;
};

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve((server.address() as AddressInfo).port)));
}

function fixtureServer(options: FixtureOptions = {}): http.Server {
  const standards = options.standards ?? "complete";
  return http.createServer((req, res) => {
    const path = req.url?.split("?", 1)[0] ?? "/";
    const json = (value: unknown, headers: Record<string, string> = {}) => {
      res.writeHead(200, { "Content-Type": "application/json", ...headers });
      res.end(JSON.stringify(value));
    };
    if (path === "/robots.txt") {
      if (standards === "missing") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("not found");
      } else {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("User-agent: OAI-SearchBot\nAllow: /\nUser-agent: GPTBot\nAllow: /\nContent-Signal: ai-train=no, search=yes, ai-input=no\nSitemap: /sitemap.xml\n");
      }
      return;
    }
    if (path === "/sitemap.xml") {
      res.writeHead(standards === "missing" ? 404 : 200, { "Content-Type": "application/xml" });
      res.end(standards === "missing" ? "not found" : "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"><url><loc>https://example.com/</loc></url></urlset>");
      return;
    }
    if (path === "/llms.txt") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("# Example\nCanonical public documentation only.");
      return;
    }

    const completeProtocol: Record<string, unknown> = {
      "/.well-known/http-message-signatures-directory": { keys: [] },
      "/.well-known/api-catalog": { apis: [{ url: "/openapi.json" }] },
      "/.well-known/oauth-authorization-server": {
        issuer: "https://auth.example.com",
        authorization_endpoint: "https://auth.example.com/authorize",
        token_endpoint: "https://auth.example.com/token",
        client_secret: "sk-fixture-secret-must-be-redacted",
      },
      "/.well-known/oauth-protected-resource": { resource: "https://api.example.com", authorization_servers: ["https://auth.example.com"] },
      "/.well-known/mcp/server-card.json": { protocolVersion: "2026-v1", capabilities: { tools: {} }, endpoint: "/mcp" },
      "/.well-known/agent-card.json": { name: "Fixture agent", description: "Test", url: "https://example.com/a2a", skills: [] },
      "/.well-known/agent-skills/index.json": { skills: [{ name: "fixture", description: "Test" }] },
      "/openapi.json": options.commerce
        ? { openapi: "3.1.0", paths: { "/buy": { post: { "x-payment-info": { protocol: "mpp" } } } } }
        : { openapi: "3.1.0", paths: {} },
      "/.well-known/ucp": { protocol: "ucp", version: "1" },
      "/.well-known/acp.json": { protocol: { name: "acp", version: "1" }, api_base_url: "https://example.com/api" },
      "/.well-known/ap2.json": { protocol: "ap2", status: "experimental" },
    };
    if (path === "/auth.md") {
      res.writeHead(200, { "Content-Type": "text/markdown" });
      res.end("# Authentication\nOAuth scopes and token endpoint.");
      return;
    }
    if (path in completeProtocol) {
      if (standards === "missing") {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end("{}");
      } else if (standards === "broken") {
        json({});
      } else {
        json(completeProtocol[path]);
      }
      return;
    }
    if (path === "/about" || path === "/services" || path === "/contact") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<html><head><title>${path.slice(1)}</title><link rel="canonical" href="${path}" /></head><body><h1>${path.slice(1)}</h1><p>A complete public answer with verified scope for customers in Bali.</p></body></html>`);
      return;
    }
    if (path !== "/") {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("not found");
      return;
    }

    if ((req.headers.accept ?? "").includes("text/markdown")) {
      res.writeHead(standards === "missing" ? 200 : 200, { "Content-Type": standards === "missing" ? "text/html" : "text/markdown" });
      res.end(standards === "missing" ? "<p>No Markdown representation</p>" : "# Example business\nA complete public answer for customers in Bali.");
      return;
    }

    const platformHtml = options.platform === "wordpress"
      ? '<meta name="generator" content="WordPress 7"><link href="/wp-content/theme.css" rel="stylesheet">'
      : options.platform === "nextjs-vercel"
        ? '<script id="__NEXT_DATA__" type="application/json">{}</script><script src="/_next/app.js"></script>'
        : "";
    const platformHeaders = options.platform === "nextjs-vercel"
      ? { "X-Powered-By": "Next.js", "X-Vercel-Id": "fixture::1" }
      : options.platform === "cloudflare"
        ? { Server: "cloudflare", "CF-Ray": "fixture" }
        : options.platform === "netlify"
          ? { Server: "Netlify", "X-Nf-Request-Id": "fixture" }
          : {};
    const canonical = options.canonicalMismatch ? "/wrong-language-path" : "/";
    const commerce = options.commerce
      ? '<p>Buy now for $49. Add to cart and checkout.</p><script type="application/ld+json">{"@type":"Product","name":"Fixture","offers":{"@type":"Offer","price":"79"}}</script>'
      : '<script type="application/ld+json">{"@type":"Organization","name":"Example Business","url":"https://example.com"}</script>';
    res.writeHead(200, {
      "Content-Type": "text/html",
      Link: '</sitemap.xml>; rel="sitemap", </.well-known/api-catalog>; rel="service-desc"',
      ...(options.commerce ? { "X-Payment": "x402" } : {}),
      ...platformHeaders,
    });
    res.end(`<html lang="en"><head><title>Example Business in Bali</title><meta name="viewport" content="width=device-width"><link rel="canonical" href="${canonical}">${platformHtml}${commerce}</head><body><h1>Example Business in Bali</h1><p>Example Business provides a documented service for customers in Bali with a clear public scope.</p><a href="/services">Services</a><a href="/about">About</a><a href="/contact">Contact</a><button>Request service</button><script>navigator.modelContext?.registerTool({name:"public_fixture"})</script></body></html>`);
  });
}

async function scan(options: FixtureOptions, profile: SiteProfile): Promise<LiveReport> {
  const server = fixtureServer(options);
  const port = await listen(server);
  try {
    return await runLiveCheck({
      url: `http://127.0.0.1:${port}/`,
      primaryAction: "other",
      siteProfile: profile,
      locale: "en",
      unsafeAllowPrivateHostsForTesting: true,
    });
  } finally {
    server.close();
  }
}

function byId(report: LiveReport, id: AgentCheckId) {
  return report.readiness.agentReadiness.checks.find((item) => item.checkId === id);
}

test("the versioned registry contains the complete CF, Selena and Local AI check contract", () => {
  const expectedCf = [
    "CF-D01", "CF-D02", "CF-D03", "CF-D04", "CF-C01", "CF-B01", "CF-B02", "CF-B03",
    "CF-P01", "CF-P02", "CF-P03", "CF-P04", "CF-P05", "CF-P06", "CF-P07", "CF-P08",
    "CF-X01", "CF-X02", "CF-X03", "CF-X04", "CF-X05",
  ];
  const expectedSelena = Array.from({ length: 10 }, (_, index) => `SE-${String(index + 1).padStart(2, "0")}`);
  const expectedLocalAi = Array.from({ length: 9 }, (_, index) => `LA-0${index + 1}`);
  assert.deepEqual(
    agentReadinessRuleRegistry.map((item) => item.id),
    [...expectedCf, ...expectedSelena, ...expectedLocalAi],
  );
  assert.ok(agentReadinessRuleRegistry.every((item) => item.methodologyVersion === AGENT_READINESS_REGISTRY_VERSION));
  assert.equal(agentReadinessRuleRegistry.find((item) => item.id === "CF-X05")?.weight, 0);
  assert.equal(agentReadinessRuleRegistry.find((item) => item.id === "SE-09")?.weight, 0);
});

test("every Local AI rule is an unscored diagnostic with an Ask Maps boundary and no Google call", () => {
  const localAiRules = agentReadinessRuleRegistry.filter((rule) => rule.category === "local_ai_readiness");
  assert.equal(localAiRules.length, 9);
  for (const rule of localAiRules) {
    assert.equal(rule.weight, 0, `${rule.id} must carry zero weight`);
    assert.match(rule.collectionMethod, /; diagnostic only$/, `${rule.id} must be marked diagnostic only`);
    assert.match(rule.doesNotProve.en, /Ask Maps/, `${rule.id} EN boundary must name Ask Maps`);
    assert.match(rule.doesNotProve.ru, /Ask Maps/, `${rule.id} RU boundary must name Ask Maps`);
    assert.deepEqual(rule.applicableProfiles, ["all_checks", "content_site", "api_application", "commerce"]);
  }
});

test("fixture 1: a correct content site passes applicable public checks", async () => {
  const report = await scan({ standards: "complete" }, "content_site");
  assert.equal(byId(report, "CF-D01")?.status, "passed");
  assert.equal(byId(report, "CF-D02")?.status, "passed");
  assert.equal(byId(report, "CF-C01")?.status, "passed");
  assert.equal(byId(report, "CF-P01")?.status, "not_applicable");
  assert.equal(report.paidProviderCalls, 0);
});

test("fixture 2: missing robots, sitemap and Markdown are concrete failures", async () => {
  const report = await scan({ standards: "missing" }, "content_site");
  assert.equal(byId(report, "CF-D01")?.status, "failed");
  assert.equal(byId(report, "CF-D02")?.status, "failed");
  assert.equal(byId(report, "CF-C01")?.status, "failed");
});

test("fixture 3: API application validates OAuth, MCP, A2A, Skills and WebMCP separately", async () => {
  const report = await scan({ standards: "complete" }, "api_application");
  for (const id of ["CF-P01", "CF-P02", "CF-P03", "CF-P04", "CF-P05", "CF-P06", "CF-P07", "CF-P08"] as AgentCheckId[]) {
    assert.equal(byId(report, id)?.status, "passed", id);
  }
  assert.equal(byId(report, "CF-X01")?.status, "not_applicable");
});

test("fixture 4: malformed API metadata warns instead of creating false passes", async () => {
  const report = await scan({ standards: "broken" }, "api_application");
  for (const id of ["CF-P02", "CF-P03", "CF-P05", "CF-P06", "CF-P07"] as AgentCheckId[]) {
    assert.equal(byId(report, id)?.status, "warning", id);
  }
});

test("fixture 5: commerce protocol evidence is measured without starting a payment", async () => {
  const report = await scan({ standards: "complete", commerce: true }, "commerce");
  for (const id of ["CF-X01", "CF-X02", "CF-X03", "CF-X04", "CF-X05"] as AgentCheckId[]) {
    assert.equal(byId(report, id)?.status, "passed", id);
  }
  assert.equal(byId(report, "CF-X05")?.diagnosticOnly, true);
  assert.equal(report.paidProviderCalls, 0);
});

test("fixture 6: an ordinary non-commerce site receives N/A, not a score penalty", async () => {
  const report = await scan({ standards: "complete" }, "all_checks");
  for (const id of ["CF-X01", "CF-X02", "CF-X03", "CF-X04", "CF-X05", "SE-10"] as AgentCheckId[]) {
    assert.equal(byId(report, id)?.status, "not_applicable", id);
  }
  assert.ok(report.readiness.agentReadiness.categories.find((item) => item.id === "commerce")?.score === null);
});

for (const [number, platform, expected] of [
  [7, "wordpress", "wordpress"],
  [8, "nextjs-vercel", "nextjs"],
  [9, "cloudflare", "cloudflare"],
  [10, "netlify", "netlify"],
] as const) {
  test(`fixture ${number}: ${platform} receives a deterministic platform adapter`, async () => {
    const report = await scan({ standards: "complete", platform }, "content_site");
    assert.equal(report.readiness.agentReadiness.platform.platform, expected);
    assert.ok(report.readiness.agentReadiness.platform.confidence >= 0.7);
  });
}

test("fixture 11: every warning or failure has evidence, fix, verification and a boundary", async () => {
  const report = await scan({ standards: "missing" }, "all_checks");
  const actionable = report.readiness.agentReadiness.checks.filter((item) => item.status === "failed" || item.status === "warning");
  assert.ok(actionable.length > 0);
  for (const item of actionable) {
    assert.ok(item.evidence.length > 0, `${item.checkId} evidence`);
    assert.ok(item.fix.summary.length > 0, `${item.checkId} fix`);
    assert.ok(item.verification.length > 0, `${item.checkId} verification`);
    assert.ok(item.doesNotProve.length > 0, `${item.checkId} boundary`);
  }
});

test("fixture 12: multilingual canonical mismatch is not reported as a clean pass", async () => {
  const report = await scan({ standards: "complete", canonicalMismatch: true }, "content_site");
  assert.notEqual(byId(report, "SE-01")?.status, "passed");
});

test("Markdown exports and coding-agent prompt are complete and redact token-like evidence", async () => {
  const report = await scan({ standards: "complete" }, "api_application");
  const readiness = report.readiness.agentReadiness;
  for (const output of [
    serializeFixInstructions(readiness, "en"),
    serializeFullReadinessReport(readiness, "en"),
    serializeCodingAgentPrompt(readiness, "en"),
  ]) {
    assert.match(output, /Public Readiness/i);
    assert.ok(!output.includes("sk-fixture-secret-must-be-redacted"));
    assert.ok(!output.includes("client_secret\":\"sk-"));
  }
  assert.match(serializeCodingAgentPrompt(readiness, "en"), /Do not read or expose secrets/);
});
