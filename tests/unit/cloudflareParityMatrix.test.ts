import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { agentReadinessRuleRegistry } from "@/lib/visibility/readiness/ruleRegistry";

type MatrixCell = {
  status: "passed" | "warning" | "failed" | "not_applicable";
  minimumEvidence: string;
  fix: string;
  verification: string;
  cloudflareBenchmark: string;
  selenaResult: string;
  decision: "PASS" | "BLOCK";
};

type MatrixScenario = {
  id: string;
  profile: "all_checks" | "content_site" | "api_application" | "commerce";
  platform: string;
  commerceEvidence: boolean;
  expectedOutcome: "PASS" | "BLOCK";
  default: MatrixCell;
  overrides?: Record<string, Partial<MatrixCell>>;
};

const matrix = JSON.parse(
  readFileSync(join(process.cwd(), "data/visibility/cloudflare-selena-parity-matrix.v1.json"), "utf8"),
) as {
  version: string;
  method: string;
  honestyBoundary: string;
  checkIds: string[];
  requiredCoverage: string[];
  scenarios: MatrixScenario[];
};

test("persisted Cloudflare/Selena parity matrix covers the complete registry", () => {
  const registryIds = agentReadinessRuleRegistry.map((rule) => rule.id);
  assert.deepEqual(matrix.checkIds, registryIds);
  assert.match(matrix.version, /^cloudflare-selena-parity-/);
  assert.equal(matrix.method, "controlled-fixture-contract");
  assert.match(matrix.honestyBoundary, /No external Cloudflare site was called/);

  const scenarioIds = matrix.scenarios.map((scenario) => scenario.id);
  for (const required of matrix.requiredCoverage) assert.ok(scenarioIds.includes(required), required);
  assert.ok(matrix.scenarios.length >= 12);
});

test("every parity cell has applicability-resolvable status, evidence, fix, verification and PASS/BLOCK decision", () => {
  for (const scenario of matrix.scenarios) {
    for (const rule of agentReadinessRuleRegistry) {
      const override = scenario.overrides?.[rule.id] ?? {};
      const cell = { ...scenario.default, ...override } as MatrixCell;
      assert.ok(cell.status, `${scenario.id}/${rule.id} status`);
      assert.ok(cell.minimumEvidence.length > 0, `${scenario.id}/${rule.id} evidence`);
      assert.ok(cell.fix.length > 0, `${scenario.id}/${rule.id} fix`);
      assert.ok(cell.verification.length > 0, `${scenario.id}/${rule.id} verification`);
      assert.match(cell.cloudflareBenchmark, /PASS/);
      assert.match(cell.selenaResult, /PASS/);
      assert.equal(cell.decision, "PASS", `${scenario.id}/${rule.id} decision`);

      const commerceRule = rule.category === "commerce" || rule.id === "SE-10";
      const expectedApplicable = commerceRule
        ? scenario.profile === "commerce" || (scenario.profile === "all_checks" && scenario.commerceEvidence)
        : rule.applicableProfiles.includes(scenario.profile);
      if (!expectedApplicable) {
        assert.equal(cell.status, "not_applicable", `${scenario.id}/${rule.id} must be N/A`);
      }
    }
  }
});
