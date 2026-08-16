import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Email unlock is retired; the canonical free result does not collect email. */
export function POST() {
  return NextResponse.json({ ok: false, error: "REPORT_RETIRED", canonicalUrl: "/check" }, { status: 410 });
}
