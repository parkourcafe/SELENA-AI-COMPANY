import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeOutlier,
  outlierBandFor,
  outlierMaturityFor,
  outlierSignal,
} from "@/lib/video-radar/outlier";
import type { BaselineResult } from "@/lib/video-radar/contracts";

const NOW = new Date("2026-08-10T00:00:00.000Z");

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

function baseline(views: number | null, confidence: BaselineResult["confidence"] = "high"): BaselineResult {
  return { baselineViews: views, sampleSize: 20, confidence, baselineVersion: "radar-baseline-v1" };
}

test("outlier ratio divides views by the creator's comparable baseline", () => {
  const result = computeOutlier({
    views: 20_000,
    baseline: baseline(1_000),
    publishedAt: daysAgo(30),
    videoType: "long",
    now: NOW,
  });

  assert.equal(result.available, true);
  assert.equal(result.ratio, 20);
  assert.equal(result.band, "exceptional");
  assert.equal(result.maturity, "mature");
});

test("bands map to the configured thresholds", () => {
  assert.equal(outlierBandFor(1.2), "normal");
  assert.equal(outlierBandFor(1.5), "interesting");
  assert.equal(outlierBandFor(2), "strong");
  assert.equal(outlierBandFor(4.9), "strong");
  assert.equal(outlierBandFor(5), "major");
  assert.equal(outlierBandFor(10), "exceptional");
});

test("a zero baseline yields no ratio instead of Infinity", () => {
  const result = computeOutlier({
    views: 3,
    baseline: baseline(0),
    publishedAt: daysAgo(30),
    videoType: "long",
    now: NOW,
  });

  // Infinity here would rank a 3-view video at the very top of the list.
  assert.equal(result.available, false);
  assert.equal(result.ratio, null);
  assert.equal(result.band, "unavailable");
});

test("an unavailable baseline yields no ratio even when views are known", () => {
  const result = computeOutlier({
    views: 100_000,
    baseline: baseline(null, "unavailable"),
    publishedAt: daysAgo(30),
    videoType: "long",
    now: NOW,
  });

  assert.equal(result.available, false);
  assert.equal(result.ratio, null);
});

test("missing view counts yield no ratio", () => {
  for (const views of [null, Number.NaN, -5]) {
    const result = computeOutlier({
      views,
      baseline: baseline(1_000),
      publishedAt: daysAgo(30),
      videoType: "long",
      now: NOW,
    });
    assert.equal(result.available, false, `views=${String(views)} should be unavailable`);
  }
});

test("young videos are provisional, and the threshold differs by video type", () => {
  // Long-form matures at 168h (7 days).
  assert.equal(outlierMaturityFor(daysAgo(3), "long", NOW), "provisional");
  assert.equal(outlierMaturityFor(daysAgo(8), "long", NOW), "mature");

  // Shorts settle faster: 72h.
  assert.equal(outlierMaturityFor(daysAgo(2), "short", NOW), "provisional");
  assert.equal(outlierMaturityFor(daysAgo(4), "short", NOW), "mature");

  // Unknown type gets the conservative long-form window.
  assert.equal(outlierMaturityFor(daysAgo(4), "unknown", NOW), "provisional");
});

test("a provisional result still reports its ratio, flagged rather than withheld", () => {
  const result = computeOutlier({
    views: 20_000,
    baseline: baseline(1_000),
    publishedAt: daysAgo(1),
    videoType: "long",
    now: NOW,
  });

  assert.equal(result.available, true);
  assert.equal(result.ratio, 20);
  assert.equal(result.maturity, "provisional");
  assert.ok(result.ageHours > 23 && result.ageHours < 25);
});

test("outlier signal is log-scaled, clamped, and null for unusable ratios", () => {
  assert.equal(outlierSignal(null), null);
  assert.equal(outlierSignal(0), null);
  assert.equal(outlierSignal(-2), null);

  const atOne = outlierSignal(1);
  assert.equal(atOne, 0);

  const atTen = outlierSignal(10);
  assert.equal(atTen, 1);

  // 100x is still capped at 1 so a single freak result cannot swamp every other signal.
  assert.equal(outlierSignal(100), 1);

  const mid = outlierSignal(3) as number;
  assert.ok(mid > 0.4 && mid < 0.55, `expected mid-range signal, got ${mid}`);
});
