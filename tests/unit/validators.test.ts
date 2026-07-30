import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeSubmittedUrl,
  normalizeMarket,
  normalizeLanguage,
  isValidIdempotencyKey,
  sanitizeShortText,
} from "@/lib/diagnostics/validators";

test("normalizeSubmittedUrl accepts a bare domain and adds https", () => {
  const result = normalizeSubmittedUrl("example.com");
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.url, "https://example.com/");
    assert.equal(result.value.registrableDomain, "example.com");
  }
});

test("normalizeSubmittedUrl strips a www prefix from the registrable domain", () => {
  const result = normalizeSubmittedUrl("https://www.example.com/page");
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.registrableDomain, "example.com");
  }
});

test("normalizeSubmittedUrl rejects non-http(s) schemes", () => {
  assert.equal(normalizeSubmittedUrl("ftp://example.com").ok, false);
  assert.equal(normalizeSubmittedUrl("javascript:alert(1)").ok, false);
});

test("normalizeSubmittedUrl rejects credentials embedded in the URL", () => {
  assert.equal(normalizeSubmittedUrl("https://user:pass@example.com").ok, false);
});

test("normalizeSubmittedUrl rejects empty/garbage input", () => {
  assert.equal(normalizeSubmittedUrl("").ok, false);
  assert.equal(normalizeSubmittedUrl("   ").ok, false);
  assert.equal(normalizeSubmittedUrl(undefined).ok, false);
  assert.equal(normalizeSubmittedUrl("not a url").ok, false);
});

test("normalizeMarket accepts a reasonable market string", () => {
  const result = normalizeMarket("Indonesia / Bali");
  assert.equal(result.ok, true);
});

test("normalizeLanguage accepts ISO-ish language tags and lowercases them", () => {
  const result = normalizeLanguage("EN");
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value, "en");

  assert.equal(normalizeLanguage("english").ok, false);
});

test("isValidIdempotencyKey requires a UUID shape", () => {
  assert.equal(isValidIdempotencyKey("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(isValidIdempotencyKey("not-a-uuid"), false);
  assert.equal(isValidIdempotencyKey(123), false);
});

test("sanitizeShortText trims, bounds length and drops control characters", () => {
  assert.equal(sanitizeShortText("  hello  ", 10), "hello");
  assert.equal(sanitizeShortText("a".repeat(20), 5), "aaaaa");
  assert.equal(sanitizeShortText(42, 5), "");
});
