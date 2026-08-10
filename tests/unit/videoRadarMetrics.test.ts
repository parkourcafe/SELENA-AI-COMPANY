import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeEngagement,
  computeVelocity,
  engagementSignal,
  freshnessSignal,
  velocitySignal,
} from "@/lib/video-radar/metrics";
import type { RadarMetricSnapshot } from "@/lib/video-radar/contracts";

function snapshot(hoursAgo: number, views: number | null): RadarMetricSnapshot {
  return {
    videoId: "v1",
    capturedAt: new Date(Date.UTC(2026, 7, 10) - hoursAgo * 3_600_000).toISOString(),
    views,
    likes: null,
    comments: null,
    channelSubscribers: null,
  };
}

test("velocity is unavailable with fewer than two real snapshots", () => {
  assert.equal(computeVelocity([]).status, "unavailable");
  assert.equal(computeVelocity([snapshot(10, 500)]).status, "unavailable");
  // A snapshot with no view count is not a measurement.
  assert.equal(computeVelocity([snapshot(10, null), snapshot(5, 900)]).status, "unavailable");
});

test("velocity is measured from the change between two real snapshots", () => {
  const result = computeVelocity([snapshot(10, 1_000), snapshot(2, 5_000)]);

  assert.equal(result.status, "measured");
  assert.equal(result.snapshotCount, 2);
  assert.equal(result.windowHours, 8);
  assert.equal(result.viewsPerHour, 500);
});

test("velocity never uses current views over age", () => {
  // A single snapshot of a very old, very popular video would give a large
  // "velocity" if age were used as the window. It must stay unavailable.
  const result = computeVelocity([snapshot(24 * 365, 10_000_000)]);
  assert.equal(result.status, "unavailable");
  assert.equal(result.viewsPerHour, null);
});

test("two snapshots at the same instant give no window to divide by", () => {
  assert.equal(computeVelocity([snapshot(5, 100), snapshot(5, 200)]).status, "unavailable");
});

test("a downward view correction clamps to zero rather than reporting negative velocity", () => {
  const result = computeVelocity([snapshot(10, 5_000), snapshot(2, 4_000)]);
  assert.equal(result.status, "measured");
  assert.equal(result.viewsPerHour, 0);
});

test("hidden likes and comments stay null and never become zero", () => {
  const hidden = computeEngagement(10_000, null, null);
  assert.equal(hidden.likeRate, null);
  assert.equal(hidden.commentRate, null);
  // Null must not collapse into a signal — that would rank a hidden-like video
  // as the worst performer on the list.
  assert.equal(engagementSignal(hidden), null);

  const partial = computeEngagement(10_000, 600, null);
  assert.equal(partial.likeRate, 0.06);
  assert.equal(partial.commentRate, null);
  assert.equal(engagementSignal(partial), 1);
});

test("engagement rates need a positive view count", () => {
  assert.deepEqual(computeEngagement(null, 10, 2), { likeRate: null, commentRate: null });
  assert.deepEqual(computeEngagement(0, 10, 2), { likeRate: null, commentRate: null });
});

test("engagement signal averages the rates it has and stays capped at 1", () => {
  const both = computeEngagement(1_000, 600, 100);
  assert.equal(both.likeRate, 0.6);
  assert.equal(both.commentRate, 0.1);
  assert.equal(engagementSignal(both), 1);
});

test("velocity signal is null unless velocity was actually measured", () => {
  assert.equal(
    velocitySignal({ status: "unavailable", viewsPerHour: null, windowHours: null, snapshotCount: 1 }, "long"),
    null,
  );
  assert.equal(
    velocitySignal({ status: "measured", viewsPerHour: 250, windowHours: 8, snapshotCount: 2 }, "long"),
    0.5,
  );
  // Shorts have a higher reference rate, so the same throughput scores lower.
  assert.equal(
    velocitySignal({ status: "measured", viewsPerHour: 1_000, windowHours: 8, snapshotCount: 2 }, "short"),
    0.5,
  );
});

test("freshness decays by half over the configured half-life", () => {
  assert.equal(freshnessSignal(0), 1);
  const atHalfLife = freshnessSignal(21 * 24);
  assert.ok(Math.abs(atHalfLife - 0.5) < 1e-9);
  assert.ok(freshnessSignal(365 * 24) < 0.01);
});
