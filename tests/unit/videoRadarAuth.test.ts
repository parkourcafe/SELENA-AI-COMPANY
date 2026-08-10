import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { checkOperator, checkRunTrigger, isOperatorCookieValid } from "@/lib/video-radar/auth";

const TOKEN = "a".repeat(64);
const CRON = "b".repeat(64);

function request(headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/internal/video-radar/run", { headers });
}

const saved = { ...process.env };

beforeEach(() => {
  process.env.VIDEO_RADAR_ENABLED = "true";
  process.env.VIDEO_RADAR_OPERATOR_TOKEN = TOKEN;
  delete process.env.CRON_SECRET;
});

afterEach(() => {
  process.env = { ...saved };
});

test("the Radar is invisible while the flag is off", () => {
  process.env.VIDEO_RADAR_ENABLED = "";
  const check = checkOperator(request({ "x-radar-operator-token": TOKEN }));
  assert.equal(check.ok, false);
  // 404, not 401: a disabled Radar should not advertise that it exists.
  assert.ok(check.ok === false && check.status === 404);
  assert.ok(check.ok === false && check.code === "RADAR_DISABLED");
});

test("with no token configured the gate rejects rather than becoming a no-op", () => {
  delete process.env.VIDEO_RADAR_OPERATOR_TOKEN;
  const check = checkOperator(request({ "x-radar-operator-token": TOKEN }));
  assert.equal(check.ok, false);
  assert.ok(check.ok === false && check.status === 401);
});

test("the operator token is accepted from a header or a cookie", () => {
  assert.equal(checkOperator(request({ "x-radar-operator-token": TOKEN })).ok, true);
  assert.equal(checkOperator(request({ cookie: `radar_operator=${TOKEN}` })).ok, true);
  assert.equal(
    checkOperator(request({ cookie: `other=1; radar_operator=${TOKEN}; more=2` })).ok,
    true,
  );
});

test("a wrong, empty or malformed credential is rejected", () => {
  assert.equal(checkOperator(request()).ok, false);
  assert.equal(checkOperator(request({ "x-radar-operator-token": "" })).ok, false);
  assert.equal(checkOperator(request({ "x-radar-operator-token": "b".repeat(64) })).ok, false);
  // A prefix of the real token must not pass — length mismatch is rejected first.
  assert.equal(checkOperator(request({ "x-radar-operator-token": "a".repeat(63) })).ok, false);
  assert.equal(checkOperator(request({ cookie: "radar_operator=%E0%A4%A" })).ok, false);
});

test("CRON_SECRET can trigger a run", () => {
  process.env.CRON_SECRET = CRON;
  assert.equal(checkRunTrigger(request({ authorization: `Bearer ${CRON}` })).ok, true);
  // The operator token still works on the same endpoint.
  assert.equal(checkRunTrigger(request({ "x-radar-operator-token": TOKEN })).ok, true);
});

test("CRON_SECRET cannot reach anything except the run trigger", () => {
  process.env.CRON_SECRET = CRON;
  const cronRequest = request({ authorization: `Bearer ${CRON}` });

  assert.equal(checkRunTrigger(cronRequest).ok, true);
  // The narrower reach is the point: a cron secret lives in more places than a
  // human's token, so it must not be able to edit topics or opportunities.
  assert.equal(checkOperator(cronRequest).ok, false);
});

test("a scheduler credential is only accepted when one is configured", () => {
  // No CRON_SECRET set: a bearer token must not become a bypass.
  assert.equal(checkRunTrigger(request({ authorization: `Bearer ${CRON}` })).ok, false);
  assert.equal(checkRunTrigger(request({ authorization: "Bearer " })).ok, false);
});

test("a disabled Radar stays 404 for the scheduler too", () => {
  process.env.VIDEO_RADAR_ENABLED = "";
  process.env.CRON_SECRET = CRON;

  const check = checkRunTrigger(request({ authorization: `Bearer ${CRON}` }));
  assert.equal(check.ok, false);
  assert.ok(check.ok === false && check.code === "RADAR_DISABLED");
});

test("the server-component cookie check follows the same rules", () => {
  assert.equal(isOperatorCookieValid(TOKEN), true);
  assert.equal(isOperatorCookieValid("wrong"), false);
  assert.equal(isOperatorCookieValid(undefined), false);

  process.env.VIDEO_RADAR_ENABLED = "";
  assert.equal(isOperatorCookieValid(TOKEN), false);
});
