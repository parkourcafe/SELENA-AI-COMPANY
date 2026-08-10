import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildOpportunities,
  isTooSimilarToSource,
  outlierSummaryFor,
  similarityRatio,
} from "@/lib/video-radar/opportunities";
import { projectSlug, radarProjects, isKnownProject } from "@/lib/video-radar/projects";
import type { StructuredAnalysis } from "@/lib/video-radar/analysis/schema";
import type { RadarVideo } from "@/lib/video-radar/contracts";

const video: RadarVideo = {
  id: "youtube:src",
  platform: "youtube",
  externalVideoId: "src",
  channelId: "UCaaaaaaaaaaaaaaaaaaaaaa",
  channelName: "Builder",
  title: "I built a hospitality SaaS in 7 days",
  description: "",
  sourceUrl: "https://www.youtube.com/watch?v=src",
  thumbnailUrl: null,
  publishedAt: "2026-07-01T00:00:00.000Z",
  discoveredAt: "2026-08-01T00:00:00.000Z",
  durationSeconds: 900,
  videoType: "long",
  language: "en",
  latestViews: 50_000,
  latestLikes: 2_000,
  latestComments: 300,
  latestChannelSubscribers: 10_000,
  transcriptStatus: "available",
  analysisStatus: "completed",
  createdAt: "",
  updatedAt: "",
};

function analysisWith(
  adaptations: StructuredAnalysis["project_adaptations"],
): StructuredAnalysis {
  return {
    summary: "s",
    hook: { observed: true, text: "h", basis: "transcript" },
    core_idea: "c",
    structure: [{ step: 1, label: "l", description: "d" }],
    mechanics: [{ canonical_name: "experiment", category: "format", description: "d" }],
    evidence: [{ claim: "e", source: "transcript" }],
    likely_contributing_factors: [{ factor: "f", reasoning: "r", confidence: "medium" }],
    reusable_pattern: {
      canonical_name: "experiment",
      description: "Time-boxed experiment with a measurable outcome.",
      why_transferable: "w",
    },
    confidence: "medium",
    project_adaptations: adaptations,
  };
}

test("the project registry comes from the existing homepage projects", () => {
  const projects = radarProjects();
  const slugs = projects.map((project) => project.slug);

  assert.ok(slugs.includes("villaops"));
  assert.ok(slugs.includes("kora-food-hall"));
  assert.ok(slugs.includes("petid-care"));
  assert.ok(slugs.includes("doki-help"));
  assert.ok(slugs.includes("remhaos"));
  assert.ok(slugs.includes("otherbali"));

  // Names, urls and descriptions are read from the registry, never restated here.
  for (const project of projects) {
    assert.ok(project.name.length > 0);
    assert.ok(project.url.startsWith("https://"));
    assert.ok(project.summary.length > 0);
  }
});

test("slugs drop a meaningless .com but keep a branded TLD", () => {
  assert.equal(projectSlug("remhaos.com"), "remhaos");
  assert.equal(projectSlug("otherbali.com"), "otherbali");
  assert.equal(projectSlug("PetID.care"), "petid-care");
  assert.equal(projectSlug("Doki.help"), "doki-help");
  assert.equal(projectSlug("KORA Food Hall"), "kora-food-hall");
  assert.equal(projectSlug("VillaOps"), "villaops");
});

test("only real projects are known", () => {
  assert.equal(isKnownProject("villaops"), true);
  assert.equal(isKnownProject("some-project-that-does-not-exist"), false);
  assert.equal(isKnownProject(""), false);
});

test("similarity measures shared content words, ignoring filler", () => {
  assert.equal(similarityRatio("", "anything"), 0);
  assert.ok(similarityRatio("I built a hospitality SaaS in 7 days", "I built a hospitality SaaS in 7 days") === 1);
  assert.ok(similarityRatio("I built a hospitality SaaS in 7 days", "Planting tomatoes in the garden") < 0.1);
});

test("the anti-copy rule rejects a noun-swapped near-duplicate of the source title", () => {
  // The exact failure mode the spec calls out: same sentence, one noun changed.
  assert.equal(isTooSimilarToSource(video.title, "I built a hospitality CRM in 7 days"), true);

  const result = buildOpportunities({
    video,
    analysis: analysisWith([
      {
        project_id: "villaops",
        proposed_angle: "I built a hospitality CRM in 7 days",
        proposed_hook: "I built a hospitality CRM in 7 days",
        content_format: "long-form",
        rationale: "r",
        fact_requirements: [],
      },
    ]),
    patternIdByName: { experiment: "pattern-1" },
    outlierSummary: "summary",
  });

  assert.equal(result.opportunities.length, 0);
  assert.equal(result.rejected.length, 1);
  assert.ok(result.rejected[0].reason.includes("anti-copy"));
});

test("an adaptation that reuses the mechanic rather than the content is kept", () => {
  const result = buildOpportunities({
    video,
    analysis: analysisWith([
      {
        project_id: "villaops",
        proposed_angle: "Can one week of measurement show where villa turnover time actually goes?",
        proposed_hook: "Where does the time go between checkout and the next guest?",
        content_format: "long-form",
        rationale: "The constrained-audit mechanic transfers; the subject does not.",
        fact_requirements: ["properties currently running on VillaOps"],
      },
    ]),
    patternIdByName: { experiment: "pattern-1" },
    outlierSummary: "summary",
  });

  assert.equal(result.rejected.length, 0);
  assert.equal(result.opportunities.length, 1);
  assert.equal(result.opportunities[0].projectId, "villaops");
  assert.equal(result.opportunities[0].sourcePatternId, "pattern-1");
  // Missing facts are flagged with the exact prefix, never filled in.
  assert.deepEqual(result.opportunities[0].factRequirements, [
    "FACT_REQUIRED: properties currently running on VillaOps",
  ]);
});

test("an adaptation aimed at a non-existent project is dropped at the boundary", () => {
  const result = buildOpportunities({
    video,
    analysis: analysisWith([
      {
        project_id: "selena-crypto-fund",
        proposed_angle: "A completely different angle about measurement",
        proposed_hook: "How long does a process really take?",
        content_format: "long-form",
        rationale: "r",
        fact_requirements: [],
      },
    ]),
    patternIdByName: {},
    outlierSummary: "summary",
  });

  assert.equal(result.opportunities.length, 0);
  assert.equal(result.rejected[0].reason, "Unknown project id");
});

test("the evidence summary carries the measured reason the source was considered strong", () => {
  assert.equal(
    outlierSummaryFor(video, 12.5, "mature"),
    "Builder — 50,000 views, 12.5x creator baseline (mature)",
  );
  assert.equal(
    outlierSummaryFor({ ...video, latestViews: null }, null, "provisional"),
    "Builder — unknown views, no usable baseline (provisional)",
  );
});
