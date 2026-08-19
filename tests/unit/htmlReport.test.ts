import assert from "node:assert/strict";
import test from "node:test";
import { buildAuditHtmlDocument } from "../../lib/visibility/readiness/htmlReport";
import type { AgentReadinessResult } from "../../lib/visibility/readiness/agentReadiness";

function fixtureReadiness(): AgentReadinessResult {
  const base = {
    checkedTarget: "robots.txt",
    explanation: "Machines read this first.",
    impact: "high",
    methodologyVersion: "selena-agent-readiness-2026-08-18-v2",
    capturedAt: "2026-08-18T00:00:00.000Z",
    references: [] as const,
  };
  return {
    registryVersion: "selena-agent-readiness-2026-08-18-v2",
    profile: "all_checks",
    profileEvidence: "Profile: all checks.",
    platform: { platform: "unknown", confidence: "low", evidence: [] },
    score: 62,
    categories: [
      {
        id: "discoverability",
        label: "Discoverability",
        score: 62,
        applicableChecks: 2,
        passedChecks: 1,
        warningChecks: 0,
        failedChecks: 1,
        notApplicableChecks: 0,
        unknownChecks: 0,
      },
    ],
    checks: [
      {
        ...base,
        checkId: "CF-01",
        title: "Robots allows <script>alert(1)</script> crawlers",
        category: "discoverability",
        status: "failed",
        evidence: ['robots.txt contains "<img onerror=x>"'],
        fix: { summary: "Allow crawlers", steps: ["Edit robots.txt"], codeBlocks: ["User-agent: *\nAllow: /"] },
        verification: ["Re-run the free check"],
        doesNotProve: ["Does not prove AI mentions the brand"],
        weight: 3,
        diagnosticOnly: false,
      },
      {
        ...base,
        checkId: "CF-02",
        title: "Sitemap present",
        category: "discoverability",
        status: "passed",
        evidence: ["sitemap.xml responds 200"],
        fix: { summary: "", steps: [], codeBlocks: [] },
        verification: [],
        doesNotProve: [],
        weight: 2,
        diagnosticOnly: false,
      },
    ],
  } as unknown as AgentReadinessResult;
}

test("the downloadable audit escapes crawled markup and never executes it", () => {
  const html = buildAuditHtmlDocument({
    readiness: fixtureReadiness(),
    locale: "en",
    siteUrl: "https://example.com",
    checkedAt: "18.08.2026",
    mode: "full",
  });
  assert.ok(!html.includes("<script>alert(1)</script>"), "raw script must never survive");
  assert.ok(!html.includes("<img onerror"), "raw attribute injection must never survive");
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), "escaped title must remain visible");
});

test("full mode carries every check while fixes mode keeps only actionable ones", () => {
  const readiness = fixtureReadiness();
  const shared = { readiness, siteUrl: "https://example.com", checkedAt: "18.08.2026" } as const;
  const full = buildAuditHtmlDocument({ ...shared, locale: "en", mode: "full" });
  const fixes = buildAuditHtmlDocument({ ...shared, locale: "en", mode: "fixes" });
  assert.ok(full.includes("CF-01") && full.includes("CF-02"));
  assert.ok(full.includes("62/100"), "full report must show the score");
  assert.ok(fixes.includes("CF-01"), "failed check belongs to the fix plan");
  assert.ok(!fixes.includes("CF-02"), "passed check does not belong to the fix plan");
});

test("both locales produce a complete standalone document with the honesty boundary", () => {
  const readiness = fixtureReadiness();
  for (const locale of ["en", "ru"] as const) {
    const html = buildAuditHtmlDocument({
      readiness,
      locale,
      siteUrl: "https://example.com",
      checkedAt: "18.08.2026",
      mode: "full",
    });
    assert.ok(html.startsWith("<!doctype html>"));
    assert.ok(html.includes(`<html lang="${locale}"`));
    assert.match(html, /not observed AI visibility|не наблюдаемая AI-видимость/);
  }
});
