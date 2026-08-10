/**
 * Shared plumbing for the internal Radar routes.
 *
 * Follows the existing API conventions (app/api/checks/route.ts): stable error
 * CODES rather than raw messages, a body-size cap before parsing, and one
 * guard used by every route so the operator check can never be forgotten on a
 * new endpoint.
 */

import { NextResponse } from "next/server";
import { checkOperator, checkRunTrigger } from "./auth";
import type { RadarErrorCode } from "./contracts";

const MAX_BODY_BYTES = 32_000;

export function radarError(code: RadarErrorCode, status: number): NextResponse {
  return NextResponse.json({ ok: false, error: code }, { status });
}

/** Returns a response when the request must be rejected, or null to continue. */
export function guardOperator(request: Request): NextResponse | null {
  const check = checkOperator(request);
  if (check.ok) return null;
  return radarError(check.code, check.status);
}

/** Run endpoint only — also accepts a scheduler's CRON_SECRET. See auth.ts. */
export function guardRunTrigger(request: Request): NextResponse | null {
  const check = checkRunTrigger(request);
  if (check.ok) return null;
  return radarError(check.code, check.status);
}

export async function readJsonBody(request: Request): Promise<
  { ok: true; value: Record<string, unknown> } | { ok: false; response: NextResponse }
> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return { ok: false, response: radarError("INVALID_INPUT", 413) };
  }
  try {
    const payload = await request.json();
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      return { ok: true, value: payload as Record<string, unknown> };
    }
  } catch {
    // Fall through to the shared invalid-input response.
  }
  return { ok: false, response: radarError("INVALID_INPUT", 400) };
}

export function toStringArray(value: unknown, maxItems = 40, maxLength = 80): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.replace(/[\x00-\x1f]/g, "").trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function toBoundedInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}
