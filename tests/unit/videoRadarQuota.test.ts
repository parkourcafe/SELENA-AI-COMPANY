import { test } from "node:test";
import assert from "node:assert/strict";
import { toProviderError } from "@/lib/video-radar/providers/youtube";
import { creatorFromSeedRow } from "@/lib/video-radar/seed";

test("an exhausted daily quota is never retried, whatever status code it arrives as", () => {
  // The shape YouTube actually returned in the live run: HTTP 429 with reason
  // rateLimitExceeded, which by status alone is indistinguishable from "slow
  // down". Retrying tripled the wall clock and bought nothing.
  const daily = toProviderError(429, {
    error: {
      code: 429,
      message:
        "Quota exceeded for quota metric 'Search Queries' and limit 'Search Queries per day' of service 'youtube.googleapis.com'.",
      errors: [{ reason: "rateLimitExceeded" }],
    },
  });

  assert.equal(daily.code, "PROVIDER_QUOTA_EXCEEDED");
  assert.equal(daily.retryable, false);
});

test("a genuine rate limit is still retried", () => {
  const transient = toProviderError(429, {
    error: { code: 429, message: "Too many requests, please retry.", errors: [{ reason: "rateLimitExceeded" }] },
  });

  assert.equal(transient.code, "PROVIDER_RATE_LIMITED");
  assert.equal(transient.retryable, true);
});

test("the classic quotaExceeded reason is still recognised", () => {
  const classic = toProviderError(403, {
    error: { code: 403, message: "The request cannot be completed.", errors: [{ reason: "quotaExceeded" }] },
  });

  assert.equal(classic.code, "PROVIDER_QUOTA_EXCEEDED");
  assert.equal(classic.retryable, false);
});

test("a bad key is an auth failure, not a quota problem", () => {
  const auth = toProviderError(403, {
    error: { code: 403, message: "API key not valid.", errors: [{ reason: "badRequest" }] },
  });

  assert.equal(auth.code, "PROVIDER_AUTH_FAILED");
  assert.equal(auth.retryable, false);
});

test("the seed file's own documentation never becomes a watchlist entry", () => {
  // creators.seed.json documents its format with a `shape` example. Seeding
  // that would make the Radar spend quota every run asking about a channel
  // that does not exist.
  assert.equal(creatorFromSeedRow({ externalChannelId: "UC… (real YouTube channel id)" }), null);
  assert.equal(creatorFromSeedRow({ externalChannelId: "UC123" }), null);
  assert.equal(creatorFromSeedRow({ channelName: "No id at all" }), null);
  assert.equal(creatorFromSeedRow(null), null);
  assert.equal(creatorFromSeedRow("UCaaaaaaaaaaaaaaaaaaaaaa"), null);
});

test("a real seed row fills its own gaps rather than being rejected", () => {
  const creator = creatorFromSeedRow({ externalChannelId: "UCaaaaaaaaaaaaaaaaaaaaaa" });

  assert.ok(creator);
  assert.equal(creator.externalChannelId, "UCaaaaaaaaaaaaaaaaaaaaaa");
  assert.equal(creator.channelUrl, "https://www.youtube.com/channel/UCaaaaaaaaaaaaaaaaaaaaaa");
  assert.equal(creator.active, true);
  // A neutral middle, not a judgement the seeder invented about the channel.
  assert.equal(creator.priority, 3);
  assert.deepEqual(creator.tags, []);
  assert.equal(creator.subscriberCount, null);
});

test("priority is clamped instead of trusted", () => {
  assert.equal(creatorFromSeedRow({ externalChannelId: "UCaaaaaaaaaaaaaaaaaaaaaa", priority: 99 })?.priority, 5);
  assert.equal(creatorFromSeedRow({ externalChannelId: "UCaaaaaaaaaaaaaaaaaaaaaa", priority: -4 })?.priority, 1);
  assert.equal(creatorFromSeedRow({ externalChannelId: "UCaaaaaaaaaaaaaaaaaaaaaa", priority: "x" })?.priority, 3);
});
