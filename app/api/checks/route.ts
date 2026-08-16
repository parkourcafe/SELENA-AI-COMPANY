import { NextResponse } from "next/server";
import {
  normalizeSubmittedUrl,
  sanitizeShortText,
} from "@/lib/diagnostics/validators";
import { runLiveCheck } from "@/lib/visibility/liveReport";
import { checkRateLimit, clientIpFrom } from "@/lib/visibility/security/rate-limit";
import { PRIMARY_ACTIONS, type PrimaryAction } from "@/lib/visibility/measurement";
import { VERSIONS } from "@/lib/diagnostics/contracts";
import type { SiteProfile } from "@/lib/visibility/types";

export const runtime = "nodejs";
/** Bounded so the crawl cannot outlive the platform's function limit. */
export const maxDuration = 30;

const MAX_BODY_BYTES = 8_000;
const TOTAL_BUDGET_MS = 20_000;
const SITE_PROFILES: SiteProfile[] = ["all_checks", "content_site", "api_application", "commerce"];

/**
 * Free Visibility Check — runs a real check against the submitted site.
 *
 * Public Readiness is measured from up to five public pages with deterministic,
 * versioned rules. This endpoint has no execution path to paid AI-answer
 * providers, so observed mentions, citations and recommendations are absent.
 *
 * The crawl runs synchronously inside the request. The architecture
 * (§9.9) rightly warns against that for the full pipeline — crawl plus
 * PageSpeed plus AI calls — but this is the bounded technical subset:
 * a handful of public GETs under a hard total budget, no provider calls.
 * The proper async job model lands with durable storage (D-005); until
 * then this keeps the free check genuinely instant instead of promising
 * a result that never arrives.
 */
export async function POST(request: Request) {
  const ip = clientIpFrom(request.headers);
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "RATE_LIMITED", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "FETCH_TOO_LARGE" }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_URL" }, { status: 400 });
  }

  const record = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;

  const urlResult = normalizeSubmittedUrl(record.website);
  if (!urlResult.ok) {
    return NextResponse.json({ ok: false, error: urlResult.error }, { status: 400 });
  }

  const rawAction = sanitizeShortText(record.primaryAction, 40);
  const primaryAction: PrimaryAction = (PRIMARY_ACTIONS as string[]).includes(rawAction)
    ? (rawAction as PrimaryAction)
    : "other";
  const locale = record.locale === "ru" ? "ru" : "en";
  const requestedProfile = sanitizeShortText(record.siteProfile, 40) as SiteProfile;
  const siteProfile = SITE_PROFILES.includes(requestedProfile) ? requestedProfile : "all_checks";

  try {
    const report = await runLiveCheck({
      url: urlResult.value.url,
      primaryAction,
      siteProfile,
      locale,
      totalBudgetMs: TOTAL_BUDGET_MS,
    });

    return NextResponse.json({
      ok: true,
      methodologyVersion: VERSIONS.methodology,
      remainingChecks: limit.remaining,
      report,
    });
  } catch {
    // A crawl failure must not read as "your site is broken" — it is our
    // check that failed, and the message needs to say so.
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
