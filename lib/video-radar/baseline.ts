/**
 * Channel performance baseline (spec §17, §18).
 *
 * The baseline is the median view count of the creator's recent *comparable*
 * videos. Median rather than mean: one runaway hit in the history would drag a
 * mean upward and hide every subsequent outlier behind it.
 */

import { radarConfig } from "./config";
import type { BaselineConfidence, BaselineResult, VideoType } from "./contracts";
import { isComparableType } from "./videoType";

export interface BaselineCandidate {
  videoId: string;
  videoType: VideoType;
  publishedAt: string;
  views: number | null;
  /** Deleted / private / otherwise unusable records are excluded outright (spec §17). */
  invalid?: boolean;
}

export interface BaselineInput {
  targetVideoId: string;
  targetVideoType: VideoType;
  history: BaselineCandidate[];
  now?: Date;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function baselineConfidenceFor(sampleSize: number): BaselineConfidence {
  const { highMinSample, mediumMinSample, lowMinSample } = radarConfig.baseline.confidence;
  if (sampleSize >= highMinSample) return "high";
  if (sampleSize >= mediumMinSample) return "medium";
  if (sampleSize >= lowMinSample) return "low";
  return "unavailable";
}

/**
 * Videos eligible to form the baseline: same type, past the stabilization
 * window, valid, with a real view count, and never the target itself.
 *
 * Excluding the target matters more than it looks — including a strong video in
 * its own baseline inflates the denominator and shrinks exactly the signal the
 * Radar exists to detect.
 */
export function eligibleBaselineSample(input: BaselineInput): BaselineCandidate[] {
  const now = input.now ?? new Date();
  const minAgeMs = radarConfig.baseline.minStabilizationHours * 3_600_000;

  return input.history
    .filter((candidate) => {
      if (candidate.invalid) return false;
      if (candidate.videoId === input.targetVideoId) return false;
      if (!isComparableType(candidate.videoType, input.targetVideoType)) return false;
      if (typeof candidate.views !== "number" || !Number.isFinite(candidate.views) || candidate.views < 0) {
        return false;
      }
      const publishedAt = new Date(candidate.publishedAt).getTime();
      if (!Number.isFinite(publishedAt)) return false;
      return now.getTime() - publishedAt >= minAgeMs;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, radarConfig.baseline.targetSampleSize);
}

export function computeBaseline(input: BaselineInput): BaselineResult {
  const sample = eligibleBaselineSample(input);
  const confidence = baselineConfidenceFor(sample.length);

  // Below the minimum sample there is no honest baseline to report. Returning a
  // number computed from two videos, flagged "low", would still get divided
  // into a view count downstream and read as a real ratio.
  if (confidence === "unavailable") {
    return {
      baselineViews: null,
      sampleSize: sample.length,
      confidence,
      baselineVersion: radarConfig.baselineVersion,
    };
  }

  return {
    baselineViews: median(sample.map((candidate) => candidate.views as number)),
    sampleSize: sample.length,
    confidence,
    baselineVersion: radarConfig.baselineVersion,
  };
}
