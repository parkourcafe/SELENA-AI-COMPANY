import { NextResponse } from "next/server";
import { decodeMockRun } from "@/lib/diagnostics/mockRun";
import { isFeatureEnabled } from "@/lib/diagnostics/flags";

export const runtime = "nodejs";

/**
 * Mock status endpoint (SSOT §13.2). There is no real queue behind this
 * yet, so there is nothing to be honestly "in progress" — a valid token
 * always decodes to `report_ready`. This keeps the response shape stable
 * for PR-04 (real crawler) to later fill in with genuine intermediate
 * stages instead of changing the contract.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isFeatureEnabled("VISIBILITY_FREE_CHECK_ENABLED")) {
    return NextResponse.json({ ok: false, error: "PROVIDER_UNAVAILABLE" }, { status: 503 });
  }

  const { id } = await context.params;
  const payload = decodeMockRun(id);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "TOKEN_INVALID" }, { status: 404 });
  }

  return NextResponse.json({
    status: "report_ready",
    completedStages: [
      "discovering",
      "crawling",
      "technical_analysis",
      "ai_sampling",
      "scoring",
      "report_ready",
    ],
    availableSections: ["public_readiness", "entity_clarity", "ai_sample", "conversion_path"],
    partial: false,
  });
}
