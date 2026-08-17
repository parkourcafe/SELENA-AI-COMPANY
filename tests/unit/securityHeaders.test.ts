import assert from "node:assert/strict";
import test from "node:test";
import { publicSecurityHeaders } from "@/lib/security-headers";

test("public transport policy is restrictive and report-only for CSP", () => {
  const headers = Object.fromEntries(publicSecurityHeaders().map(({ key, value }) => [key, value]));
  assert.match(headers["Content-Security-Policy-Report-Only"], /default-src 'self'/);
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(headers["Permissions-Policy"], /camera=\(\)/);
  assert.equal(headers["Access-Control-Allow-Origin"], "https://www.selenasystems.com");
});
