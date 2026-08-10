/**
 * Operator gate for every Radar surface.
 *
 * The Phase 0 audit found no authentication anywhere in this repository, so
 * there is no existing auth to reuse (spec §4 permits new capability exactly
 * where the audit proves no equivalent exists). This is deliberately the
 * smallest thing that keeps internal research off the public internet: a
 * server-side shared secret, checked in ONE place.
 *
 * It is not user identity — no per-user attribution, and revocation means
 * rotating the secret. That trade-off is recorded as risk R-1 in
 * docs/video-radar-audit.md. When real authentication lands, this function is
 * the only thing that needs replacing.
 */

import { timingSafeEqual } from "node:crypto";
import { isFeatureEnabled } from "@/lib/diagnostics/flags";
import type { RadarErrorCode } from "./contracts";

export type OperatorCheck = { ok: true } | { ok: false; code: RadarErrorCode; status: number };

const HEADER = "x-radar-operator-token";
export const RADAR_OPERATOR_COOKIE = "radar_operator";

function safeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function radarOperatorToken(): string | null {
  const token = process.env.VIDEO_RADAR_OPERATOR_TOKEN;
  return token && token.length > 0 ? token : null;
}

/**
 * Accepts the token from a header (API clients) or a cookie (the browser UI).
 *
 * Fails closed in both directions: if the Radar flag is off it is unreachable,
 * and if no token is configured every request is rejected rather than the gate
 * silently becoming a no-op.
 */
export function checkOperator(request: Request): OperatorCheck {
  if (!isFeatureEnabled("VIDEO_RADAR_ENABLED")) {
    return { ok: false, code: "RADAR_DISABLED", status: 404 };
  }

  const expected = radarOperatorToken();
  if (!expected) return { ok: false, code: "UNAUTHORIZED", status: 401 };

  const headerToken = request.headers.get(HEADER);
  if (headerToken && safeEquals(headerToken, expected)) return { ok: true };

  const cookie = request.headers.get("cookie") ?? "";
  const match = new RegExp(`(?:^|;\\s*)${RADAR_OPERATOR_COOKIE}=([^;]+)`).exec(cookie);
  if (match) {
    let value = match[1];
    try {
      value = decodeURIComponent(value);
    } catch {
      // A malformed cookie is simply not a valid token.
    }
    if (safeEquals(value, expected)) return { ok: true };
  }

  return { ok: false, code: "UNAUTHORIZED", status: 401 };
}

/**
 * Gate for the run endpoint only: an operator, OR a scheduler.
 *
 * Vercel Cron cannot send a custom header — it sends
 * `Authorization: Bearer $CRON_SECRET` when that variable is set. Rather than
 * teach the operator token a second transport, the scheduler gets its own
 * credential with a deliberately narrower reach: `CRON_SECRET` can trigger a
 * run and nothing else. It cannot edit topics, add creators, or change an
 * opportunity's status, because those routes still call `checkOperator`.
 *
 * That split matters — a cron secret tends to live in more places (CI config,
 * a scheduler UI) than a human's token, so it should be able to do less.
 */
export function checkRunTrigger(request: Request): OperatorCheck {
  const operator = checkOperator(request);
  if (operator.ok) return operator;

  // A disabled Radar stays 404 for the scheduler too; only auth is widened here.
  if (operator.code === "RADAR_DISABLED") return operator;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return operator;

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ") && safeEquals(authorization.slice(7), cronSecret)) {
    return { ok: true };
  }

  return operator;
}

/** Server-component equivalent, for rendering the internal pages. */
export function isOperatorCookieValid(cookieValue: string | undefined): boolean {
  if (!isFeatureEnabled("VIDEO_RADAR_ENABLED")) return false;
  const expected = radarOperatorToken();
  if (!expected || !cookieValue) return false;
  return safeEquals(cookieValue, expected);
}
