import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Legacy report tokens are permanently retired; Free is the canonical /check result. */
export function GET() {
  return NextResponse.json({ ok: false, error: "REPORT_RETIRED", canonicalUrl: "/check" }, { status: 410 });
}
