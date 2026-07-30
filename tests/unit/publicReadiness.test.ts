import { test } from "node:test";
import assert from "node:assert/strict";
import { computePublicReadiness } from "@/lib/visibility/scoring/publicReadiness";
import scoringConfig from "@/data/visibility/scoring.v1.json";
import type { CheckResult } from "@/lib/visibility/checks/technicalChecks";

function allPassChecks(): CheckResult[] {
  return scoringConfig.publicReadiness.rules.map((rule) => ({
    ruleId: rule.id,
    dimension: rule.dimension as CheckResult["dimension"],
    state: "pass",
    evidence: {},
  }));
}

test("computePublicReadiness scores 100 with full coverage when every rule passes", () => {
  const result = computePublicReadiness(allPassChecks());
  assert.equal(result.score, 100);
  assert.equal(result.coverage, 1);
  assert.equal(result.lowConfidence, false);
});

test("computePublicReadiness returns 0/0 coverage rather than crashing on no checks", () => {
  const result = computePublicReadiness([]);
  assert.equal(result.score, 0);
  assert.equal(result.coverage, 0);
  assert.equal(result.lowConfidence, true);
});

test("computePublicReadiness excludes not_measured rules from the denominator instead of counting them as failing", () => {
  const onlyOneMeasured: CheckResult[] = [
    { ruleId: "access.fetchable", dimension: "access", state: "pass", evidence: {} },
  ];
  const result = computePublicReadiness(onlyOneMeasured);
  // Only rule measured passed fully -> score should be 100, not dragged
  // down by the other 92 points of unweighted-but-unmeasured rules.
  assert.equal(result.score, 100);
  assert.ok(result.coverage < 0.1, "coverage should reflect the small measured fraction");
  assert.equal(result.lowConfidence, true);
});

test("computePublicReadiness averages warn as half credit", () => {
  const checks: CheckResult[] = [
    { ruleId: "access.fetchable", dimension: "access", state: "warn", evidence: {} },
  ];
  const result = computePublicReadiness(checks);
  assert.equal(result.score, 50);
});

test("computePublicReadiness computes per-dimension scores independently", () => {
  const checks: CheckResult[] = [
    { ruleId: "access.fetchable", dimension: "access", state: "pass", evidence: {} },
    { ruleId: "access.noindex", dimension: "access", state: "fail", evidence: {} },
    { ruleId: "identity.jsonld_valid", dimension: "identity", state: "pass", evidence: {} },
  ];
  const result = computePublicReadiness(checks);
  const access = result.dimensionScores.find((d) => d.id === "access")!;
  const identity = result.dimensionScores.find((d) => d.id === "identity")!;
  // access: fetchable(8, pass=1) + noindex(8, fail=0) => 8/16 = 50%
  assert.equal(access.score, 50);
  // identity: only jsonld_valid measured and it passed => 100%
  assert.equal(identity.score, 100);
});
