import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { SupabaseRadarStore } from "@/lib/video-radar/store/supabase";
import {
  FakeSupabaseClient,
  respondWith,
  type CannedResponse,
  type RecordedCall,
} from "./helpers/fakeSupabase";

function storeWith(
  byTable: Record<string, CannedResponse | ((call: RecordedCall) => CannedResponse)>,
) {
  const client = new FakeSupabaseClient(respondWith(byTable));
  const store = new SupabaseRadarStore(client as unknown as SupabaseClient<Database>);
  return { client, store };
}

const videoRow = {
  id: "11111111-1111-4111-8111-111111111111",
  platform: "youtube",
  external_video_id: "abc123",
  channel_id: "UCaaaaaaaaaaaaaaaaaaaaaa",
  channel_name: "Ops Studio",
  title: "A title",
  description: "A description",
  source_url: "https://www.youtube.com/watch?v=abc123",
  thumbnail_url: null,
  published_at: "2026-07-01T00:00:00.000Z",
  discovered_at: "2026-07-02T00:00:00.000Z",
  duration_seconds: 900,
  video_type: "long",
  language: "en",
  latest_views: 20_000,
  latest_likes: null,
  latest_comments: 200,
  latest_channel_subscribers: 40_000,
  transcript_status: "available",
  analysis_status: "completed",
  created_at: "2026-07-02T00:00:00.000Z",
  updated_at: "2026-07-03T00:00:00.000Z",
};

const videoUpsert = {
  platform: "youtube" as const,
  externalVideoId: "abc123",
  channelId: "UCaaaaaaaaaaaaaaaaaaaaaa",
  channelName: "Ops Studio",
  title: "A title",
  description: "A description",
  sourceUrl: "https://www.youtube.com/watch?v=abc123",
  thumbnailUrl: null,
  publishedAt: "2026-07-01T00:00:00.000Z",
  durationSeconds: 900,
  videoType: "long" as const,
  language: "en",
  latestViews: 20_000,
  latestLikes: null,
  latestComments: 200,
  latestChannelSubscribers: 40_000,
};

test("the store reports itself as durable", () => {
  const { store } = storeWith({});
  assert.equal(store.durable, true);
  assert.equal(store.kind, "supabase");
});

test("video upsert targets the dedupe constraint and leaves pipeline state alone", async () => {
  const { client, store } = storeWith({
    radar_videos: (call) =>
      call.operation === "select" ? { data: [], error: null } : { data: videoRow, error: null },
  });

  const result = await store.upsertVideo(videoUpsert);

  const upsert = client.callsFor("radar_videos").find((call) => call.operation === "upsert");
  assert.ok(upsert);
  assert.equal(upsert.onConflict, "platform,external_video_id");

  const payload = upsert.payload as Record<string, unknown>;
  // Re-discovery must not reset when a video was first seen, nor undo transcript
  // or analysis progress. Omitted columns are untouched on conflict.
  assert.ok(!("discovered_at" in payload));
  assert.ok(!("transcript_status" in payload));
  assert.ok(!("analysis_status" in payload));
  assert.ok(!("created_at" in payload));
  assert.equal(payload.external_video_id, "abc123");
  assert.equal(payload.latest_likes, null, "a hidden like count must stay null, not become 0");

  assert.equal(result.created, true, "no existing row was found, so this is a discovery");
  assert.equal(result.video.externalVideoId, "abc123");
  assert.equal(result.video.latestLikes, null);
  assert.equal(result.video.videoType, "long");
});

test("an existing video is reported as updated, not discovered", async () => {
  const { store } = storeWith({
    radar_videos: (call) =>
      call.operation === "select"
        ? { data: [{ id: videoRow.id }], error: null }
        : { data: videoRow, error: null },
  });

  const result = await store.upsertVideo(videoUpsert);
  assert.equal(result.created, false);
});

test("origin lookup uses IS NULL for the nullable side of the partial index", async () => {
  const { client, store } = storeWith({ radar_video_origins: { data: [], error: null } });

  await store.addOrigin({
    videoId: videoRow.id,
    kind: "topic",
    topicId: "22222222-2222-4222-8222-222222222222",
    creatorId: null,
    searchTerm: "ai agents",
    discoveredAt: "2026-08-01T00:00:00.000Z",
  });

  const select = client.callsFor("radar_video_origins").find((call) => call.operation === "select");
  assert.ok(select);

  // `eq(col, null)` renders as `col=eq.null` and matches nothing, so a topic
  // origin would be inserted again on every run.
  const creatorFilter = select.filters.find((filter) => filter.column === "creator_id");
  assert.equal(creatorFilter?.op, "is");
  assert.equal(creatorFilter?.value, null);

  const topicFilter = select.filters.find((filter) => filter.column === "topic_id");
  assert.equal(topicFilter?.op, "eq");

  assert.ok(client.callsFor("radar_video_origins").some((call) => call.operation === "insert"));
});

test("an origin that already exists is not inserted again", async () => {
  const { client, store } = storeWith({
    radar_video_origins: { data: [{ id: "existing" }], error: null },
  });

  await store.addOrigin({
    videoId: videoRow.id,
    kind: "watchlist",
    topicId: null,
    creatorId: "33333333-3333-4333-8333-333333333333",
    searchTerm: null,
    discoveredAt: "2026-08-01T00:00:00.000Z",
  });

  assert.equal(
    client.callsFor("radar_video_origins").filter((call) => call.operation === "insert").length,
    0,
  );
});

test("a concurrent unique violation on origin insert is success, not an error", async () => {
  const { store } = storeWith({
    radar_video_origins: (call) =>
      call.operation === "select"
        ? { data: [], error: null }
        : { data: null, error: { code: "23505", message: "duplicate key" } },
  });

  // The other writer created exactly the row we wanted.
  await store.addOrigin({
    videoId: videoRow.id,
    kind: "topic",
    topicId: "22222222-2222-4222-8222-222222222222",
    creatorId: null,
    searchTerm: "x",
    discoveredAt: "2026-08-01T00:00:00.000Z",
  });
});

test("a genuine insert error is not swallowed", async () => {
  const { store } = storeWith({
    radar_video_origins: (call) =>
      call.operation === "select"
        ? { data: [], error: null }
        : { data: null, error: { code: "42703", message: "column does not exist" } },
  });

  await assert.rejects(
    () =>
      store.addOrigin({
        videoId: videoRow.id,
        kind: "topic",
        topicId: "22222222-2222-4222-8222-222222222222",
        creatorId: null,
        searchTerm: "x",
        discoveredAt: "2026-08-01T00:00:00.000Z",
      }),
    /column does not exist/,
  );
});

test("snapshots and scores upsert on their run-scoped constraints", async () => {
  const { client, store } = storeWith({});

  await store.addSnapshot({
    videoId: videoRow.id,
    runId: "44444444-4444-4444-8444-444444444444",
    capturedAt: "2026-08-01T00:00:00.000Z",
    views: 100,
    likes: null,
    comments: null,
    channelSubscribers: null,
  });
  assert.equal(client.lastCall("radar_video_metrics").onConflict, "video_id,run_id");

  await store.saveScore({
    runId: "44444444-4444-4444-8444-444444444444",
    videoId: videoRow.id,
    baselineViews: 1_000,
    baselineSampleSize: 20,
    baselineConfidence: "high",
    baselineVersion: "radar-baseline-v1",
    outlierRatio: 20,
    outlierBand: "exceptional",
    outlierMaturity: "mature",
    relevanceScore: 0.8,
    candidateScore: 0.9,
    scoreComponents: { components: [] },
    scoringVersion: "radar-scoring-v1",
    shortlisted: true,
    gateReasons: [],
  });
  assert.equal(client.lastCall("radar_video_scores").onConflict, "run_id,video_id");
});

test("analyses are keyed by prompt version so a revision does not overwrite history", async () => {
  const { client, store } = storeWith({});

  await store.saveAnalysis({
    videoId: videoRow.id,
    promptVersion: "radar-analysis-v1",
    schemaVersion: "radar-analysis-schema-v1",
    model: "claude-opus-5",
    analysis: { summary: "s" } as never,
    analyzedAt: "2026-08-01T00:00:00.000Z",
  });

  assert.equal(client.lastCall("radar_analyses").onConflict, "video_id,prompt_version");
});

test("an existing pattern only advances last_seen_at", async () => {
  const { client, store } = storeWith({
    radar_patterns: {
      data: {
        id: "55555555-5555-4555-8555-555555555555",
        canonical_name: "experiment",
        description: "The original description",
        category: "format",
        first_seen_at: "2026-01-01T00:00:00.000Z",
        last_seen_at: "2026-02-01T00:00:00.000Z",
      },
      error: null,
    },
    radar_video_patterns: { count: 3, error: null },
  });

  await store.upsertPattern({
    canonicalName: "experiment",
    description: "A NEW description that must not overwrite the original",
    category: "other",
    observedAt: "2026-08-01T00:00:00.000Z",
  });

  const update = client.callsFor("radar_patterns").find((call) => call.operation === "update");
  assert.ok(update);
  const payload = update.payload as Record<string, unknown>;

  // first_seen_at and description are the pattern's history; a later
  // observation must not rewrite them.
  assert.deepEqual(Object.keys(payload), ["last_seen_at"]);
  assert.equal(payload.last_seen_at, "2026-08-01T00:00:00.000Z");
});

test("pattern observations upsert on (pattern, video) so counts cannot inflate", async () => {
  const { client, store } = storeWith({});

  await store.observePattern({
    patternId: "55555555-5555-4555-8555-555555555555",
    videoId: videoRow.id,
    channelId: "UCaaaaaaaaaaaaaaaaaaaaaa",
    observedAt: "2026-08-01T00:00:00.000Z",
    evidence: "e",
  });

  assert.equal(client.lastCall("radar_video_patterns").onConflict, "pattern_id,video_id");
});

test("re-upserting an opportunity never writes status, preserving the operator's decision", async () => {
  const existing = {
    id: "66666666-6666-4666-8666-666666666666",
    source_video_id: videoRow.id,
    project_id: "villaops",
    proposed_angle: "old angle",
    proposed_hook: "old hook",
    content_format: "long-form",
    source_pattern_id: null,
    rationale: "r",
    evidence_summary: "e",
    confidence: "medium",
    fact_requirements: [],
    status: "saved",
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
  };

  const { client, store } = storeWith({
    radar_opportunities: (call) =>
      call.operation === "update"
        ? { data: { ...existing, proposed_angle: "new angle" }, error: null }
        : { data: existing, error: null },
  });

  const result = await store.upsertOpportunity({
    sourceVideoId: videoRow.id,
    projectId: "villaops",
    proposedAngle: "new angle",
    proposedHook: "new hook",
    contentFormat: "long-form",
    sourcePatternId: null,
    rationale: "r",
    evidenceSummary: "e",
    confidence: "medium",
    factRequirements: [],
  });

  const select = client.callsFor("radar_opportunities").find((call) => call.operation === "select");
  // Nullable pattern id again needs IS NULL, not = NULL.
  assert.equal(
    select?.filters.find((filter) => filter.column === "source_pattern_id")?.op,
    "is",
  );

  const update = client.callsFor("radar_opportunities").find((call) => call.operation === "update");
  assert.ok(update);
  assert.ok(
    !("status" in (update.payload as Record<string, unknown>)),
    "re-processing must not reset a saved opportunity back to new",
  );

  assert.equal(result.status, "saved");
  assert.equal(result.proposedAngle, "new angle");
});

test("rows map from snake_case to the domain shape, nulls intact", async () => {
  const { store } = storeWith({ radar_videos: { data: [videoRow], error: null } });

  const [video] = await store.listVideos();
  assert.equal(video.externalVideoId, "abc123");
  assert.equal(video.channelId, "UCaaaaaaaaaaaaaaaaaaaaaa");
  assert.equal(video.thumbnailUrl, null);
  assert.equal(video.latestLikes, null);
  assert.equal(video.latestComments, 200);
  assert.equal(video.transcriptStatus, "available");
  assert.equal(video.discoveredAt, "2026-07-02T00:00:00.000Z");
});

test("a shortlist query resolves ids first and skips the second query when empty", async () => {
  const { client, store } = storeWith({ radar_video_scores: { data: [], error: null } });

  const videos = await store.listVideos({ shortlistedInRun: "44444444-4444-4444-8444-444444444444" });

  assert.deepEqual(videos, []);
  // No point asking for videos by an empty id list.
  assert.equal(client.callsFor("radar_videos").length, 0);
});

test("a query error surfaces as a thrown error rather than empty data", async () => {
  const { store } = storeWith({
    radar_topics: { data: null, error: { message: "permission denied" } },
  });

  await assert.rejects(() => store.listTopics(), /permission denied/);
});

test("run counters and failures survive the JSON round trip", async () => {
  const { store } = storeWith({
    radar_runs: {
      data: {
        id: "44444444-4444-4444-8444-444444444444",
        status: "partial",
        started_at: "2026-08-01T00:00:00.000Z",
        completed_at: "2026-08-01T00:10:00.000Z",
        pipeline_version: "radar-v1",
        scoring_version: "radar-scoring-v1",
        counters: { videosDiscovered: 7, shortlisted: 2 },
        failures: [
          {
            stage: "analysis",
            subjectId: "v1",
            code: "ANALYSIS_UNAVAILABLE",
            message: "m",
            occurredAt: "2026-08-01T00:05:00.000Z",
          },
        ],
      },
      error: null,
    },
  });

  const run = await store.getRun("44444444-4444-4444-8444-444444444444");
  assert.ok(run);
  assert.equal(run.status, "partial");
  assert.equal(run.counters.videosDiscovered, 7);
  assert.equal(run.counters.shortlisted, 2);
  // Counters absent from the stored JSON default to 0 rather than undefined.
  assert.equal(run.counters.analysesFailed, 0);
  assert.equal(run.failures.length, 1);
  assert.equal(run.ephemeral, false);
});
