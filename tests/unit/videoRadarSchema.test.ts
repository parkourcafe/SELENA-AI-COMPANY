import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FACT_REQUIRED_PREFIX,
  normalizeFactRequirement,
  validateAnalysis,
  type StructuredAnalysis,
} from "@/lib/video-radar/analysis/schema";
import { classifyVideoType, isComparableType, parseIsoDurationSeconds } from "@/lib/video-radar/videoType";

const PROJECTS = ["villaops", "kora-food-hall"];

function validAnalysis(): StructuredAnalysis {
  return {
    summary: "A creator time-boxes a build and reports the measured outcome.",
    hook: { observed: true, text: "I gave myself seven days.", basis: "transcript" },
    core_idea: "A constrained experiment with a checkable result.",
    structure: [{ step: 1, label: "Setup", description: "States the constraint up front." }],
    mechanics: [{ canonical_name: "experiment", category: "format", description: "Time-boxed test." }],
    evidence: [{ claim: "Opens by naming a seven-day limit.", source: "transcript" }],
    likely_contributing_factors: [
      { factor: "Clear stakes", reasoning: "The constraint is stated early.", confidence: "medium" },
    ],
    reusable_pattern: {
      canonical_name: "experiment",
      description: "Time-boxed experiment with a measurable outcome.",
      why_transferable: "The mechanic does not depend on the subject matter.",
    },
    confidence: "medium",
    project_adaptations: [
      {
        project_id: "villaops",
        proposed_angle: "One week mapping a villa turnover process end to end",
        proposed_hook: "What does a turnover actually cost in hours?",
        content_format: "long-form",
        rationale: "The constraint format suits an operations audit.",
        fact_requirements: ["number of villas currently managed"],
      },
    ],
  };
}

test("a well-formed analysis validates", () => {
  const result = validateAnalysis(validAnalysis(), PROJECTS);
  assert.equal(result.ok, true);
});

test("invalid model output is rejected rather than stored", () => {
  assert.equal(validateAnalysis(null, PROJECTS).ok, false);
  assert.equal(validateAnalysis("a string", PROJECTS).ok, false);
  assert.equal(validateAnalysis([], PROJECTS).ok, false);

  const missingSummary = { ...validAnalysis(), summary: "" };
  const result = validateAnalysis(missingSummary, PROJECTS);
  assert.equal(result.ok, false);
  assert.ok(result.ok === false && result.errors.some((error) => error.includes("summary")));
});

test("an unknown mechanic name is rejected so the pattern library cannot fragment", () => {
  const analysis = validAnalysis();
  const result = validateAnalysis(
    { ...analysis, mechanics: [{ canonical_name: "vibes", category: "x", description: "y" }] },
    PROJECTS,
  );
  assert.equal(result.ok, false);
  assert.ok(result.ok === false && result.errors.some((error) => error.includes("canonical_name")));
});

test("an adaptation for a project that does not exist is rejected", () => {
  const analysis = validAnalysis();
  analysis.project_adaptations[0].project_id = "totally-made-up-project";

  const result = validateAnalysis(analysis, PROJECTS);
  assert.equal(result.ok, false);
  assert.ok(
    result.ok === false &&
      result.errors.some((error) => error.includes("totally-made-up-project")),
  );
});

test("a contradictory hook is caught", () => {
  const analysis = validAnalysis();
  analysis.hook = { observed: true, text: "x", basis: "not_observed" };

  const result = validateAnalysis(analysis, PROJECTS);
  assert.equal(result.ok, false);
});

test("an unobserved hook is valid — a missing hook is a real answer", () => {
  const analysis = validAnalysis();
  analysis.hook = { observed: false, text: "", basis: "not_observed" };

  assert.equal(validateAnalysis(analysis, PROJECTS).ok, true);
});

test("empty project_adaptations is valid — no forced fit", () => {
  const analysis = validAnalysis();
  analysis.project_adaptations = [];
  assert.equal(validateAnalysis(analysis, PROJECTS).ok, true);
});

test("FACT_REQUIRED entries survive validation and normalize to the exact prefix", () => {
  const result = validateAnalysis(validAnalysis(), PROJECTS);
  assert.equal(result.ok, true);
  assert.ok(result.ok === true);
  assert.deepEqual(result.value.project_adaptations[0].fact_requirements, [
    "number of villas currently managed",
  ]);

  assert.equal(
    normalizeFactRequirement("number of villas currently managed"),
    `${FACT_REQUIRED_PREFIX} number of villas currently managed`,
  );
  // Already-prefixed input is not double-prefixed.
  assert.equal(
    normalizeFactRequirement("FACT_REQUIRED: revenue for Q2"),
    `${FACT_REQUIRED_PREFIX} revenue for Q2`,
  );
  assert.equal(
    normalizeFactRequirement("  FACT_REQUIRED:   spacing  "),
    `${FACT_REQUIRED_PREFIX} spacing`,
  );
});

test("ISO 8601 durations parse, and anything unparseable is null rather than zero", () => {
  assert.equal(parseIsoDurationSeconds("PT1M30S"), 90);
  assert.equal(parseIsoDurationSeconds("PT2H5M10S"), 7_510);
  assert.equal(parseIsoDurationSeconds("PT45S"), 45);
  assert.equal(parseIsoDurationSeconds("P1DT2H"), 93_600);

  assert.equal(parseIsoDurationSeconds(undefined), null);
  assert.equal(parseIsoDurationSeconds(""), null);
  assert.equal(parseIsoDurationSeconds("PT"), null);
  assert.equal(parseIsoDurationSeconds("90"), null);
  assert.equal(parseIsoDurationSeconds(90), null);
});

test("video type classification never guesses when duration is unknown", () => {
  assert.equal(classifyVideoType(45), "short");
  assert.equal(classifyVideoType(180), "short");
  assert.equal(classifyVideoType(181), "long");
  assert.equal(classifyVideoType(3_600), "long");

  assert.equal(classifyVideoType(null), "unknown");
  assert.equal(classifyVideoType(undefined), "unknown");
  assert.equal(classifyVideoType(0), "unknown");
  assert.equal(classifyVideoType(Number.NaN), "unknown");

  // A Shorts URL can promote an unknown duration...
  assert.equal(classifyVideoType(null, true), "short");
  // ...but never overrides a duration that says otherwise.
  assert.equal(classifyVideoType(600, true), "long");
});

test("only same-type videos are comparable", () => {
  assert.equal(isComparableType("short", "short"), true);
  assert.equal(isComparableType("long", "long"), true);
  assert.equal(isComparableType("unknown", "unknown"), true);
  assert.equal(isComparableType("short", "long"), false);
  assert.equal(isComparableType("unknown", "long"), false);
});
