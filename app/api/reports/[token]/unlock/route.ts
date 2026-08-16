import { NextResponse } from "next/server";
import { decodeMockRun, withUnlocked } from "@/lib/diagnostics/mockRun";
import { isLegacyMockReportEnabled } from "@/lib/diagnostics/flags";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mock unlock (SSOT §13.4, §5.3). The submitted email is validated to
 * exercise the real contract shape, then discarded — it is never stored,
 * logged or forwarded anywhere. Actually collecting an email requires a
 * legal entity and privacy contact (Decision Log D-001/D-002, both
 * NEEDS_OWNER) and a real transactional email provider (D-003); none of
 * that exists yet, so this route cannot honestly do more than validate
 * and hand back an "unlocked" token. Wire real persistence + delivery in
 * PR-06 once those decisions land.
 */
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!isLegacyMockReportEnabled()) {
    return NextResponse.json({ ok: false, error: "REPORT_NOT_FOUND" }, { status: 404 });
  }

  const { token } = await context.params;
  const payload = decodeMockRun(token);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "REPORT_NOT_FOUND" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 400 });
  }

  const record = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const consentVersion = typeof record.consentVersion === "string" ? record.consentVersion.trim() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 400 });
  }
  if (!consentVersion) {
    return NextResponse.json({ ok: false, error: "CONSENT_REQUIRED" }, { status: 400 });
  }

  // Intentionally not read again below: validated for contract shape, then dropped.
  void email;

  const unlockedToken = payload.unlocked ? token : withUnlocked(payload);
  const reportPath = payload.language.startsWith("ru")
    ? `/ru/report/${unlockedToken}`
    : `/report/${unlockedToken}`;

  return NextResponse.json({ ok: true, unlockedToken, reportPath });
}
