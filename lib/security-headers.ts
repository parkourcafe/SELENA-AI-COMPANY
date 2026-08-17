/**
 * Public-site transport policy. CSP is intentionally report-only until a
 * deployed report collector confirms the exact third-party requirements.
 */
export function publicSecurityHeaders(origin = "https://www.selenasystems.com") {
  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "form-action 'self' https://wa.me https://api.whatsapp.com",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    "media-src 'self' https:",
    "upgrade-insecure-requests",
  ].join("; ");

  return [
    { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    // The marketing site has no cross-origin browser API contract. Keep the
    // platform-injected wildcard from becoming the public document policy.
    { key: "Access-Control-Allow-Origin", value: origin },
  ];
}
