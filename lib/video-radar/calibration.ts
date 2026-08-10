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
  /** Channels that keep producing relevant videos — evidence-backed watchlist candidates. */
  channelCandidates: ChannelCandidate[];
  thresholds: {
    minCandidateScore: number;
    minOutlierRatio: number;
    minRelevance: number;
  };
  /** Code + English text: the code lets a surface render its own wording. */
  observations: CalibrationObservation[];
}

export type ObservationCode =
  | "empty"
  | "gate_rejects_all"
  | "gate_too_permissive"
  | "binding_constraint"
  | "score_ceiling_above_p90"
  | "relevance_below_threshold"
  | "baselines_not_accumulated";

/**
 * A channel the run kept running into.
 *
 * The watchlist is the durable fix for thin baselines, but building one from
 * memory is a task nobody can do well — you cannot recall the channels you have
 * not met yet. A run that scored 600 videos has already met them, so the
 * candidates are derived from what it saw rather than asked for.
 */
export interface ChannelCandidate {
  channelId: string;
  channelName: string;
  channelUrl: string;
  /** Videos from this channel that cleared the relevance threshold. */
  relevantVideos: number;
  bestRelevance: number;
  /** Whether the run could measure an outlier for any of them. */
  hasMeasuredOutlier: boolean;
}

export interface CalibrationObservation {
  code: ObservationCode;
  text: string;
  /** Values behind the observation, so another surface can reword it. */
  data: Record<string, number | string>;
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

/** Minimal video shape the report needs; keeps the signature off RadarVideo. */
export interface ScoredVideoRef {
  id: string;
  channelId: string;
  channelName: string;
}

export function channelCandidatesFrom(
  scores: ScoreRecord[],
  videos: ScoredVideoRef[],
  limit = 15,
): ChannelCandidate[] {
  const byVideo = new Map(videos.map((video) => [video.id, video]));
  const minRelevance = radarConfig.qualityGate.minRelevance;
  const byChannel = new Map<string, ChannelCandidate>();

  for (const score of scores) {
    if (score.relevanceScore < minRelevance) continue;
    const video = byVideo.get(score.videoId);
    if (!video?.channelId) continue;

    const entry = byChannel.get(video.channelId) ?? {
      channelId: video.channelId,
      channelName: video.channelName || video.channelId,
      channelUrl: `https://www.youtube.com/channel/${video.channelId}`,
      relevantVideos: 0,
      bestRelevance: 0,
      hasMeasuredOutlier: false,
    };

    entry.relevantVideos += 1;
    entry.bestRelevance = Math.max(entry.bestRelevance, score.relevanceScore);
    if (typeof score.outlierRatio === "number") entry.hasMeasuredOutlier = true;
    byChannel.set(video.channelId, entry);
  }

  // Repeat appearances first: one relevant video can be coincidence, four from
  // the same creator is a channel that works this niche.
  return [...byChannel.values()]
    .sort((a, b) => b.relevantVideos - a.relevantVideos || b.bestRelevance - a.bestRelevance)
    .slice(0, limit);
}

export function buildCalibrationReport(
  runId: string | null,
  scores: ScoreRecord[],
  videos: ScoredVideoRef[] = [],
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
    channelCandidates: channelCandidatesFrom(scores, videos),
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
): CalibrationObservation[] {
  const notes: CalibrationObservation[] = [];
  if (scores.length === 0) {
    return [
      {
        code: "empty",
        text: "No scores recorded yet — run the Radar before calibrating.",
        data: {},
      },
    ];
  }

  const passRate = passed / scores.length;

  // Both extremes are worth naming. A gate that passes nothing is invisible;
  // a gate that passes everything is not a gate.
  if (passed === 0) {
    notes.push({
      code: "gate_rejects_all",
      text: "Nothing cleared the quality gate. Check the rejection histogram to see which rule is binding before assuming there was no signal.",
      data: { scored: scores.length },
    });
  } else if (passRate > 0.5) {
    notes.push({
      code: "gate_too_permissive",
      text: `${Math.round(passRate * 100)}% of scored videos cleared the gate. A gate this permissive is doing little filtering — the shortlist is close to the raw discovery pool.`,
      data: { passRatePercent: Math.round(passRate * 100) },
    });
  }

  const dominant = Object.entries(gateRejections).sort((a, b) => b[1] - a[1])[0];
  if (dominant && dominant[1] >= scores.length * 0.8) {
    notes.push({
      code: "binding_constraint",
      text: `'${dominant[0]}' is the binding constraint: it appears in ${dominant[1]} of ${scores.length} rejections. Adjusting any other threshold will change little until this one moves.`,
      data: { rule: dominant[0], count: dominant[1], scored: scores.length },
    });
  }

  if (typeof candidateScore.p90 === "number" && candidateScore.p90 < radarConfig.qualityGate.minCandidateScore) {
    notes.push({
      code: "score_ceiling_above_p90",
      text: `The 90th-percentile candidate score (${candidateScore.p90.toFixed(3)}) is below minCandidateScore (${radarConfig.qualityGate.minCandidateScore}), so at most 10% of videos can ever pass on score alone.`,
      data: { p90: Number(candidateScore.p90.toFixed(3)), threshold: radarConfig.qualityGate.minCandidateScore },
    });
  }

  if (typeof relevance.median === "number" && relevance.median < radarConfig.qualityGate.minRelevance) {
    notes.push({
      code: "relevance_below_threshold",
      text: `Median relevance (${relevance.median.toFixed(2)}) is below minRelevance (${radarConfig.qualityGate.minRelevance}). That usually means topic keywords do not match how this niche actually titles its videos, rather than that the videos are irrelevant.`,
      data: { median: Number(relevance.median.toFixed(2)), threshold: radarConfig.qualityGate.minRelevance },
    });
  }

  const unmeasured = scores.filter((score) => typeof score.outlierRatio !== "number").length;
  if (unmeasured >= scores.length * 0.5) {
    notes.push({
      code: "baselines_not_accumulated",
      // Deliberately not "run it again a few times". Topic search returns
      // different channels each run, so repetition adds more one-video channels
      // rather than deeper history for the existing ones. What closes the gap is
      // the baseline backfill and a watchlist, not patience.
      text: `${unmeasured} of ${scores.length} videos have no usable outlier ratio, because their channel has too few comparable videos stored. Check whether the run backfilled channels (counter: channelsBackfilled) and consider raising pipeline.maxBaselineBackfillChannels, or adding the recurring creators to the watchlist. Thresholds cannot be calibrated on a sample this thin.`,
      data: { unmeasured, scored: scores.length },
    });
  }

  return notes;
}

export async function loadCalibrationReport(store: RadarStore): Promise<CalibrationReport> {
  const runs = await store.listRuns(1);
  const latest = runs[0] ?? null;
  const scores = latest ? await store.listScores(latest.id) : [];

  // Per-type pass rates, so the two quota ceilings can be judged separately —
  // Shorts and long-form routinely behave nothing like each other.
  const videos = await store.listVideos({ limit: 1_000 });
  const report = buildCalibrationReport(latest?.id ?? null, scores, videos);

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
