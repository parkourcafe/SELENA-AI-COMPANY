/**
 * Public-site transport policy.
 *
 * `script-src` is nonce-based. Every inline script the site ships is emitted
 * by the framework — the RSC flight payload (`self.__next_f.push`), the React
 * streaming runtime (`$RB`/`$RV`/`$RC`) and the metadata icon fixup — and
 * Next.js stamps each of them, plus its own `<script src>` chunks, with the
 * nonce it reads from the request CSP header. There is no hand-written inline
 * script to migrate, so dropping `'unsafe-inline'` here costs nothing.
 *
 * `style-src` keeps `'unsafe-inline'` on purpose: pages carry React
 * `style={{…}}` attributes whose values are computed at runtime, and CSP has
 * no nonce mechanism for style attributes.
 */
export function contentSecurityPolicy(nonce?: string) {
  // 'strict-dynamic' lets the nonced webpack runtime pull route chunks on
  // client navigation; CSP3 browsers ignore 'self' once it is present, CSP2
  // browsers ignore 'strict-dynamic' and fall back to 'self'.
  const scriptSrc = nonce
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
    : "script-src 'self'";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "form-action 'self' https://wa.me https://api.whatsapp.com",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    scriptSrc,
    "connect-src 'self'",
    "media-src 'self' https:",
    "upgrade-insecure-requests",
  ].join("; ");
}

/**
 * Everything except CSP. The policy is emitted only from middleware, because
 * only middleware can mint a per-request nonce — and because two
 * `Content-Security-Policy` headers on one response are enforced as an
 * intersection, so a second nonce-less copy here would block the very inline
 * scripts the nonce exists to allow.
 */
export function publicSecurityHeaders(origin = "https://www.selenasystems.com") {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    // The marketing site has no cross-origin browser API contract. Keep the
    // platform-injected wildcard from becoming the public document policy.
    { key: "Access-Control-Allow-Origin", value: origin },
  ];
}
