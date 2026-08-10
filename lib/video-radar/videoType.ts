/**
 * Short / long classification, centralized (spec §15).
 *
 * This is the ONLY place in the codebase allowed to reason about duration
 * thresholds. Scattering `duration < 60` checks across the pipeline is how a
 * Short silently ends up compared against long-form baselines, which produces a
 * confident wrong answer rather than a missing one.
 */

import { radarConfig } from "./config";
import type { VideoType } from "./contracts";

/**
 * ISO 8601 duration as returned by the YouTube Data API (`PT1M30S`).
 * Returns null for anything unparseable — callers must treat that as unknown,
 * never as zero.
 */
export function parseIsoDurationSeconds(iso: unknown): number | null {
  if (typeof iso !== "string") return null;
  const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso.trim());
  if (!match) return null;

  const [, days, hours, minutes, seconds] = match;
  if (!days && !hours && !minutes && !seconds) return null;

  const total =
    Number(days ?? 0) * 86_400 +
    Number(hours ?? 0) * 3_600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0);

  return Number.isFinite(total) ? total : null;
}

/**
 * Classify by duration. A missing, non-finite or non-positive duration yields
 * `unknown` rather than a guess.
 *
 * `isShortsUrl` is an optional corroborating signal: YouTube exposes Shorts at
 * /shorts/<id>, which is a stronger signal than duration alone when both agree.
 * It can only promote an unknown-duration video to `short`; it never overrides
 * a duration that says otherwise, because a long video served on a Shorts URL
 * should stay comparable to long-form.
 */
export function classifyVideoType(
  durationSeconds: number | null | undefined,
  isShortsUrl = false,
): VideoType {
  if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return isShortsUrl ? "short" : "unknown";
  }
  return durationSeconds <= radarConfig.videoType.shortMaxDurationSeconds ? "short" : "long";
}

/**
 * Whether two videos may be compared for baseline purposes (spec §17: "Do not
 * compare Shorts against long-form"). `unknown` only ever matches `unknown`, so
 * an unclassified video is compared with equally unclassified peers or not at all.
 */
export function isComparableType(a: VideoType, b: VideoType): boolean {
  return a === b;
}
