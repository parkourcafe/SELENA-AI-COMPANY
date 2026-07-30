import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  checkRateLimit,
  clientIpFrom,
  resetRateLimitForTests,
  RATE_LIMIT_CONFIG,
} from "@/lib/visibility/security/rate-limit";

/**
 * The public check makes our server fetch an arbitrary URL on request.
 * The cap is what stops that from being a free proxy, so it is tested as
 * a security control, not as a nicety.
 */

test("a client is allowed exactly the configured number of checks per window", () => {
  resetRateLimitForTests();
  const ip = "203.0.113.7";

  for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_PER_WINDOW; i += 1) {
    const result = checkRateLimit(ip);
    assert.equal(result.allowed, true, `call ${i + 1} should be allowed`);
    assert.equal(result.remaining, RATE_LIMIT_CONFIG.MAX_PER_WINDOW - (i + 1));
  }

  const blocked = checkRateLimit(ip);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.retryAfterSeconds > 0, "a blocked client must be told when to come back");
});

test("one client's usage does not consume another client's allowance", () => {
  resetRateLimitForTests();
  for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_PER_WINDOW; i += 1) checkRateLimit("198.51.100.1");

  assert.equal(checkRateLimit("198.51.100.1").allowed, false);
  assert.equal(checkRateLimit("198.51.100.2").allowed, true);
});

test("the window reopens once it has elapsed", () => {
  resetRateLimitForTests();
  const ip = "203.0.113.9";
  const start = 1_000_000;

  for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_PER_WINDOW; i += 1) checkRateLimit(ip, start);
  assert.equal(checkRateLimit(ip, start).allowed, false);

  const afterWindow = start + RATE_LIMIT_CONFIG.WINDOW_MS + 1;
  assert.equal(checkRateLimit(ip, afterWindow).allowed, true);
});

test("the client key is derived from the first forwarded address", () => {
  const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 70.41.3.18, 150.172.238.178" });
  assert.equal(clientIpFrom(headers), "203.0.113.5");

  assert.equal(clientIpFrom(new Headers({ "x-real-ip": "203.0.113.6" })), "203.0.113.6");
  assert.equal(clientIpFrom(new Headers()), "unknown");
});

test("raw IP addresses are not retained in the limiter's keys", () => {
  const source = readFileSync(
    join(process.cwd(), "lib/visibility/security/rate-limit.ts"),
    "utf8",
  );
  assert.match(source, /createHash\("sha256"\)/, "client keys must be hashed");
  assert.match(source, /randomBytes/, "the hash must be salted per process");
  assert.ok(
    !/buckets\.set\(ip/.test(source),
    "the limiter must never key its map on a raw address",
  );
});

test("the check endpoint enforces the limit before it fetches anything", () => {
  const source = readFileSync(join(process.cwd(), "app/api/checks/route.ts"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  // Measured inside the handler — the import order at the top of the file
  // says nothing about the order the calls actually run in.
  const handlerAt = source.indexOf("export async function POST");
  assert.ok(handlerAt > -1, "the endpoint must export a POST handler");
  const handler = source.slice(handlerAt);

  const limitAt = handler.indexOf("checkRateLimit");
  const fetchAt = handler.indexOf("runLiveCheck");
  assert.ok(limitAt > -1, "the endpoint must rate limit");
  assert.ok(fetchAt > -1, "the endpoint must run the live check");
  assert.ok(limitAt < fetchAt, "the limit must be applied before any outbound fetch");

  assert.match(handler, /status:\s*429/, "an exhausted client must get a 429");
  assert.match(handler, /"Retry-After"/, "a 429 must say when to retry");
  assert.ok(
    !/unsafeAllowPrivateHostsForTesting/.test(source),
    "the private-host escape hatch must never be reachable from a request",
  );
});
