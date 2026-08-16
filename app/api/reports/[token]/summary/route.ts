import { NextResponse } from "next/server";
import { decodeMockRun } from "@/lib/diagnostics/mockRun";
import { buildMockVisibilityReport, toSummaryJson } from "@/lib/diagnostics/mockEvidence";
import { isLegacyMockReportEnabled } from "@/lib/diagnostics/flags";

export const runtime = "nodejs";

/** Always-ungated summary (SSOT §13.3: "Возвращает только ungated value"). */
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
  return NextResponse.json(toSummaryJson(report));
}
