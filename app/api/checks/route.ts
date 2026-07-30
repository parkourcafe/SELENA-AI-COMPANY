import { NextResponse } from "next/server";
import {
  normalizeSubmittedUrl,
  normalizeMarket,
  normalizeLanguage,
  sanitizeShortText,
  isValidIdempotencyKey,
} from "@/lib/diagnostics/validators";
import { encodeMockRun } from "@/lib/diagnostics/mockRun";
import { VERSIONS } from "@/lib/diagnostics/contracts";
import { isFeatureEnabled } from "@/lib/diagnostics/flags";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8_000;

/**
 * Phase 1 "mocked end-to-end MVP" intake (SSOT §13.1, §20 Phase 1).
 *
 * This does NOT crawl the submitted website, call a live AI provider, or
 * write to a database — none of that exists yet (VISIBILITY_LIVE_CRAWLER_ENABLED
 * and VISIBILITY_AI_SAMPLE_ENABLED are unset). It validates input and
 * issues a signed, self-contained mock-run token (lib/diagnostics/mockRun.ts)
 * that /api/checks/:id/status and /api/reports/:token can deterministically
 * decode without shared server state. Real persistence lands once
 * Decision Log D-005 (Supabase project/region) resolves.
 */
export async function POST(request: Request) {
  if (!isFeatureEnabled("VISIBILITY_FREE_CHECK_ENABLED")) {
    return NextResponse.json({ ok: false, error: "PROVIDER_UNAVAILABLE" }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "FETCH_TOO_LARGE" }, { status: 413 });
  }

  const idempotencyKeyHeader = request.headers.get("idempotency-key");
  if (idempotencyKeyHeader && !isValidIdempotencyKey(idempotencyKeyHeader)) {
    return NextResponse.json({ ok: false, error: "INVALID_URL" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_URL" }, { status: 400 });
  }

  const record = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;

  if (record.diagnosticType !== undefined && record.diagnosticType !== "visibility") {
    return NextResponse.json({ ok: false, error: "INVALID_URL" }, { status: 400 });
  }

  const urlResult = normalizeSubmittedUrl(record.website);
  if (!urlResult.ok) {
    return NextResponse.json({ ok: false, error: urlResult.error }, { status: 400 });
  }

  const marketResult = normalizeMarket(record.market);
  if (!marketResult.ok) {
    return NextResponse.json({ ok: false, error: marketResult.error }, { status: 400 });
  }

  const languageResult = normalizeLanguage(record.language);
  if (!languageResult.ok) {
    return NextResponse.json({ ok: false, error: languageResult.error }, { status: 400 });
  }

  const brandName = sanitizeShortText(record.brandName, 120);
  const category = sanitizeShortText(record.category, 120);
  const competitor = sanitizeShortText(record.competitor, 120);

  if (!brandName || !category) {
    return NextResponse.json({ ok: false, error: "INVALID_URL" }, { status: 400 });
  }

  const token = encodeMockRun({
    diagnosticType: "visibility",
    website: urlResult.value.url,
    registrableDomain: urlResult.value.registrableDomain,
    brandName,
    market: marketResult.value,
    language: languageResult.value,
    category,
    competitor: competitor || null,
    createdAt: new Date().toISOString(),
  });

  const reportPath = languageResult.value.startsWith("ru") ? `/ru/report/${token}` : `/report/${token}`;

  return NextResponse.json({
    checkId: token,
    status: "report_ready",
    statusUrl: `/api/checks/${token}/status`,
    reportPath,
    methodologyVersion: VERSIONS.methodology,
  });
}
