import { test } from "node:test";
import assert from "node:assert/strict";
import { FixtureAnalysisProvider, type AnalysisOutcome } from "@/lib/video-radar/analysis/analyze";
import type { StructuredAnalysis } from "@/lib/video-radar/analysis/schema";
import { FixtureTranscriptProvider } from "@/lib/video-radar/providers/transcript";
import { FixtureVideoProvider } from "@/lib/video-radar/providers/youtube";
import type { ProviderVideo } from "@/lib/video-radar/providers/types";
import { runRadar } from "@/lib/video-radar/run";
import { InMemoryRadarStore } from "@/lib/video-radar/store/memory";
import { classifyVideoType } from "@/lib/video-radar/videoType";
import { computeEmergence } from "@/lib/video-radar/patterns";

const NOW = new Date("2026-08-10T00:00:00.000Z");
const CHANNEL = "UCaaaaaaaaaaaaaaaaaaaaaa";
const OTHER_CHANNEL = "UCbbbbbbbbbbbbbbbbbbbbbb";

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

function video(overrides: Partial<ProviderVideo> & { externalVideoId: string }): ProviderVideo {
  const durationSeconds = overrides.durationSeconds ?? 900;
  return {
    platform: "youtube",
    channelId: CHANNEL,
    channelName: "Ops Studio",
    title: "A quiet week of operations work",
    description: "General channel content.",
    sourceUrl: `https://www.youtube.com/watch?v=${overrides.externalVideoId}`,
    thumbnailUrl: null,
    publishedAt: daysAgo(40),
    durationSeconds,
    videoType: classifyVideoType(durationSeconds),
    language: "en",
    views: 1_000,
    likes: 40,
    comments: 5,
    ...overrides,
  };
}

/** 20 unremarkable long-form uploads, all past the 72h stabilization window. */
function channelHistory(): ProviderVideo[] {
  return Array.from({ length: 20 }, (_, index) =>
    video({ externalVideoId: `hist-${index}`, publishedAt: daysAgo(20 + index) }),
  );
}

/** The video the Radar exists to find: 20x its creator's own comparable median. */
function breakoutVideo(): ProviderVideo {
  return video({
    externalVideoId: "breakout",
    title: "I mapped every villa turnover task in one week",
    description:
      "A time-boxed villa operations experiment: property management workflow, guest services and day to day operations.",
    publishedAt: daysAgo(10),
    views: 20_000,
    likes: 1_500,
    comments: 200,
  });
}

function analysisFixture(): StructuredAnalysis {
  return {
    summary: "The creator time-boxes an operations audit and reports what it cost in hours.",
    hook: { observed: true, text: "One week. Every task. Timed.", basis: "transcript" },
    core_idea: "A constrained audit with a measurable result.",
    structure: [
      { step: 1, label: "Constraint", description: "States the one-week limit up front." },
      { step: 2, label: "Method", description: "Walks through the measurement." },
      { step: 3, label: "Result", description: "Reports the total in hours." },
    ],
    mechanics: [
      { canonical_name: "experiment", category: "format", description: "Time-boxed audit." },
      { canonical_name: "transparency", category: "tone", description: "Shows the raw numbers." },
    ],
    evidence: [
      { claim: "Opens by naming a one-week limit.", source: "transcript" },
      { claim: "20,000 views against a 1,000-view creator median.", source: "baseline" },
    ],
    likely_contributing_factors: [
      {
        factor: "A checkable promise",
        reasoning: "The constraint makes the payoff concrete and verifiable.",
        confidence: "medium",
      },
    ],
    reusable_pattern: {
      canonical_name: "experiment",
      description: "Time-boxed experiment with a measurable outcome.",
      why_transferable: "The mechanic is independent of the subject matter.",
    },
    confidence: "medium",
    project_adaptations: [
      {
        project_id: "villaops",
        proposed_angle: "Measuring what one villa turnover actually costs in hours",
        proposed_hook: "Where does the time go between checkout and the next guest?",
        content_format: "long-form",
        rationale: "The constrained-audit mechanic suits an operations product.",
        fact_requirements: ["number of properties currently running on VillaOps"],
      },
    ],
  };
}

function buildRun() {
  const store = new InMemoryRadarStore();
  const videos = [...channelHistory(), breakoutVideo()];
  const videoProvider = new FixtureVideoProvider(videos, [
    {
      platform: "youtube",
      externalChannelId: CHANNEL,
      channelName: "Ops Studio",
      subscriberCount: 40_000,
      uploadsPlaylistId: "UUaaa",
    },
  ]);

  const analysisProvider = new FixtureAnalysisProvider([
    { ok: true, analysis: analysisFixture(), model: "fixture" } satisfies AnalysisOutcome,
  ]);

  const transcriptProvider = new FixtureTranscriptProvider({
    breakout: {
      status: "available",
      text: "One week. Every task. Timed. Here is what it actually cost.",
      language: "en",
      provider: "fixture",
      failureReason: null,
    },
  });

  return { store, videoProvider, analysisProvider, transcriptProvider };
}

async function seed(store: InMemoryRadarStore) {
  await store.upsertTopic({
    slug: "villa-operations",
    name: "Villa operations",
    description: "",
    active: true,
    priority: 5,
    keywords: ["villa operations", "property management", "day to day operations"],
    negativeKeywords: [],
    languages: ["en"],
    targetProjects: ["villaops"],
  });

  await store.upsertCreator({
    platform: "youtube",
    externalChannelId: CHANNEL,
    channelName: "Ops Studio",
    channelUrl: `https://www.youtube.com/channel/${CHANNEL}`,
    active: true,
    priority: 4,
    tags: [],
    languages: ["en"],
    targetProjects: ["villaops"],
    subscriberCount: null,
    lastScannedAt: null,
  });
}

test("acceptance scenario: discovery through to a project opportunity", async () => {
  const { store, videoProvider, analysisProvider, transcriptProvider } = buildRun();
  await seed(store);

  const run = await runRadar({
    store,
    videoProvider,
    transcriptProvider,
    analysisProvider,
    now: NOW,
  });

  assert.equal(run.status, "completed", `run failed: ${JSON.stringify(run.failures)}`);

  // 1-4. Videos discovered, stored and scored.
  assert.equal(run.counters.videosDiscovered, 21);
  assert.equal(run.counters.videosScored, 21);

  // 5. Only the genuine outlier clears the quality gate — quotas are not filled.
  assert.equal(run.counters.shortlisted, 1);

  const scores = await store.listScores(run.id);
  const breakout = scores.find((score) => score.videoId === "youtube:breakout");
  assert.ok(breakout, "breakout video should have been scored");
  assert.equal(breakout.shortlisted, true);

  // 6. The baseline excluded the target itself: 1,000, not something inflated by 20,000.
  assert.equal(breakout.baselineViews, 1_000);
  assert.equal(breakout.baselineSampleSize, 20);
  assert.equal(breakout.baselineConfidence, "high");
  assert.equal(breakout.outlierRatio, 20);
  assert.equal(breakout.outlierMaturity, "mature");

  // 7. The ranking is explainable, not a bare number.
  const components = (breakout.scoreComponents as { components: unknown[] }).components;
  assert.ok(Array.isArray(components) && components.length === 7);

  // 8. Transcript retrieved, 9. structured analysis stored.
  assert.equal(run.counters.transcriptsSucceeded, 1);
  assert.equal(run.counters.analysesSucceeded, 1);

  const stored = await store.getAnalysis("youtube:breakout", "radar-analysis-v1");
  assert.ok(stored);
  assert.equal(stored.model, "fixture");

  // 10. Patterns extracted and linked to the video.
  const patterns = await store.listPatterns();
  assert.ok(patterns.some((pattern) => pattern.canonicalName === "experiment"));
  assert.ok(patterns.some((pattern) => pattern.canonicalName === "transparency"));

  // 11-12. An opportunity for a project that really exists, with its missing
  // fact flagged rather than invented.
  const opportunities = await store.listOpportunities();
  assert.equal(opportunities.length, 1);
  assert.equal(opportunities[0].projectId, "villaops");
  assert.equal(opportunities[0].status, "new");
  assert.equal(opportunities[0].factRequirements.length, 1);
  assert.ok(opportunities[0].factRequirements[0].startsWith("FACT_REQUIRED:"));
  assert.ok(opportunities[0].evidenceSummary.includes("20.0x creator baseline"));
});

test("re-running is idempotent: no duplicate videos, analyses or opportunities", async () => {
  const { store, videoProvider, analysisProvider, transcriptProvider } = buildRun();
  await seed(store);

  const first = await runRadar({ store, videoProvider, transcriptProvider, analysisProvider, now: NOW });
  const second = await runRadar({ store, videoProvider, transcriptProvider, analysisProvider, now: NOW });

  assert.equal(second.status, "completed", `rerun failed: ${JSON.stringify(second.failures)}`);

  // Repeated discovery UPDATES rather than duplicating.
  assert.equal((await store.listVideos()).length, 21);
  assert.equal(second.counters.videosDiscovered, 0);
  assert.ok(second.counters.videosUpdated > 0);

  // An already-held transcript is never re-fetched.
  assert.equal(first.counters.transcriptsAttempted, 1);
  assert.equal(second.counters.transcriptsAttempted, 0);

  // An unchanged video is not re-analysed at the same prompt version.
  assert.equal(analysisProvider.calls, 1);
  assert.equal(second.counters.analysesAttempted, 0);

  // And the opportunity is not duplicated.
  assert.equal((await store.listOpportunities()).length, 1);

  // Pattern observations are keyed on (pattern, video), so counts cannot inflate.
  const patterns = await store.listPatterns();
  const experiment = patterns.find((pattern) => pattern.canonicalName === "experiment");
  assert.equal(experiment?.observationCount, 1);
});

test("an operator's save/reject decision survives re-processing", async () => {
  const { store, videoProvider, analysisProvider, transcriptProvider } = buildRun();
  await seed(store);

  await runRadar({ store, videoProvider, transcriptProvider, analysisProvider, now: NOW });
  const [opportunity] = await store.listOpportunities();
  await store.updateOpportunityStatus(opportunity.id, "saved");

  // Re-upserting the same opportunity (what a fresh analysis would do) must not
  // reset the status back to "new".
  await store.upsertOpportunity({
    sourceVideoId: opportunity.sourceVideoId,
    projectId: opportunity.projectId,
    proposedAngle: "A revised angle",
    proposedHook: opportunity.proposedHook,
    contentFormat: opportunity.contentFormat,
    sourcePatternId: opportunity.sourcePatternId,
    rationale: opportunity.rationale,
    evidenceSummary: opportunity.evidenceSummary,
    confidence: opportunity.confidence,
    factRequirements: opportunity.factRequirements,
  });

  const [after] = await store.listOpportunities();
  assert.equal(after.status, "saved");
  assert.equal(after.proposedAngle, "A revised angle");
});

test("a failed analysis is isolated: the run finishes partial, not dead", async () => {
  const { store, videoProvider, transcriptProvider } = buildRun();
  await seed(store);

  const failing = new FixtureAnalysisProvider([
    { ok: false, code: "ANALYSIS_UNAVAILABLE", message: "model unavailable" },
  ]);

  const run = await runRadar({
    store,
    videoProvider,
    transcriptProvider,
    analysisProvider: failing,
    now: NOW,
  });

  assert.equal(run.status, "partial");
  assert.equal(run.counters.analysesFailed, 1);
  assert.equal(run.counters.opportunitiesProduced, 0);
  assert.ok(run.failures.some((failure) => failure.stage === "analysis"));

  // Everything before the failure still landed — the run is degraded, not lost.
  assert.equal(run.counters.videosScored, 21);
  assert.equal(run.counters.shortlisted, 1);
});

test("a pattern is not 'emerging' just because one creator repeats it", async () => {
  const observations = [
    { patternId: "experiment", videoId: "v1", channelId: CHANNEL, observedAt: daysAgo(1), evidence: "" },
    { patternId: "experiment", videoId: "v2", channelId: CHANNEL, observedAt: daysAgo(2), evidence: "" },
    { patternId: "experiment", videoId: "v3", channelId: CHANNEL, observedAt: daysAgo(3), evidence: "" },
  ];

  const single = computeEmergence("experiment", observations, NOW);
  assert.equal(single.qualifyingVideos, 3);
  assert.equal(single.independentCreators, 1);
  assert.equal(single.emerging, false);

  const spread = computeEmergence(
    "experiment",
    [
      observations[0],
      { ...observations[1], channelId: OTHER_CHANNEL },
      { ...observations[2], channelId: "UCcccccccccccccccccccccc" },
    ],
    NOW,
  );
  assert.equal(spread.independentCreators, 3);
  assert.equal(spread.emerging, true);
  assert.deepEqual(spread.evidenceVideoIds.sort(), ["v1", "v2", "v3"]);
});

test("observations outside the recent window do not count toward emergence", () => {
  const stale = computeEmergence(
    "experiment",
    [
      { patternId: "experiment", videoId: "v1", channelId: CHANNEL, observedAt: daysAgo(200), evidence: "" },
      { patternId: "experiment", videoId: "v2", channelId: OTHER_CHANNEL, observedAt: daysAgo(180), evidence: "" },
      { patternId: "experiment", videoId: "v3", channelId: "UCddddddddddddddddddddddd", observedAt: daysAgo(160), evidence: "" },
    ],
    NOW,
  );

  assert.equal(stale.qualifyingVideos, 0);
  assert.equal(stale.emerging, false);
});
