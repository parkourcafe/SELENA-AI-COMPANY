/**
 * Event taxonomy (SSOT §16.1). `track()` is a stub until an analytics
 * provider and consent class are chosen (Decision Log D-018,
 * NEEDS_OWNER) — it never calls an external endpoint on its own.
 */

export const EVENT_NAMES = [
  "visibility_landing_viewed",
  "check_started",
  "check_submitted",
  "scan_queued",
  "scan_stage_changed",
  "scan_partial_ready",
  "scan_ready",
  "scan_failed",
  "partial_report_viewed",
  "email_unlock_viewed",
  "email_unlock_submitted",
  "full_report_viewed",
  "issue_opened",
  "methodology_opened",
  "report_shared",
  "rerun_requested",
  "monitor_cta_clicked",
  "audit_cta_clicked",
  "sprint_cta_clicked",
  "business_os_cta_clicked",
  "booking_started",
  "booking_completed",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];
export type ConsentClass = "transactional" | "marketing" | "anonymous_product";

export interface DiagnosticEvent {
  eventName: EventName;
  properties?: Record<string, string | number | boolean | null>;
  consentClass: ConsentClass;
  runId?: string;
  leadId?: string;
}

/**
 * No provider is configured yet (D-018). Server-side callers should still
 * call this so instrumentation sites exist and are easy to wire up later
 * — it intentionally does not throw, log PII, or call any network host.
 */
export function track(event: DiagnosticEvent): void {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[diagnostics:event]", event.eventName, event.consentClass);
  }
}
