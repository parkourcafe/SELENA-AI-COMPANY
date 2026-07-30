/**
 * Shared diagnostic contracts (SSOT §27.5, §27.6, §27.8, §13.6).
 * Every evidence-producing engine (Visibility, Process Check, Villa)
 * speaks this vocabulary so the report shell, routing and analytics
 * layers do not need to know provider-specific detail.
 */

export type EvidenceKind =
  | "observed"
  | "provider"
  | "user_supplied"
  | "derived"
  | "generated_explanation"
  | "unavailable";

export type CheckState = "pass" | "warn" | "fail" | "info" | "unavailable";
export type Confidence = "high" | "medium" | "low";
export type FreshnessStatus = "fresh" | "stale" | "unknown";

export interface EvidenceItem {
  id: string;
  scanId: string;
  checkVersion: string;
  kind: EvidenceKind;
  sourceType: string;
  sourceUrl?: string;
  provider?: string;
  providerReference?: string;
  observedAt: string;
  fetchedAt: string;
  freshnessStatus: FreshnessStatus;
  rawValue?: unknown;
  normalizedValue?: unknown;
  status: CheckState;
  confidence: Confidence;
  title: string;
  explanation?: string;
}

/** Versions recorded on every run/report (SSOT §27.6) — never bumped silently. */
export const VERSIONS = {
  methodology: "visibility-v1.1",
  checkCatalog: 1,
  promptSet: "commercial-core-v1",
  providerAdapter: 1,
  reportSchema: "report-v1",
  scoring: "scoring-v1",
} as const;

export type DiagnosticType = "visibility" | "process" | "villa-response";

/** Scan state machine (SSOT §11.1). */
export const SCAN_STAGES = [
  "created",
  "queued",
  "discovering",
  "crawling",
  "technical_analysis",
  "ai_sampling",
  "scoring",
  "report_ready",
] as const;
export type ScanStage = (typeof SCAN_STAGES)[number];

export const SCAN_TERMINAL_STATES = ["partial", "failed", "cancelled", "expired"] as const;
export type ScanTerminalState = (typeof SCAN_TERMINAL_STATES)[number];

export type ScanStatus = ScanStage | ScanTerminalState;

/** Stable error codes (union of SSOT §13.6 and §27.8; UI translates codes, never raw messages). */
export const ERROR_CODES = [
  "INVALID_URL",
  "BLOCKED_HOST",
  "DNS_REBINDING_RISK",
  "DNS_REBINDING_BLOCKED",
  "REDIRECT_BLOCKED",
  "UNSUPPORTED_CONTENT_TYPE",
  "FETCH_TIMEOUT",
  "FETCH_TOO_LARGE",
  "ROBOTS_DENIED",
  "ROBOTS_FETCH_FAILED",
  "SITEMAP_FETCH_FAILED",
  "PAGESPEED_UNAVAILABLE",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_BUDGET_EXCEEDED",
  "BUDGET_LIMIT_REACHED",
  "PROVIDER_RATE_LIMITED",
  "PROVIDER_AUTH_FAILED",
  "PROVIDER_RESULT_INCOMPLETE",
  "INSUFFICIENT_VALID_AI_SAMPLE",
  "JOB_TIMEOUT",
  "JOB_CANCELLED",
  "REPORT_NOT_READY",
  "REPORT_NOT_FOUND",
  "REPORT_EXPIRED",
  "REPORT_REVOKED",
  "TOKEN_INVALID",
  "EMAIL_REQUIRED",
  "CONSENT_REQUIRED",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}

/**
 * Confidence for a single scan run (SSOT §8.6). HIGH is reserved for paid
 * monitoring with repeated dates and a stable prompt set across runs — a
 * single run (Free Check or one Monitor cycle) can never return HIGH.
 */
export function singleRunConfidence(validAnswerCount: number, distinctEnvironments: number): Confidence {
  if (validAnswerCount < 4 || distinctEnvironments < 1) return "low";
  return "medium";
}
