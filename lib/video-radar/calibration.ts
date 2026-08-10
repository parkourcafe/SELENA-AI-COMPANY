/**
 * Threshold calibration report.
 *
 * The quality gate in data/video-radar/scoring.v1.json holds reasoned defaults,
 * not calibrated values — the right numbers for a given niche are only visible
 * once real videos have been scored. This module turns one run's stored scores
 * into the distribution needed to move those numbers on evidence.
 *
 * It reads ONLY what the run already persisted. It re-scores nothing, calls no
 * provider and spends no tokens, so it is safe to hit repeatedly.
 *
 * The observations it emits are deliberately phrased as observations. A report
 * that said "lower minRelevance to 0.2" would be asserting it knows the right
 * answer; what it actually knows is that a threshold is rejecting nearly
 * everything, which is a fact worth surfacing and a judgement worth leaving to
 * a human.
 */

import { radarConfig } from "./config";
import type { ScoreRecord } from "./store/types";
import type { RadarStore } from "./store/types";

export interface Distribution {
  count: number;
  min: number | null;
  p25: number | null;
  median: number | null;
  p75: number | null;
  p90: number | null;
  max: number | null;
}

export interface CalibrationReport {
  runId: string | null;
  scoringVersion: string;
  scored: number;
  passed: number;
  /** Distribution across everything scored, not just what passed. */
  candidateScore: Distribution;
  relevance: Distribution;
  /** Only videos with a usable ratio; `unmeasured` counts the rest. */
  outlierRatio: Distribution & { unmeasured: number };
  baselineConfidence: Record<string, number>;
  maturity: Record<string, number>;
  /** How often each gate rule was the/a reason for rejection. */
  gateRejections: Record<string, number>;
  /** How often each score component had real data to contribute. */
  componentCoverage: Record<string, { available: number; missing: number }>;
  byType: Record<string, { scored: number; passed: number; ceiling: number }>;
  thresholds: {
    minCandidateScore: number;
    minOutlierRatio: number;
    minRelevance: number;
  };
  observations: string[];
}

export function percentile(sorted: number[], fraction: number): number | null {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function distribute(values: number[]): Distribution {
  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
  return {
    count: sorted.length,
    min: sorted[0] ?? null,
    p25: percentile(sorted, 0.25),
    median: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    p90: percentile(sorted, 0.9),
    max: sorted[sorted.length - 1] ?? null,
  };
}

/**
 * Map a gate reason string onto a stable category, so the histogram survives
 * the reason text being reworded and stays readable when thresholds change.
 */
export function gateReasonCategory(reason: string): string {
  const lowered = reason.toLowerCase();
  if (lowered.includes("outlier")) return "outlier";
  if (lowered.includes("confidence")) return "baselineConfidence";
  if (lowered.includes("relevance")) return "relevance";
  if (lowered.includes("candidate score")) return "candidateScore";
  return "other";
}

interface StoredComponents {
  components?: { id: string; available: boolean }[];
}

export function buildCalibrationReport(
  runId: string | null,
  scores: ScoreRecord[],
): CalibrationReport {
  const gate = radarConfig.qualityGate;

  const candidateScore = distribute(scores.map((score) => score.candidateScore));
  const relevance = distribute(scores.map((score) => score.relevanceScore));

  const measuredRatios = scores
    .map((score) => score.outlierRatio)
    .filter((ratio): ratio is number => typeof ratio === "number" && Number.isFinite(ratio));

  const baselineConfidence: Record<string, number> = {};
  const maturity: Record<string, number> = {};
  const gateRejections: Record<string, number> = {};
  const componentCoverage: Record<string, { available: number; missing: number }> = {};
  const byType: Record<string, { scored: number; passed: number; ceiling: number }> = {};

  for (const score of scores) {
    baselineConfidence[score.baselineConfidence] =
      (baselineConfidence[score.baselineConfidence] ?? 0) + 1;
    maturity[score.outlierMaturity] = (maturity[score.outlierMaturity] ?? 0) + 1;

    // A rejection can cite several rules at once; each is counted, so the
    // totals intentionally exceed the number of rejected videos.
    for (const reason of score.gateReasons) {
      const category = gateReasonCategory(reason);
      gateRejections[category] = (gateRejections[category] ?? 0) + 1;
    }

    const stored = score.scoreComponents as StoredComponents | null;
    for (const component of stored?.components ?? []) {
      const entry = componentCoverage[component.id] ?? { available: 0, missing: 0 };
      if (component.available) entry.available += 1;
      else entry.missing += 1;
      componentCoverage[component.id] = entry;
    }
  }

  const passed = scores.filter((score) => score.gateReasons.length === 0).length;

  return {
    runId,
    scoringVersion: radarConfig.scoringVersion,
    scored: scores.length,
    passed,
    candidateScore,
    relevance,
    outlierRatio: { ...distribute(measuredRatios), unmeasured: scores.length - measuredRatios.length },
    baselineConfidence,
    maturity,
    gateRejections,
    componentCoverage,
    byType,
    thresholds: {
      minCandidateScore: gate.minCandidateScore,
      minOutlierRatio: gate.minOutlierRatio,
      minRelevance: gate.minRelevance,
    },
    observations: observationsFor(scores, passed, candidateScore, relevance, gateRejections),
  };
}

function observationsFor(
  scores: ScoreRecord[],
  passed: number,
  candidateScore: Distribution,
  relevance: Distribution,
  gateRejections: Record<string, number>,
): string[] {
  const notes: string[] = [];
  if (scores.length === 0) {
    return ["No scores recorded yet — run the Radar before calibrating."];
  }

  const passRate = passed / scores.length;

  // Both extremes are worth naming. A gate that passes nothing is invisible;
  // a gate that passes everything is not a gate.
  if (passed === 0) {
    notes.push(
      "Nothing cleared the quality gate. Check the rejection histogram below to see which rule is binding before assuming there was no signal.",
    );
  } else if (passRate > 0.5) {
    notes.push(
      `${Math.round(passRate * 100)}% of scored videos cleared the gate. A gate this permissive is doing little filtering — the shortlist is close to the raw discovery pool.`,
    );
  }

  const dominant = Object.entries(gateRejections).sort((a, b) => b[1] - a[1])[0];
  if (dominant && dominant[1] >= scores.length * 0.8) {
    notes.push(
      `'${dominant[0]}' is the binding constraint: it appears in ${dominant[1]} of ${scores.length} rejections. Adjusting any other threshold will change little until this one moves.`,
    );
  }

  if (typeof candidateScore.p90 === "number" && candidateScore.p90 < radarConfig.qualityGate.minCandidateScore) {
    notes.push(
      `The 90th-percentile candidate score (${candidateScore.p90.toFixed(3)}) is below minCandidateScore (${radarConfig.qualityGate.minCandidateScore}), so at most 10% of videos can ever pass on score alone.`,
    );
  }

  if (typeof relevance.median === "number" && relevance.median < radarConfig.qualityGate.minRelevance) {
    notes.push(
      `Median relevance (${relevance.median.toFixed(2)}) is below minRelevance (${radarConfig.qualityGate.minRelevance}). That usually means topic keywords do not match how this niche actually titles its videos, rather than that the videos are irrelevant.`,
    );
  }

  const unmeasured = scores.filter((score) => typeof score.outlierRatio !== "number").length;
  if (unmeasured >= scores.length * 0.5) {
    notes.push(
      `${unmeasured} of ${scores.length} videos have no usable outlier ratio, almost always because their channel has too few comparable videos stored yet. Baselines improve as monitoring accumulates history — calibrate thresholds after a few runs, not the first.`,
    );
  }

  return notes;
}

export async function loadCalibrationReport(store: RadarStore): Promise<CalibrationReport> {
  const runs = await store.listRuns(1);
  const latest = runs[0] ?? null;
  const scores = latest ? await store.listScores(latest.id) : [];

  const report = buildCalibrationReport(latest?.id ?? null, scores);

  // Per-type pass rates, so the two quota ceilings can be judged separately —
  // Shorts and long-form routinely behave nothing like each other.
  const videos = await store.listVideos({ limit: 1_000 });
  const typeByVideo = new Map(videos.map((video) => [video.id, video.videoType]));

  for (const score of scores) {
    const type = typeByVideo.get(score.videoId) ?? "unknown";
    const bucket = type === "short" ? "short" : "long";
    const entry = report.byType[bucket] ?? {
      scored: 0,
      passed: 0,
      ceiling:
        bucket === "short"
          ? radarConfig.qualityGate.weeklyQuota.short
          : radarConfig.qualityGate.weeklyQuota.long,
    };
    entry.scored += 1;
    if (score.gateReasons.length === 0) entry.passed += 1;
    report.byType[bucket] = entry;
  }

  return report;
}
