import type { HtmlSignals } from "./htmlSignals";
import type { PrimaryAction } from "../measurement";

/**
 * Real Action Readiness detection from public HTML (V1.2 §3).
 *
 * The three states are measured independently and deliberately hold a
 * high bar for the last one. Detecting a phone number proves a human can
 * act; it proves nothing about a machine. Most sites will legitimately
 * fail `agent_executable` today — reporting that honestly is the point of
 * the layer, not a defect.
 */

export type ReadinessState = "pass" | "warn" | "fail" | "not_measured";

/**
 * Evidence is returned as keys, not sentences. The detector runs on the
 * server for a report that may be read in either language, so phrasing it
 * here would hard-code English into a Russian report.
 */
export type ReadinessEvidenceKey =
  | "direct_action_link"
  | "generic_contact_only"
  | "form_present"
  | "action_schema_present"
  | "schema_without_action"
  | "no_schema"
  | "potential_action"
  | "entry_point"
  | "api_description"
  | "no_agent_signal";

export interface ReadinessEvidence {
  key: ReadinessEvidenceKey;
  /** Filled only where a count genuinely adds information. */
  count?: number;
  /** Raw schema type names, which are the same in every language. */
  detail?: string;
}

export interface ActionReadinessFindings {
  humanReady: { state: ReadinessState; found: ReadinessEvidence[] };
  machineReadable: { state: ReadinessState; found: ReadinessEvidence[] };
  agentExecutable: { state: ReadinessState; found: ReadinessEvidence[] };
}

/**
 * Shared with the Local AI Readiness diagnostic (LA-07): a Maps link is
 * only ever detected in static public HTML — no Google service is called.
 */
export const MAPS_LINK_PATTERNS = [/maps\.google/i, /goo\.gl\/maps/i] as const;

const ACTION_HREF_PATTERNS: Record<PrimaryAction, RegExp[]> = {
  call: [/^tel:/i],
  whatsapp: [/wa\.me\//i, /api\.whatsapp\.com/i, /whatsapp/i],
  book: [/\/book/i, /booking/i, /reserve/i, /calendly\.com/i, /cal\.com/i],
  order: [/\/order/i, /\/cart/i, /\/checkout/i, /\/shop/i],
  request_quote: [/\/quote/i, /\/estimate/i, /\/request/i],
  schedule_demo: [/\/demo/i, /calendly\.com/i, /cal\.com/i, /\/schedule/i],
  apply: [/\/apply/i, /\/application/i],
  visit: [/\/contact/i, /\/location/i, ...MAPS_LINK_PATTERNS],
  other: [/\/contact/i],
};

const GENERIC_CONTACT_PATTERNS = [/^mailto:/i, /^tel:/i, /wa\.me\//i, /\/contact/i];

/** schema.org action markup that actually names a machine-usable action. */
const ACTION_SCHEMA_TYPES = [
  "OrderAction",
  "ReserveAction",
  "ScheduleAction",
  "BuyAction",
  "ApplyAction",
  "CommunicateAction",
  "ContactPoint",
  "Reservation",
  "potentialAction",
];

function collectJsonLdKeys(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    node.forEach((item) => collectJsonLdKeys(item, out));
    return;
  }
  if (!node || typeof node !== "object") return;
  const record = node as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    out.add(key);
    const type = record["@type"];
    if (typeof type === "string") out.add(type);
    if (Array.isArray(type)) type.forEach((t) => typeof t === "string" && out.add(t));
    collectJsonLdKeys(value, out);
  }
}

export function detectActionReadiness(
  signals: HtmlSignals,
  primaryAction: PrimaryAction,
  html: string,
): ActionReadinessFindings {
  // --- Human-ready: can a person find and complete the action? ---
  const actionPatterns = ACTION_HREF_PATTERNS[primaryAction] ?? GENERIC_CONTACT_PATTERNS;
  const matchedActionLinks = signals.links.filter((link) =>
    actionPatterns.some((pattern) => pattern.test(link.href)),
  );
  const genericContactLinks = signals.links.filter((link) =>
    GENERIC_CONTACT_PATTERNS.some((pattern) => pattern.test(link.href)),
  );
  const hasForm = /<form\b/i.test(html);

  const humanFound: ReadinessEvidence[] = [];
  if (matchedActionLinks.length > 0) {
    humanFound.push({ key: "direct_action_link", count: matchedActionLinks.length });
  }
  if (genericContactLinks.length > 0 && matchedActionLinks.length === 0) {
    humanFound.push({ key: "generic_contact_only" });
  }
  if (hasForm) humanFound.push({ key: "form_present" });

  const humanState: ReadinessState =
    matchedActionLinks.length > 0 ? "pass" : genericContactLinks.length > 0 || hasForm ? "warn" : "fail";

  // --- Machine-readable: is the action exposed in structured form? ---
  const jsonLdKeys = new Set<string>();
  signals.jsonLdBlocks.forEach((block) => collectJsonLdKeys(block, jsonLdKeys));
  const actionSchemas = ACTION_SCHEMA_TYPES.filter((type) => jsonLdKeys.has(type));

  const machineFound: ReadinessEvidence[] = [];
  if (actionSchemas.length > 0) {
    machineFound.push({ key: "action_schema_present", detail: actionSchemas.join(", ") });
  }
  if (signals.jsonLdBlocks.length > 0 && actionSchemas.length === 0) {
    machineFound.push({ key: "schema_without_action" });
  }
  if (signals.jsonLdBlocks.length === 0) {
    machineFound.push({ key: "no_schema" });
  }

  const machineState: ReadinessState =
    actionSchemas.length > 0 ? "pass" : signals.jsonLdBlocks.length > 0 ? "warn" : "fail";

  // --- Agent-executable: can an agent complete it and verify the result? ---
  // Deliberately strict. A link, a form or a phone number is not evidence.
  const hasPotentialAction = jsonLdKeys.has("potentialAction");
  const hasEntryPoint = jsonLdKeys.has("EntryPoint") || jsonLdKeys.has("urlTemplate");
  const hasOpenApiHint = /openapi\.json|swagger|\/api\/docs|\.well-known\/ai-plugin/i.test(html);

  const agentFound: ReadinessEvidence[] = [];
  if (hasPotentialAction) agentFound.push({ key: "potential_action" });
  if (hasEntryPoint) agentFound.push({ key: "entry_point" });
  if (hasOpenApiHint) agentFound.push({ key: "api_description" });
  if (agentFound.length === 0) agentFound.push({ key: "no_agent_signal" });

  const agentSignalCount = [hasPotentialAction, hasEntryPoint, hasOpenApiHint].filter(Boolean).length;
  const agentState: ReadinessState =
    agentSignalCount >= 2 ? "pass" : agentSignalCount === 1 ? "warn" : "fail";

  return {
    humanReady: { state: humanState, found: humanFound },
    machineReadable: { state: machineState, found: machineFound },
    agentExecutable: { state: agentState, found: agentFound },
  };
}
