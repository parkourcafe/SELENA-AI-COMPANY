/**
 * Outlier ratio and maturity (spec §19, §20, §21).
 *
 * ratio = video views / comparable channel baseline views.
 *
 * Subscriber count is deliberately NOT the denominator (§21). A creator's own
 * recent comparable performance is the honest reference; views/subscribers
 * mostly measures how long a channel has existed.
 */

import { minMaturityAgeHours, radarConfig } from "./config";
import type { BaselineResult, OutlierMaturity, OutlierResult, VideoType } from "./contracts";

export interface OutlierInput {
  views: number | null;
  baseline: BaselineResult;
  publishedAt: string;
  videoType: VideoType;
  now?: Date;
}

export function ageHoursSince(publishedAt: string, now: Date = new Date()): number {
  const published = new Date(publishedAt).getTime();
  if (!Number.isFinite(published)) return 0;
  return Math.max(0, (now.getTime() - published) / 3_600_000);
}

/**
 * A young video has had less exposure time than the mature totals it is being
 * compared against, so its ratio understates performance and cannot carry the
 * same confidence. v1 uses the spec's fallback: mark it `provisional` until it
 * passes a configurable minimum age (§19).
 */
export function outlierMaturityFor(
  publishedAt: string,
  videoType: VideoType,
  now: Date = new Date(),
): OutlierMaturity {
  return ageHoursSince(publishedAt, now) >= minMaturityAgeHours(videoType) ? "mature" : "provisional";
}

export function outlierBandFor(ratio: number): string {
  let band = radarConfig.outlier.bands[0].id;
  for (const candidate of radarConfig.outlier.bands) {
    if (ratio >= candidate.minRatio) band = candidate.id;
  }
  return band;
}

export function computeOutlier(input: OutlierInput): OutlierResult {
  const now = input.now ?? new Date();
  const maturity = outlierMaturityFor(input.publishedAt, input.videoType, now);
  const ageHours = ageHoursSince(input.publishedAt, now);
  const baselineViews = input.baseline.baselineViews;

  const unavailable: OutlierResult = {
    ratio: null,
    band: "unavailable",
    maturity,
    ageHours,
    available: false,
  };

  if (input.baseline.confidence === "unavailable") return unavailable;
  if (typeof input.views !== "number" || !Number.isFinite(input.views) || input.views < 0) {
    return unavailable;
  }
  // Guard the division explicitly. A creator whose comparable median is 0 gives
  // no reference point at all — Infinity here would rank a 3-view video top.
  if (typeof baselineViews !== "number" || !Number.isFinite(baselineViews) || baselineViews <= 0) {
    return unavailable;
  }

  const ratio = input.views / baselineViews;
  return { ratio, band: outlierBandFor(ratio), maturity, ageHours, available: true };
}

/** Normalize a ratio to 0..1 for ranking. Log-scaled so 20x does not swamp every other signal. */
export function outlierSignal(ratio: number | null): number | null {
  if (typeof ratio !== "number" || !Number.isFinite(ratio) || ratio <= 0) return null;
  const reference = radarConfig.outlier.referenceRatioForFullSignal;
  const signal = Math.log(ratio) / Math.log(reference);
  return Math.min(1, Math.max(0, signal));
}
