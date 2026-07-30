import type { ErrorCode } from "./contracts";

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: ErrorCode };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidIdempotencyKey(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

const MARKET_RE = /^[A-Za-z][A-Za-z0-9 .,'’/-]{1,63}$/;
const LANGUAGE_RE = /^[a-z]{2}(-[A-Za-z0-9]{2,8})?$/;

/**
 * Syntactic-only URL validation for intake (SSOT §13.1). This does NOT
 * perform SSRF-safe DNS/IP checks — that happens later in the crawl stage
 * via lib/visibility/security/url-safety.ts. Rejecting obviously invalid
 * input early keeps the queue clean without pretending this is the
 * security boundary.
 */
export function normalizeSubmittedUrl(input: unknown): ValidationResult<{ url: string; registrableDomain: string }> {
  if (typeof input !== "string" || !input.trim()) {
    return { ok: false, error: "INVALID_URL" };
  }

  const candidate = input.trim();
  const withScheme = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, error: "INVALID_URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "INVALID_URL" };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: "INVALID_URL" };
  }
  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    return { ok: false, error: "INVALID_URL" };
  }

  const registrableDomain = parsed.hostname.toLowerCase().replace(/^www\./, "");

  return {
    ok: true,
    value: { url: parsed.toString(), registrableDomain },
  };
}

export function normalizeMarket(input: unknown): ValidationResult<string> {
  if (typeof input !== "string" || !MARKET_RE.test(input.trim())) {
    return { ok: false, error: "INVALID_URL" };
  }
  return { ok: true, value: input.trim() };
}

export function normalizeLanguage(input: unknown): ValidationResult<string> {
  if (typeof input !== "string") {
    return { ok: false, error: "INVALID_URL" };
  }
  const lowered = input.trim().toLowerCase();
  if (!LANGUAGE_RE.test(lowered)) {
    return { ok: false, error: "INVALID_URL" };
  }
  return { ok: true, value: lowered };
}

export function sanitizeShortText(input: unknown, maxLength: number): string {
  if (typeof input !== "string") return "";
  return input.replace(/[\x00-\x1f]/g, "").trim().slice(0, maxLength);
}
