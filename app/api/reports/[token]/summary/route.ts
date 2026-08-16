import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** The legacy summary endpoint is retired with the token report family. */
export function GET() {
  return NextResponse.json({ ok: false, error: "REPORT_RETIRED", canonicalUrl: "/check" }, { status: 410 });
}
