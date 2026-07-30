/**
 * V1.2 measurement model (Codex Execution TZ V1.2, decisions 10–13).
 *
 * The product measures four separate layers and never collapses them into
 * one universal score. Action Readiness in particular is three genuinely
 * independent states — a visible button, a WhatsApp link or JSON-LD does
 * NOT by itself prove agent execution (decision 13).
 */

/**
 * Provenance of every value rendered in a report. PR-01 ships only
 * `sample` data; the other members exist so live evidence can be added
 * later without changing the render contract.
 */
export type SourceStatus = "sample" | "observed" | "provider" | "derived" | "unavailable";

export type MeasurementLayerId =
  | "discoverability"
  | "understanding"
  | "recommendation_evidence"
  | "action_readiness";

export type EvidenceState = "pass" | "warn" | "fail" | "info" | "not_measured";

export interface EvidenceRow {
  label: string;
  value: string;
  state: EvidenceState;
  sourceStatus: SourceStatus;
  /** What this specific row does not prove. Optional but strongly preferred. */
  limitation?: string;
}

/** Recommendation Evidence is reported as disclosed ratios, never as a score. */
export interface EvidenceRatio {
  label: string;
  matched: number;
  total: number;
  sourceStatus: SourceStatus;
  note?: string;
}

/**
 * The three Action Readiness states (decision 12). Each is measured and
 * reported separately; passing one says nothing about the others.
 */
export type ActionReadinessStateId = "human_ready" | "machine_readable" | "agent_executable";

export interface ActionReadinessState {
  id: ActionReadinessStateId;
  label: string;
  definition: string;
  state: EvidenceState;
  sourceStatus: SourceStatus;
  finding: string;
  /** Mandatory: the honest limit of what this state demonstrates. */
  doesNotProve: string;
}

/** Ordered path a customer or agent must complete end to end. */
export type ActionPathStepId =
  | "discovery"
  | "business_understood"
  | "primary_action_found"
  | "action_understandable"
  | "action_completable"
  | "confirmation_detected";

export interface ActionPathStep {
  id: ActionPathStepId;
  label: string;
  state: EvidenceState;
  sourceStatus: SourceStatus;
  note: string;
}

export interface MeasurementLayer {
  id: MeasurementLayerId;
  title: string;
  question: string;
  description: string;
}

/** Business model profile. Local Business Mode is one of these, not a separate scanner (decision 14). */
export type BusinessModel =
  | "local_business"
  | "online_service"
  | "saas"
  | "ecommerce"
  | "marketplace"
  | "hospitality";

export type PrimaryAction =
  | "call"
  | "whatsapp"
  | "book"
  | "order"
  | "request_quote"
  | "schedule_demo"
  | "apply"
  | "visit"
  | "other";

export const BUSINESS_MODELS: BusinessModel[] = [
  "local_business",
  "online_service",
  "saas",
  "ecommerce",
  "marketplace",
  "hospitality",
];

export const PRIMARY_ACTIONS: PrimaryAction[] = [
  "call",
  "whatsapp",
  "book",
  "order",
  "request_quote",
  "schedule_demo",
  "apply",
  "visit",
  "other",
];

/** Business models for which Local Business Mode is inferred when not explicitly chosen. */
export const LOCAL_BUSINESS_MODE_MODELS: BusinessModel[] = ["local_business", "hospitality"];

export function inferLocalBusinessMode(model: BusinessModel): boolean {
  return LOCAL_BUSINESS_MODE_MODELS.includes(model);
}
