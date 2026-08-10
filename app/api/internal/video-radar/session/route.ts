import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/diagnostics/flags";
import { radarError, readJsonBody } from "@/lib/video-radar/api";
import { RADAR_OPERATOR_COOKIE, radarOperatorToken } from "@/lib/video-radar/auth";

export const runtime = "nodejs";

/**
 * Exchanges the operator token for a cookie so the browser UI can render.
 *
 * Not a login: there is no user, no session record and nothing to attribute.
 * It exists because the same secret has to reach server components, and a
 * token pasted into a URL would end up in logs and browser history.
 *
 * Deliberately NOT rate-limited here — the existing in-process limiter
 * (lib/visibility/security/rate-limit.ts) documents that it resets on cold
 * start, which is too weak to be the only thing standing between a guesser and
 * an operator token. The real defence is that the token is a long random secret
 * the owner generates, and the constant-time compare in checkOperator.
 */
export async function POST(request: Request) {
  if (!isFeatureEnabled("VIDEO_RADAR_ENABLED")) return radarError("RADAR_DISABLED", 404);

  const expected = radarOperatorToken();
  if (!expected) return radarError("UNAUTHORIZED", 401);

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  if (typeof body.value.token !== "string" || body.value.token !== expected) {
    return radarError("UNAUTHORIZED", 401);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(RADAR_OPERATOR_COOKIE, expected, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

/** Sign out — clears the cookie. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(RADAR_OPERATOR_COOKIE);
  return response;
}
