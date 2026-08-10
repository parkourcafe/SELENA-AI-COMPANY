import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCalibrationReport,
  distribute,
  gateReasonCategory,
  percentile,
} from "@/lib/video-radar/calibration";
import type { ScoreRecord } from "@/lib/video-radar/store/types";

function score(overrides: Partial<ScoreRecord> = {}): ScoreRecord {
  return {
    runId: "run-1",
    videoId: "youtube:v1",
    baselineViews: 1_000,
    baselineSampleSize: 20,
    baselineConfidence: "high",
    baselineVersion: "radar-baseline-v1",
    outlierRatio: 2,
    outlierBand: "strong",
    outlierMaturity: "mature",
    relevanceScore: 0.6,
    candidateScore: 0.7,
    scoreComponents: {
      components: [
        { id: "outlierSignal", available: true },
        { id: "velocity", available: false },
      ],
    },
    scoringVersion: "radar-scoring-v1",
    shortlisted: false,
    gateReasons: [],
    ...overrides,
  };
}

test("percentiles interpolate and handle degenerate inputs", () => {
  assert.equal(percentile([], 0.5), null);
  assert.equal(percentile([5], 0.5), 5);
  assert.equal(percentile([1, 2, 3, 4], 0.5), 2.5);
  assert.equal(percentile([1, 2, 3, 4, 5], 0.25), 2);
  assert.equal(percentile([0, 10], 0.9), 9);
});

test("distributions ignore non-finite values", () => {
  const result = distribute([3, 1, Number.NaN, 2, Number.POSITIVE_INFINITY]);
  assert.equal(result.count, 3);
  assert.equal(result.min, 1);
  assert.equal(result.max, 3);
  assert.equal(result.median, 2);
});

test("gate reasons map onto stable categories", () => {
  assert.equal(gateReasonCategory("Outlier ratio below 1.5x"), "outlier");
  assert.equal(
    gateReasonCategory("No usable outlier ratio (baseline unavailable or views missing)"),
    "outlier",
  );
  assert.equal(gateReasonCategory("Baseline confidence 'unavailable' is not accepted"), "baselineConfidence");
  assert.equal(gateReasonCategory("Relevance below 0.35"), "relevance");
  assert.equal(gateReasonCategory("Candidate score below 0.42"), "candidateScore");
  assert.equal(gateReasonCategory("something new"), "other");
});

test("an empty run says so rather than inventing statistics", () => {
  const report = buildCalibrationReport(null, []);
  assert.equal(report.scored, 0);
  assert.equal(report.passed, 0);
  assert.equal(report.candidateScore.median, null);
  assert.deepEqual(report.observations, [
    "No scores recorded yet — run the Radar before calibrating.",
  ]);
});

test("the binding constraint is identified when one rule dominates rejections", () => {
  const scores = Array.from({ length: 10 }, (_, index) =>
    score({
      videoId: `youtube:v${index}`,
      relevanceScore: 0.1,
      gateReasons: ["Relevance below 0.35"],
    }),
  );

  const report = buildCalibrationReport("run-1", scores);
  assert.equal(report.passed, 0);
  assert.equal(report.gateRejections.relevance, 10);
  assert.ok(report.observations.some((note) => note.includes("binding constraint")));
  assert.ok(report.observations.some((note) => note.includes("relevance")));
});

test("a rejection citing several rules counts against each of them", () => {
  const report = buildCalibrationReport("run-1", [
    score({
      gateReasons: ["Outlier ratio below 1.5x", "Relevance below 0.35"],
    }),
  ]);

  assert.equal(report.gateRejections.outlier, 1);
  assert.equal(report.gateRejections.relevance, 1);
});

test("an over-permissive gate is flagged too, not just an over-strict one", () => {
  const scores = Array.from({ length: 10 }, (_, index) =>
    score({ videoId: `youtube:v${index}`, gateReasons: [] }),
  );

  const report = buildCalibrationReport("run-1", scores);
  assert.equal(report.passed, 10);
  assert.ok(report.observations.some((note) => note.includes("permissive")));
});

test("unmeasured outlier ratios are counted separately, never as zero", () => {
  const scores = [
    score({ videoId: "youtube:a", outlierRatio: 4 }),
    score({ videoId: "youtube:b", outlierRatio: null }),
    score({ videoId: "youtube:c", outlierRatio: null }),
  ];

  const report = buildCalibrationReport("run-1", scores);
  assert.equal(report.outlierRatio.unmeasured, 2);
  // A zero would have dragged the median down and misrepresented the sample.
  assert.equal(report.outlierRatio.count, 1);
  assert.equal(report.outlierRatio.median, 4);
  assert.ok(report.observations.some((note) => note.includes("no usable outlier ratio")));
});

test("component coverage shows which signals were actually available", () => {
  const report = buildCalibrationReport("run-1", [score(), score({ videoId: "youtube:v2" })]);

  assert.deepEqual(report.componentCoverage.outlierSignal, { available: 2, missing: 0 });
  assert.deepEqual(report.componentCoverage.velocity, { available: 0, missing: 2 });
});

test("a ceiling below the score distribution is called out", () => {
  const scores = Array.from({ length: 10 }, (_, index) =>
    score({
      videoId: `youtube:v${index}`,
      candidateScore: 0.1,
      gateReasons: ["Candidate score below 0.42"],
    }),
  );

  const report = buildCalibrationReport("run-1", scores);
  assert.ok(
    report.observations.some((note) => note.includes("90th-percentile candidate score")),
    `expected a percentile observation, got: ${report.observations.join(" | ")}`,
  );
});

test("the report carries the thresholds it was measured against", () => {
  const report = buildCalibrationReport("run-1", [score()]);
  assert.equal(report.scoringVersion, "radar-scoring-v1");
  assert.equal(report.thresholds.minOutlierRatio, 1.5);
  assert.equal(report.thresholds.minRelevance, 0.35);
  assert.equal(report.thresholds.minCandidateScore, 0.42);
});
