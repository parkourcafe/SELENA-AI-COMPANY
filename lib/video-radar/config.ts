/**
 * Single source of truth for every Radar threshold (spec §15, §18, §20, §26,
 * §38). Values live in data/video-radar/scoring.v1.json so they can be reviewed
 * and changed without touching logic, and so the numbers behind a stored score
 * stay traceable to a version string.
 *
 * Nothing in this module reads process.env — feature flags are separate
 * (lib/diagnostics/flags.ts). This is tuning, not enablement.
 */

import rawConfig from "@/data/video-radar/scoring.v1.json";
import type { BaselineConfidence, VideoType } from "./contracts";

type RawConfig = typeof rawConfig;

export type RadarConfig = RawConfig;

export const radarConfig: RadarConfig = rawConfig;

export const SCORE_COMPONENT_IDS = [
  "outlierSignal",
  "confidenceSignal",
  "relevance",
  "freshness",
  "engagement",
  "velocity",
  "creatorPriority",
] as const;

export type ScoreComponentId = (typeof SCORE_COMPONENT_IDS)[number];

export const SCORE_COMPONENT_LABELS: Record<ScoreComponentId, string> = {
  outlierSignal: "Outlier vs creator baseline",
  confidenceSignal: "Baseline confidence and maturity",
  relevance: "Topic and project relevance",
  freshness: "Freshness",
  engagement: "Engagement rates",
  velocity: "Measured velocity",
  creatorPriority: "Creator priority",
};

/** Minimum age before an outlier verdict stops being provisional, per video type. */
export function minMaturityAgeHours(videoType: VideoType): number {
  return radarConfig.maturity.minAgeHoursByType[videoType];
}

export function velocityReference(videoType: VideoType): number {
  return radarConfig.score.velocity.referenceViewsPerHourByType[videoType];
}

export function confidenceSignalValue(confidence: BaselineConfidence): number {
  return radarConfig.score.confidenceSignalValues[confidence];
}

/**
 * Quota ceiling for a video type. `unknown` deliberately has no quota of its
 * own — an unclassified video shares the long-form ceiling rather than creating
 * a third bucket nobody reviews.
 */
export function weeklyQuota(videoType: VideoType): number {
  if (videoType === "short") return radarConfig.qualityGate.weeklyQuota.short;
  return radarConfig.qualityGate.weeklyQuota.long;
}
