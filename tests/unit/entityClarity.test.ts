import { test } from "node:test";
import assert from "node:assert/strict";
import { computeEntityClarity } from "@/lib/visibility/scoring/entityClarity";
import { extractHtmlSignals } from "@/lib/visibility/checks/htmlSignals";

test("computeEntityClarity measures identity/geography/proof from JSON-LD and marks the rest not_measured", () => {
  const html = `
    <title>Other Bali</title>
    <script type="application/ld+json">
      {"@type":"LocalBusiness","name":"Other Bali","areaServed":"Bali"}
    </script>
  `;
  const signals = extractHtmlSignals(html);
  const result = computeEntityClarity(signals);

  const byId = new Map(result.dimensions.map((d) => [d.id, d]));
  assert.equal(byId.get("identity_who")?.status, "measured");
  assert.equal(byId.get("geography")?.status, "measured");
  assert.equal(byId.get("proof_consistency")?.status, "measured");
  assert.equal(byId.get("proof_consistency")?.score, byId.get("proof_consistency")?.max);
  assert.equal(byId.get("offer_what")?.status, "not_measured");
  assert.equal(byId.get("audience_who_for")?.status, "not_measured");
  assert.ok(result.coverage > 0 && result.coverage < 1);
});

test("computeEntityClarity flags an inconsistent brand name instead of silently passing", () => {
  const html = `
    <title>Completely Different Brand Name</title>
    <script type="application/ld+json">{"@type":"Organization","name":"Other Bali"}</script>
  `;
  const signals = extractHtmlSignals(html);
  const result = computeEntityClarity(signals);
  const proof = result.dimensions.find((d) => d.id === "proof_consistency")!;
  assert.equal(proof.status, "measured");
  assert.ok(proof.score < proof.max);
});

test("computeEntityClarity returns coverage 0 and all not_measured with no structured data at all", () => {
  const signals = extractHtmlSignals("<title>No Schema Here</title>");
  const result = computeEntityClarity(signals);
  assert.equal(result.coverage, 0);
  assert.ok(result.dimensions.every((d) => d.status === "not_measured"));
});
