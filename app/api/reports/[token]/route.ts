import { NextResponse } from "next/server";
import { decodeMockRun } from "@/lib/diagnostics/mockRun";
import { buildMockVisibilityReport, toFullJson, toSummaryJson } from "@/lib/diagnostics/mockEvidence";
import { isLegacyMockReportEnabled } from "@/lib/diagnostics/flags";

export const runtime = "nodejs";

/**
 * Full report payload (SSOT §13, §7). Gated: returns the ungated summary
 * shape until the token has been through /unlock (payload.unlocked).
 */
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  if (!isLegacyMockReportEnabled()) {
    return NextResponse.json({ ok: false, error: "REPORT_NOT_FOUND" }, { status: 404 });
  }

  const { token } = await context.params;
  const payload = decodeMockRun(token);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "REPORT_NOT_FOUND" }, { status: 404 });
  }

  const report = buildMockVisibilityReport(payload, payload.createdAt);

  if (!payload.unlocked) {
    return NextResponse.json({ ...toSummaryJson(report), unlocked: false }, { status: 200 });
  }

  return NextResponse.json({ ...toFullJson(report), unlocked: true });
}
