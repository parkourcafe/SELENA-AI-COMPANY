import scoringConfig from "@/data/visibility/scoring.v1.json";
import type { CheckResult, CheckState } from "../checks/technicalChecks";

const STATE_FRACTIONS: Record<CheckState, number | null> = {
  pass: 1,
  warn: 0.5,
  fail: 0,
  not_measured: null,
};

export interface RuleBreakdown {
  ruleId: string;
  dimension: string;
  weight: number;
  state: CheckState;
  fraction: number | null;
}

export interface DimensionScore {
  id: string;
  label: string;
  score: number;
  coverage: number;
}

export interface PublicReadinessResult {
  scoringVersion: number;
  /** 0-100. Only meaningful together with `coverage` — a low-coverage score is marked lowConfidence. */
  score: number;
  /** Fraction (0-1) of total rule weight that was actually measured — not_measured rules are excluded, not counted as failing (SSOT §8.3). */
  coverage: number;
  lowConfidence: boolean;
  dimensionScores: DimensionScore[];
  ruleBreakdown: RuleBreakdown[];
}

/**
 * Deterministic, versioned Public Readiness scoring (SSOT §8.2, §8.3).
 * The rule weights live in data/visibility/scoring.v1.json, not in code,
 * so a future weight change is a new scoring_version, not a silent edit.
 */
export function computePublicReadiness(checks: CheckResult[]): PublicReadinessResult {
  const { rules, dimensions } = scoringConfig.publicReadiness;
  const byRuleId = new Map(checks.map((c) => [c.ruleId, c]));

  let totalWeight = 0;
  let measuredWeight = 0;
  let earnedWeight = 0;

  const dimensionTotals = new Map(dimensions.map((d) => [d.id, { total: 0, measured: 0, earned: 0 }]));

  const ruleBreakdown: RuleBreakdown[] = rules.map((rule) => {
    const check = byRuleId.get(rule.id);
    const state: CheckState = check?.state ?? "not_measured";
    const fraction = STATE_FRACTIONS[state];

    totalWeight += rule.weight;
    const dimTotals = dimensionTotals.get(rule.dimension);
    if (dimTotals) dimTotals.total += rule.weight;

    if (fraction !== null) {
      measuredWeight += rule.weight;
      earnedWeight += rule.weight * fraction;
      if (dimTotals) {
        dimTotals.measured += rule.weight;
        dimTotals.earned += rule.weight * fraction;
      }
    }

    return { ruleId: rule.id, dimension: rule.dimension, weight: rule.weight, state, fraction };
  });

  const coverage = totalWeight > 0 ? measuredWeight / totalWeight : 0;
  const score = measuredWeight > 0 ? Math.round((earnedWeight / measuredWeight) * 100) : 0;

  const dimensionScores: DimensionScore[] = dimensions.map((d) => {
    const totals = dimensionTotals.get(d.id)!;
    return {
      id: d.id,
      label: d.label,
      score: totals.measured > 0 ? Math.round((totals.earned / totals.measured) * 100) : 0,
      coverage: totals.total > 0 ? totals.measured / totals.total : 0,
    };
  });

  return {
    scoringVersion: scoringConfig.version,
    score,
    coverage,
    // Coverage-based confidence caps at "low confidence" flag here; the
    // separate high/medium/low AI-sample confidence lives in
    // lib/diagnostics/contracts.ts (singleRunConfidence) — these are two
    // distinct measurements, not the same number (SSOT §8.3 vs §8.6).
    lowConfidence: coverage < scoringConfig.confidence.lowConfidenceCoverageThreshold,
    dimensionScores,
    ruleBreakdown,
  };
}
