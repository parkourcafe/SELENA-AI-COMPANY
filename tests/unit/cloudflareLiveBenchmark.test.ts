import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const record = JSON.parse(
  readFileSync(join(process.cwd(), "data/visibility/cloudflare-selena-live-benchmark-2026-08-16.json"), "utf8"),
) as {
  version: string;
  target: string;
  method: string;
  productionMutation: boolean;
  gate: string;
  mapping: Array<{ selenaRuleId: string }>;
  gateBasis: Record<string, unknown[]>;
};

test("live Cloudflare benchmark record is explicit and complete", () => {
  assert.match(record.version, /^cloudflare-selena-live-benchmark-/);
  assert.equal(record.target, "https://www.selenasystems.com");
  assert.equal(record.method, "read-only-public-url-browser-run");
  assert.equal(record.productionMutation, false);
  assert.equal(record.gate, "PASS");
  assert.equal(record.mapping.length, 15);
  assert.deepEqual(Object.values(record.gateBasis).map((items) => items.length), [0, 0, 0, 0]);
  assert.ok(record.mapping.every((item) => item.selenaRuleId.startsWith("CF-")));
});
