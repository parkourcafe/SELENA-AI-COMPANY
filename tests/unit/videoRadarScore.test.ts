import { test } from "node:test";
import assert from "node:assert/strict";
import { applyQuota, computeCandidateScore, passesQualityGate } from "@/lib/video-radar/score";
import { computeRelevance } from "@/lib/video-radar/relevance";
import type {
  BaselineResult,
  EngagementResult,
  OutlierResult,
  RadarTopic,
  RelevanceResult,
  VelocityResult,
} from "@/lib/video-radar/contracts";

const baseline: BaselineResult = {
  baselineViews: 1_000,
  sampleSize: 20,
  confidence: "high",
  baselineVersion: "radar-baseline-v1",
};

const outlier: OutlierResult = {
  ratio: 10,
  band: "exceptional",
  maturity: "mature",
  ageHours: 24 * 10,
  available: true,
};

const relevance: RelevanceResult = {
  score: 0.8,
  matchedTopics: ["ai"],
  matchedProjects: [],
  matchedKeywords: ["ai"],
  blockedByNegativeKeyword: false,
};

const engagement: EngagementResult = { likeRate: 0.06, commentRate: 0.005 };
const measuredVelocity: VelocityResult = {
  status: "measured",
  viewsPerHour: 500,
  windowHours: 24,
  snapshotCount: 2,
};
const noVelocity: VelocityResult = {
  status: "unavailable",
  viewsPerHour: null,
  windowHours: null,
  snapshotCount: 1,
};

test("every score exposes its components and its version", () => {
  const score = computeCandidateScore({
    videoType: "long",
    baseline,
    outlier,
    relevance,
    engagement,
    velocity: measuredVelocity,
    creatorPriority: 5,
  });

  assert.equal(score.scoringVersion, "radar-scoring-v1");
  assert.equal(score.components.length, 7);
  assert.equal(score.weightCoverage, 1);

  // A stored number that cannot be explained is not a ranking (§26).
  for (const component of score.components) {
    assert.ok(component.label.length > 0);
    assert.equal(typeof component.weight, "number");
    assert.equal(typeof component.contribution, "number");
  }
  const total = score.components.reduce((sum, component) => sum + component.contribution, 0);
  assert.ok(Math.abs(total - score.score) < 1e-9);
});

test("missing data renormalizes the weights instead of scoring zero", () => {
  // Every other component is at full strength, so renormalizing over the
  // remaining weights must leave the score untouched when engagement drops out.
  const perfect = {
    videoType: "long" as const,
    baseline,
    outlier: { ...outlier, ageHours: 0 },
    relevance: { ...relevance, score: 1 },
    velocity: { ...measuredVelocity, viewsPerHour: 5_000 },
    creatorPriority: 5,
  };

  const withData = computeCandidateScore({ ...perfect, engagement: { likeRate: 1, commentRate: 1 } });
  const hidden = computeCandidateScore({
    ...perfect,
    engagement: { likeRate: null, commentRate: null },
  });

  const component = hidden.components.find((entry) => entry.id === "engagement");
  assert.equal(component?.available, false);
  assert.equal(component?.contribution, 0);
  assert.ok(hidden.weightCoverage < 1);
  assert.ok(withData.weightCoverage === 1);

  assert.ok(Math.abs(withData.score - 1) < 1e-9);
  // Hiding likes is a fact about the creator's privacy settings, not about the
  // video's performance, so it must not demote the video.
  assert.ok(
    Math.abs(hidden.score - 1) < 1e-9,
    `hidden likes changed the score: ${withData.score} vs ${hidden.score}`,
  );

  // Scoring the gap as zero — the thing renormalization exists to avoid — would
  // have landed here instead.
  const zeroed = computeCandidateScore({
    ...perfect,
    engagement: { likeRate: 0, commentRate: 0 },
  });
  assert.ok(zeroed.score < hidden.score - 0.05, "a genuinely zero engagement rate must still count");
});

test("a provisional outlier is penalised through the confidence component", () => {
  const mature = computeCandidateScore({
    videoType: "long",
    baseline,
    outlier,
    relevance,
    engagement,
    velocity: noVelocity,
    creatorPriority: null,
  });

  const provisional = computeCandidateScore({
    videoType: "long",
    baseline,
    outlier: { ...outlier, maturity: "provisional" },
    relevance,
    engagement,
    velocity: noVelocity,
    creatorPriority: null,
  });

  assert.ok(provisional.score < mature.score);
});

test("the quality gate names every reason it rejected a candidate", () => {
  const weak = computeCandidateScore({
    videoType: "long",
    baseline: { ...baseline, confidence: "unavailable", baselineViews: null },
    outlier: { ratio: null, band: "unavailable", maturity: "mature", ageHours: 500, available: false },
    relevance: { ...relevance, score: 0.1 },
    engagement,
    velocity: noVelocity,
    creatorPriority: null,
  });

  const gate = passesQualityGate({
    score: weak,
    outlier: { ratio: null, band: "unavailable", maturity: "mature", ageHours: 500, available: false },
    relevance: { ...relevance, score: 0.1 },
    baseline: { ...baseline, confidence: "unavailable", baselineViews: null },
  });

  assert.equal(gate.passed, false);
  assert.ok(gate.reasons.length >= 3);
  assert.ok(gate.reasons.some((reason) => reason.includes("outlier")));
  assert.ok(gate.reasons.some((reason) => reason.includes("confidence")));
  assert.ok(gate.reasons.some((reason) => reason.includes("Relevance")));
});

test("a strong candidate clears the gate", () => {
  const score = computeCandidateScore({
    videoType: "long",
    baseline,
    outlier,
    relevance,
    engagement,
    velocity: measuredVelocity,
    creatorPriority: 5,
  });

  assert.equal(passesQualityGate({ score, outlier, relevance, baseline }).passed, true);
});

test("quotas cap the shortlist but never pad it", () => {
  const shorts = Array.from({ length: 80 }, (_, index) => ({
    videoId: `short-${index}`,
    videoType: "short" as const,
    score: 1 - index / 1000,
  }));
  const longs = Array.from({ length: 5 }, (_, index) => ({
    videoId: `long-${index}`,
    videoType: "long" as const,
    score: 0.9 - index / 1000,
  }));

  const kept = applyQuota([...shorts, ...longs]);

  assert.equal(kept.filter((entry) => entry.videoType === "short").length, 50);
  // Only 5 long-form cleared the gate, so 5 come back — not the 20-video ceiling.
  assert.equal(kept.filter((entry) => entry.videoType === "long").length, 5);
});

test("unknown-type videos share the long-form ceiling rather than getting their own", () => {
  const unknowns = Array.from({ length: 40 }, (_, index) => ({
    videoId: `unknown-${index}`,
    videoType: "unknown" as const,
    score: 1 - index / 1000,
  }));

  assert.equal(applyQuota(unknowns).length, 20);
});

test("relevance rewards topic and title matches and punishes negative keywords", () => {
  const topics: RadarTopic[] = [
    {
      id: "automation",
      slug: "automation",
      name: "Automation",
      description: "",
      active: true,
      priority: 5,
      keywords: ["automation", "no code"],
      negativeKeywords: ["dropshipping"],
      languages: ["en"],
      targetProjects: [],
      createdAt: "",
      updatedAt: "",
    },
  ];

  const relevant = computeRelevance({
    title: "Automation for small teams",
    description: "A no code walkthrough of workflow automation.",
    language: "en",
    topics,
  });
  assert.ok(relevant.score > 0.5, `expected a strong match, got ${relevant.score}`);
  assert.deepEqual(relevant.matchedTopics, ["automation"]);

  const blocked = computeRelevance({
    title: "Dropshipping automation secrets",
    description: "no code dropshipping",
    language: "en",
    topics,
  });
  assert.equal(blocked.blockedByNegativeKeyword, true);
  assert.ok(blocked.score < relevant.score);

  const unrelated = computeRelevance({
    title: "A day in my garden",
    description: "Planting tomatoes.",
    language: "en",
    topics,
  });
  assert.ok(unrelated.score < 0.2, `expected a weak match, got ${unrelated.score}`);
});

test("single-token keywords match on word boundaries, not substrings", () => {
  const topics: RadarTopic[] = [
    {
      id: "ai",
      slug: "ai",
      name: "AI",
      description: "",
      active: true,
      priority: 5,
      keywords: ["ai"],
      negativeKeywords: [],
      languages: [],
      targetProjects: [],
      createdAt: "",
      updatedAt: "",
    },
  ];

  // "chair" and "said" must not count as an "ai" match.
  const falsePositive = computeRelevance({
    title: "I said the chair is fine",
    description: "Nothing relevant here.",
    language: null,
    topics,
  });
  assert.deepEqual(falsePositive.matchedTopics, []);

  const truePositive = computeRelevance({
    title: "AI for operations",
    description: "",
    language: null,
    topics,
  });
  assert.deepEqual(truePositive.matchedTopics, ["ai"]);
});
