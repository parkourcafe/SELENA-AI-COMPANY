import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { DiagnosticType } from "./contracts";

/**
 * Phase 1 "mocked end-to-end MVP" run encoding (SSOT §20 Phase 1, §29).
 *
 * There is no live Supabase project yet (Decision Log D-005, NEEDS_OWNER),
 * so a submitted check cannot be persisted server-side across requests.
 * Instead the run is a small signed, self-contained token: everything
 * needed to regenerate the same deterministic mock report is encoded in
 * the token itself and verified with an HMAC. This is an explicit,
 * temporary substitute for real persistence — swap for a `diagnostic_runs`
 * row once D-005 is resolved (see SELENA_VISIBILITY_IMPLEMENTATION_PLAN_V1.md).
 *
 * Because the underlying evidence is always mock/fixture data at this
 * phase, HMAC tampering resistance here is about integrity (a user
 * shouldn't be able to hand-edit their score), not confidentiality.
 */

export interface MockRunPayload {
  v: 1;
  diagnosticType: DiagnosticType;
  website: string;
  registrableDomain: string;
  brandName: string;
  market: string;
  language: string;
  category: string;
  competitor: string | null;
  createdAt: string;
  /**
   * Set once the (mocked) unlock step completes. The email address used
   * to unlock is never embedded here (SSOT §14.5: "no PII in URL") — it
   * is validated by the unlock route and then discarded, not persisted,
   * because no Supabase project or legal/privacy sign-off exists yet
   * (Decision Log D-001, D-002, D-005). Real collection begins in PR-06.
   */
  unlocked?: boolean;
}

const SIGNING_SECRET =
  process.env.VISIBILITY_MOCK_SIGNING_SECRET && process.env.VISIBILITY_MOCK_SIGNING_SECRET.length >= 16
    ? process.env.VISIBILITY_MOCK_SIGNING_SECRET
    : randomBytes(32).toString("hex");

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string | null {
  try {
    return Buffer.from(input, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function sign(payload: string): string {
  return createHmac("sha256", SIGNING_SECRET).update(payload).digest("base64url");
}

export function encodeMockRun(payload: Omit<MockRunPayload, "v">): string {
  const full: MockRunPayload = { v: 1, ...payload };
  const body = base64UrlEncode(JSON.stringify(full));
  const signature = sign(body);
  return `${body}.${signature}`;
}

function isMockRunPayload(value: unknown): value is MockRunPayload {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    record.v === 1 &&
    typeof record.diagnosticType === "string" &&
    typeof record.website === "string" &&
    typeof record.registrableDomain === "string" &&
    typeof record.brandName === "string" &&
    typeof record.market === "string" &&
    typeof record.language === "string" &&
    typeof record.category === "string" &&
    (record.competitor === null || typeof record.competitor === "string") &&
    typeof record.createdAt === "string" &&
    (record.unlocked === undefined || typeof record.unlocked === "boolean")
  );
}

export function withUnlocked(payload: MockRunPayload): string {
  return encodeMockRun({ ...payload, unlocked: true });
}

export function decodeMockRun(token: string): MockRunPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  if (!body || !signature) return null;

  const expected = sign(body);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return null;
  }

  const json = base64UrlDecode(body);
  if (!json) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  return isMockRunPayload(parsed) ? parsed : null;
}
