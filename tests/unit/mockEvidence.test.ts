import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMockVisibilityReport, toFullJson, toSummaryJson } from "@/lib/diagnostics/mockEvidence";
import type { MockRunPayload } from "@/lib/diagnostics/mockRun";

function payload(overrides: Partial<MockRunPayload> = {}): MockRunPayload {
  return {
    v: 1,
    diagnosticType: "visibility",
    website: "https://example.com/",
    registrableDomain: "example.com",
    brandName: "Example",
    market: "Indonesia / Bali",
    language: "en",
    category: "villa management",
    competitor: null,
    createdAt: "2026-07-30T00:00:00.000Z",
    ...overrides,
  };
}

test("buildMockVisibilityReport is deterministic for the same input", () => {
  const a = buildMockVisibilityReport(payload(), "2026-07-30T00:00:00.000Z");
  const b = buildMockVisibilityReport(payload(), "2026-07-30T00:00:00.000Z");
  assert.equal(a.publicReadiness, b.publicReadiness);
  assert.equal(a.entityClarity, b.entityClarity);
  assert.equal(a.aiMentioned, b.aiMentioned);
  assert.deepEqual(a.issues, b.issues);
});

test("buildMockVisibilityReport varies by domain", () => {
  const a = buildMockVisibilityReport(payload({ registrableDomain: "example.com" }), "2026-07-30T00:00:00.000Z");
  const b = buildMockVisibilityReport(payload({ registrableDomain: "another-example.com" }), "2026-07-30T00:00:00.000Z");
  assert.notDeepEqual(
    [a.publicReadiness, a.entityClarity, a.aiMentioned],
    [b.publicReadiness, b.entityClarity, b.aiMentioned],
  );
});

test("buildMockVisibilityReport never claims HIGH confidence for a single run", () => {
  for (let i = 0; i < 20; i += 1) {
    const report = buildMockVisibilityReport(payload({ registrableDomain: `site-${i}.example` }), "2026-07-30T00:00:00.000Z");
    assert.notEqual(report.confidence, "high");
  }
});

test("buildMockVisibilityReport selects issue copy matching the submitted language", () => {
  const en = buildMockVisibilityReport(payload({ language: "en" }), "2026-07-30T00:00:00.000Z");
  const ru = buildMockVisibilityReport(payload({ language: "ru" }), "2026-07-30T00:00:00.000Z");
  assert.ok(en.issues.every((issue) => /[A-Za-z]/.test(issue.title)));
  assert.ok(ru.issues.some((issue) => /[А-Яа-яЁё]/.test(issue.title)));
});

test("toSummaryJson never leaks full issue evidence, toFullJson includes it", () => {
  const report = buildMockVisibilityReport(payload(), "2026-07-30T00:00:00.000Z");
  const summary = toSummaryJson(report);
  const full = toFullJson(report);

  assert.ok(!("issues" in summary));
  assert.ok(summary.topIssues.every((issue) => !("whatWeFound" in issue)));
  assert.equal(full.issues.length, report.issues.length);
  assert.ok(full.issues[0].whatWeFound.length > 0);
});
