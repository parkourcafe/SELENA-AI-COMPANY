import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeMockRun, decodeMockRun } from "@/lib/diagnostics/mockRun";

test("encodeMockRun/decodeMockRun round-trips a valid payload", () => {
  const token = encodeMockRun({
    diagnosticType: "visibility",
    website: "https://example.com",
    registrableDomain: "example.com",
    brandName: "Example",
    market: "Indonesia / Bali",
    language: "en",
    category: "villa management",
    competitor: null,
    createdAt: "2026-07-30T00:00:00.000Z",
  });

  const decoded = decodeMockRun(token);
  assert.ok(decoded);
  assert.equal(decoded?.registrableDomain, "example.com");
  assert.equal(decoded?.brandName, "Example");
});

test("decodeMockRun rejects a tampered token", () => {
  const token = encodeMockRun({
    diagnosticType: "visibility",
    website: "https://example.com",
    registrableDomain: "example.com",
    brandName: "Example",
    market: "Indonesia / Bali",
    language: "en",
    category: "villa management",
    competitor: null,
    createdAt: "2026-07-30T00:00:00.000Z",
  });

  const [body] = token.split(".");
  const tampered = `${body}.tampered-signature`;
  assert.equal(decodeMockRun(tampered), null);
});

test("decodeMockRun rejects garbage input", () => {
  assert.equal(decodeMockRun("not-a-token"), null);
  assert.equal(decodeMockRun(""), null);
});
