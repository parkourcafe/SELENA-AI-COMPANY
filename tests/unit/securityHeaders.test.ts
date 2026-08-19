import assert from "node:assert/strict";
import test from "node:test";
import { contentSecurityPolicy, publicSecurityHeaders } from "@/lib/security-headers";

test("public transport policy is restrictive", () => {
  const headers = Object.fromEntries(publicSecurityHeaders().map(({ key, value }) => [key, value]));
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(headers["Permissions-Policy"], /camera=\(\)/);
  assert.equal(headers["Access-Control-Allow-Origin"], "https://www.selenasystems.com");
});

test("CSP ships from middleware only, so a response never carries two policies", () => {
  const keys = publicSecurityHeaders().map(({ key }) => key.toLowerCase());
  assert.ok(!keys.includes("content-security-policy"));
  assert.ok(!keys.includes("content-security-policy-report-only"));
});

test("the policy is enforcing and script-src never falls back to 'unsafe-inline'", () => {
  for (const policy of [contentSecurityPolicy(), contentSecurityPolicy("dGVzdC1ub25jZQ==")]) {
    assert.match(policy, /default-src 'self'/);
    const scriptSrc = policy.split("; ").find((directive) => directive.startsWith("script-src "));
    assert.ok(scriptSrc, "script-src directive is present");
    assert.ok(!scriptSrc.includes("'unsafe-inline'"));
  }
});

test("a nonce is carried into script-src with strict-dynamic", () => {
  assert.match(
    contentSecurityPolicy("dGVzdC1ub25jZQ=="),
    /script-src 'self' 'nonce-dGVzdC1ub25jZQ==' 'strict-dynamic'/,
  );
});
