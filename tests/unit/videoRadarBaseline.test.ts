import { test } from "node:test";
import assert from "node:assert/strict";
import {
  baselineConfidenceFor,
  computeBaseline,
  eligibleBaselineSample,
  median,
  type BaselineCandidate,
} from "@/lib/video-radar/baseline";
import type { VideoType } from "@/lib/video-radar/contracts";

const NOW = new Date("2026-08-10T00:00:00.000Z");

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

function history(count: number, views: number, videoType: VideoType = "long"): BaselineCandidate[] {
  return Array.from({ length: count }, (_, index) => ({
    videoId: `history-${videoType}-${index}`,
    videoType,
    publishedAt: daysAgo(10 + index),
    views,
  }));
}

test("median handles odd, even and empty inputs", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([]), null);
});

test("the target video is excluded from its own baseline", () => {
  const sample = eligibleBaselineSample({
    targetVideoId: "target",
    targetVideoType: "long",
    targetPublishedAt: daysAgo(9),
    history: [
      { videoId: "target", videoType: "long", publishedAt: daysAgo(9), views: 500_000 },
      ...history(5, 1_000),
    ],
    now: NOW,
  });

  assert.equal(sample.length, 5);
  assert.ok(!sample.some((candidate) => candidate.videoId === "target"));
  // The whole point: including the target would drag the median up and hide the outlier.
  assert.equal(median(sample.map((candidate) => candidate.views as number)), 1_000);
});

test("Shorts and long-form never share a baseline", () => {
  const mixed = [...history(10, 1_000, "long"), ...history(10, 90_000, "short")];

  const longBaseline = computeBaseline({
    targetVideoId: "target",
    targetVideoType: "long",
    targetPublishedAt: daysAgo(9),
    history: mixed,
    now: NOW,
  });
  const shortBaseline = computeBaseline({
    targetVideoId: "target",
    targetVideoType: "short",
    targetPublishedAt: daysAgo(9),
    history: mixed,
    now: NOW,
  });

  assert.equal(longBaseline.baselineViews, 1_000);
  assert.equal(longBaseline.sampleSize, 10);
  assert.equal(shortBaseline.baselineViews, 90_000);
  assert.equal(shortBaseline.sampleSize, 10);
});

test("an unknown-type video is only compared with other unknown-type videos", () => {
  const baseline = computeBaseline({
    targetVideoId: "target",
    targetVideoType: "unknown",
    targetPublishedAt: daysAgo(9),
    history: history(10, 1_000, "long"),
    now: NOW,
  });

  assert.equal(baseline.confidence, "unavailable");
  assert.equal(baseline.baselineViews, null);
});

test("confidence tracks sample size, and below the floor there is no baseline at all", () => {
  assert.equal(baselineConfidenceFor(20), "high");
  assert.equal(baselineConfidenceFor(15), "high");
  assert.equal(baselineConfidenceFor(14), "medium");
  assert.equal(baselineConfidenceFor(8), "medium");
  assert.equal(baselineConfidenceFor(7), "low");
  assert.equal(baselineConfidenceFor(4), "low");
  assert.equal(baselineConfidenceFor(3), "unavailable");
  assert.equal(baselineConfidenceFor(0), "unavailable");

  const thin = computeBaseline({
    targetVideoId: "target",
    targetVideoType: "long",
    targetPublishedAt: daysAgo(9),
    history: history(3, 1_000),
    now: NOW,
  });
  // A number computed from three videos would still get divided into a view
  // count downstream and read as a real ratio, so none is returned.
  assert.equal(thin.confidence, "unavailable");
  assert.equal(thin.baselineViews, null);
  assert.equal(thin.sampleSize, 3);
});

test("videos inside the stabilization window are not eligible", () => {
  const baseline = computeBaseline({
    targetVideoId: "target",
    targetVideoType: "long",
    targetPublishedAt: daysAgo(9),
    history: [
      ...history(4, 1_000),
      { videoId: "too-new-1", videoType: "long", publishedAt: daysAgo(1), views: 5 },
      { videoId: "too-new-2", videoType: "long", publishedAt: daysAgo(2), views: 5 },
    ],
    now: NOW,
  });

  assert.equal(baseline.sampleSize, 4);
  assert.equal(baseline.baselineViews, 1_000);
});

test("invalid and unmeasured history rows are excluded rather than counted as zero", () => {
  const baseline = computeBaseline({
    targetVideoId: "target",
    targetVideoType: "long",
    targetPublishedAt: daysAgo(9),
    history: [
      ...history(5, 1_000),
      { videoId: "deleted", videoType: "long", publishedAt: daysAgo(20), views: 999, invalid: true },
      { videoId: "no-views", videoType: "long", publishedAt: daysAgo(21), views: null },
      { videoId: "bad-date", videoType: "long", publishedAt: "not-a-date", views: 1 },
    ],
    now: NOW,
  });

  assert.equal(baseline.sampleSize, 5);
  assert.equal(baseline.baselineViews, 1_000);
});

test("the sample is capped at the configured target size", () => {
  const baseline = computeBaseline({
    targetVideoId: "target",
    targetVideoType: "long",
    targetPublishedAt: daysAgo(9),
    history: history(40, 1_000),
    now: NOW,
  });

  assert.equal(baseline.sampleSize, 20);
  assert.equal(baseline.confidence, "high");
});

test("an old video is compared with its own era, not with this month", () => {
  // A channel that has grown 100x. Comparing the old video against today's
  // uploads would report it as a 100x flop; against its contemporaries it is
  // exactly average, which is the truth.
  const contemporaries: BaselineCandidate[] = Array.from({ length: 5 }, (_, index) => ({
    videoId: `then-${index}`,
    videoType: "long",
    publishedAt: daysAgo(395 + index),
    views: 1_000,
  }));
  const recent: BaselineCandidate[] = Array.from({ length: 20 }, (_, index) => ({
    videoId: `now-${index}`,
    videoType: "long",
    publishedAt: daysAgo(10 + index),
    views: 100_000,
  }));

  const baseline = computeBaseline({
    targetVideoId: "target",
    targetVideoType: "long",
    targetPublishedAt: daysAgo(400),
    history: [...recent, ...contemporaries],
    now: NOW,
  });

  assert.equal(baseline.baselineViews, 1_000);
  assert.equal(baseline.sampleSize, 5);
  // Honest about being thin, rather than borrowing 20 unrelated videos to look
  // confident.
  assert.equal(baseline.confidence, "low");
});

test("no baseline at all when the whole history sits outside the comparison window", () => {
  const baseline = computeBaseline({
    targetVideoId: "target",
    targetVideoType: "long",
    targetPublishedAt: daysAgo(0),
    history: Array.from({ length: 20 }, (_, index) => ({
      videoId: `ancient-${index}`,
      videoType: "long",
      publishedAt: daysAgo(500 + index),
      views: 20,
    })),
    now: NOW,
  });

  // Dividing today's views by a median from two years ago is what produced
  // 49,000x "outliers" in the first live run.
  assert.equal(baseline.confidence, "unavailable");
  assert.equal(baseline.baselineViews, null);
  assert.equal(baseline.sampleSize, 0);
});

test("an unparseable target date yields no baseline rather than one anchored on today", () => {
  const baseline = computeBaseline({
    targetVideoId: "target",
    targetVideoType: "long",
    targetPublishedAt: "not-a-date",
    history: history(20, 1_000),
    now: NOW,
  });

  assert.equal(baseline.confidence, "unavailable");
  assert.equal(baseline.baselineViews, null);
});
