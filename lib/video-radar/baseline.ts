/**
 * Channel performance baseline (spec §17, §18).
 *
 * The baseline is the median view count of the creator's *comparable* videos
 * from around the same period. Median rather than mean: one runaway hit in the
 * history would drag a mean upward and hide every subsequent outlier behind it.
 *
 * "From around the same period" is load-bearing, not decoration. A channel's
 * audience today is not the audience it had three years ago, so dividing an old
 * video's lifetime views by this month's median produces a number in the tens of
 * thousands that describes channel growth, not an outlier. The comparison window
 * and the nearest-in-time sample selection below exist to stop that.
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
  /** The comparison is anchored here, not on "today" — see the module note. */
  targetPublishedAt: string;
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
 * window, valid, with a real view count, published within the comparison window
 * around the target, and never the target itself.
 *
 * Excluding the target matters more than it looks — including a strong video in
 * its own baseline inflates the denominator and shrinks exactly the signal the
 * Radar exists to detect.
 *
 * The sample is the videos NEAREST IN TIME to the target rather than the most
 * recent overall. For a recent target the two are the same; for an older one
 * they are not, and "most recent" would compare it against an audience it never
 * had.
 */
export function eligibleBaselineSample(input: BaselineInput): BaselineCandidate[] {
  const now = input.now ?? new Date();
  const minAgeMs = radarConfig.baseline.minStabilizationHours * 3_600_000;
  const maxDistanceMs = radarConfig.baseline.maxComparisonAgeDays * 86_400_000;
  const targetAt = new Date(input.targetPublishedAt).getTime();

  // An unparseable target date leaves nothing to anchor the window to. Better no
  // baseline than one silently anchored on today.
  if (!Number.isFinite(targetAt)) return [];

  return input.history
    .map((candidate) => ({ candidate, publishedAt: new Date(candidate.publishedAt).getTime() }))
    .filter(({ candidate, publishedAt }) => {
      if (candidate.invalid) return false;
      if (candidate.videoId === input.targetVideoId) return false;
      if (!isComparableType(candidate.videoType, input.targetVideoType)) return false;
      if (typeof candidate.views !== "number" || !Number.isFinite(candidate.views) || candidate.views < 0) {
        return false;
      }
      if (!Number.isFinite(publishedAt)) return false;
      if (now.getTime() - publishedAt < minAgeMs) return false;
      return Math.abs(publishedAt - targetAt) <= maxDistanceMs;
    })
    .sort((a, b) => Math.abs(a.publishedAt - targetAt) - Math.abs(b.publishedAt - targetAt))
    .slice(0, radarConfig.baseline.targetSampleSize)
    .map(({ candidate }) => candidate);
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
