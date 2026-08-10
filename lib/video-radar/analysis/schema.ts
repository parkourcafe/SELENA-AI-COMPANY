/**
 * Structured analysis contract (spec §31, §32, §33).
 *
 * Two things this file exists to guarantee:
 *
 * 1. **No prose parsing.** The model is constrained by a JSON schema and the
 *    result is validated again here before anything is stored. A prompt
 *    injection that talks the model into ignoring instructions still cannot
 *    produce an object that passes this validator.
 * 2. **Evidence stays separable from interpretation.** `evidence` items each
 *    carry the source they were read from; interpretation lives in separate
 *    fields. The UI renders the two under different headings, and merging them
 *    would be a data-model change, not a styling choice.
 *
 * Note the field name: `likely_contributing_factors`, never `why_it_worked`.
 * The Radar observes correlation. Naming the field after proven causality would
 * make every downstream reader believe something the data cannot support (§3).
 */

import type { Confidence } from "../contracts";

/**
 * Closed vocabulary of reusable mechanics (§31). A free-text field would
 * fragment the pattern library into synonyms — "challenge", "a challenge",
 * "challenge format" — and §38's cross-creator evidence test would then never
 * accumulate. Extend this list deliberately, with a schema version bump.
 */
export const MECHANIC_NAMES = [
  "challenge",
  "experiment",
  "transformation",
  "curiosity",
  "authority",
  "proof",
  "tutorial",
  "comparison",
  "money",
  "transparency",
  "controversy",
  "build-in-public",
  "mistake",
  "aspiration",
  "novelty",
] as const;

export type MechanicName = (typeof MECHANIC_NAMES)[number];

export const EVIDENCE_SOURCES = ["title", "description", "transcript", "metrics", "baseline"] as const;
export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number];

export const HOOK_BASES = ["transcript", "title", "description", "not_observed"] as const;

export const CONTENT_FORMATS = ["short", "long-form", "carousel", "article", "email", "thread"] as const;

/** Every missing project fact is flagged with this exact prefix (§33). */
export const FACT_REQUIRED_PREFIX = "FACT_REQUIRED:";

export interface StructuredAnalysis {
  summary: string;
  hook: { observed: boolean; text: string; basis: (typeof HOOK_BASES)[number] };
  core_idea: string;
  structure: { step: number; label: string; description: string }[];
  mechanics: { canonical_name: MechanicName; category: string; description: string }[];
  evidence: { claim: string; source: EvidenceSource }[];
  likely_contributing_factors: { factor: string; reasoning: string; confidence: Confidence }[];
  reusable_pattern: { canonical_name: MechanicName; description: string; why_transferable: string };
  confidence: Confidence;
  project_adaptations: {
    project_id: string;
    proposed_angle: string;
    proposed_hook: string;
    content_format: (typeof CONTENT_FORMATS)[number];
    rationale: string;
    fact_requirements: string[];
  }[];
}

const stringField = { type: "string" } as const;

/**
 * JSON Schema passed to the model as `output_config.format`. Structured outputs
 * require `additionalProperties: false` plus an explicit `required` list on
 * every object, and do not support length or numeric constraints — those are
 * enforced by the validator below instead.
 */
export const ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "hook",
    "core_idea",
    "structure",
    "mechanics",
    "evidence",
    "likely_contributing_factors",
    "reusable_pattern",
    "confidence",
    "project_adaptations",
  ],
  properties: {
    summary: stringField,
    hook: {
      type: "object",
      additionalProperties: false,
      required: ["observed", "text", "basis"],
      properties: {
        observed: { type: "boolean" },
        text: stringField,
        basis: { type: "string", enum: [...HOOK_BASES] },
      },
    },
    core_idea: stringField,
    structure: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["step", "label", "description"],
        properties: { step: { type: "integer" }, label: stringField, description: stringField },
      },
    },
    mechanics: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["canonical_name", "category", "description"],
        properties: {
          canonical_name: { type: "string", enum: [...MECHANIC_NAMES] },
          category: stringField,
          description: stringField,
        },
      },
    },
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claim", "source"],
        properties: { claim: stringField, source: { type: "string", enum: [...EVIDENCE_SOURCES] } },
      },
    },
    likely_contributing_factors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["factor", "reasoning", "confidence"],
        properties: {
          factor: stringField,
          reasoning: stringField,
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
    reusable_pattern: {
      type: "object",
      additionalProperties: false,
      required: ["canonical_name", "description", "why_transferable"],
      properties: {
        canonical_name: { type: "string", enum: [...MECHANIC_NAMES] },
        description: stringField,
        why_transferable: stringField,
      },
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    project_adaptations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "project_id",
          "proposed_angle",
          "proposed_hook",
          "content_format",
          "rationale",
          "fact_requirements",
        ],
        properties: {
          project_id: stringField,
          proposed_angle: stringField,
          proposed_hook: stringField,
          content_format: { type: "string", enum: [...CONTENT_FORMATS] },
          rationale: stringField,
          fact_requirements: { type: "array", items: stringField },
        },
      },
    },
  },
} as const;

export type AnalysisValidation =
  | { ok: true; value: StructuredAnalysis }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isConfidence(value: unknown): value is Confidence {
  return value === "high" || value === "medium" || value === "low";
}

function oneOf<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

/**
 * Second line of defence, applied to whatever the model returns. Hand-written
 * to match lib/diagnostics/validators.ts rather than pulling in a schema
 * library the repo does not otherwise need.
 *
 * `knownProjectIds` is required, not optional: an adaptation aimed at a project
 * that does not exist in the registry is rejected rather than stored, which is
 * what stops the model from inventing a project (§34).
 */
export function validateAnalysis(input: unknown, knownProjectIds: string[]): AnalysisValidation {
  const errors: string[] = [];
  if (!isRecord(input)) return { ok: false, errors: ["Analysis is not an object"] };

  if (!nonEmptyString(input.summary)) errors.push("summary must be a non-empty string");
  if (!nonEmptyString(input.core_idea)) errors.push("core_idea must be a non-empty string");
  if (!isConfidence(input.confidence)) errors.push("confidence must be high|medium|low");

  const hook = input.hook;
  if (!isRecord(hook) || typeof hook.observed !== "boolean" || !oneOf(hook.basis, HOOK_BASES)) {
    errors.push("hook must be { observed: boolean, text: string, basis: enum }");
  } else if (typeof hook.text !== "string") {
    errors.push("hook.text must be a string");
  } else if (hook.observed && hook.basis === "not_observed") {
    // Cheap contradiction check: a hook cannot be both observed and not observed.
    errors.push("hook.observed is true but basis is not_observed");
  }

  if (!Array.isArray(input.structure) || input.structure.length === 0) {
    errors.push("structure must be a non-empty array");
  } else if (
    !input.structure.every(
      (step) =>
        isRecord(step) &&
        typeof step.step === "number" &&
        nonEmptyString(step.label) &&
        typeof step.description === "string",
    )
  ) {
    errors.push("every structure item needs step, label and description");
  }

  if (!Array.isArray(input.mechanics) || input.mechanics.length === 0) {
    errors.push("mechanics must be a non-empty array");
  } else if (
    !input.mechanics.every(
      (mechanic) =>
        isRecord(mechanic) &&
        oneOf(mechanic.canonical_name, MECHANIC_NAMES) &&
        typeof mechanic.category === "string" &&
        typeof mechanic.description === "string",
    )
  ) {
    errors.push("every mechanic needs a known canonical_name, category and description");
  }

  if (!Array.isArray(input.evidence) || input.evidence.length === 0) {
    errors.push("evidence must be a non-empty array");
  } else if (
    !input.evidence.every(
      (item) => isRecord(item) && nonEmptyString(item.claim) && oneOf(item.source, EVIDENCE_SOURCES),
    )
  ) {
    errors.push("every evidence item needs a claim and a known source");
  }

  if (!Array.isArray(input.likely_contributing_factors)) {
    errors.push("likely_contributing_factors must be an array");
  } else if (
    !input.likely_contributing_factors.every(
      (item) =>
        isRecord(item) &&
        nonEmptyString(item.factor) &&
        typeof item.reasoning === "string" &&
        isConfidence(item.confidence),
    )
  ) {
    errors.push("every contributing factor needs factor, reasoning and confidence");
  }

  const pattern = input.reusable_pattern;
  if (
    !isRecord(pattern) ||
    !oneOf(pattern.canonical_name, MECHANIC_NAMES) ||
    !nonEmptyString(pattern.description) ||
    typeof pattern.why_transferable !== "string"
  ) {
    errors.push("reusable_pattern needs a known canonical_name, description and why_transferable");
  }

  if (!Array.isArray(input.project_adaptations)) {
    errors.push("project_adaptations must be an array");
  } else {
    input.project_adaptations.forEach((adaptation, index) => {
      if (!isRecord(adaptation)) {
        errors.push(`project_adaptations[${index}] is not an object`);
        return;
      }
      if (!nonEmptyString(adaptation.project_id) || !knownProjectIds.includes(adaptation.project_id)) {
        errors.push(
          `project_adaptations[${index}].project_id '${String(adaptation.project_id)}' is not a known project`,
        );
      }
      if (!nonEmptyString(adaptation.proposed_angle)) {
        errors.push(`project_adaptations[${index}].proposed_angle is required`);
      }
      if (!nonEmptyString(adaptation.proposed_hook)) {
        errors.push(`project_adaptations[${index}].proposed_hook is required`);
      }
      if (!oneOf(adaptation.content_format, CONTENT_FORMATS)) {
        errors.push(`project_adaptations[${index}].content_format is not a known format`);
      }
      if (!Array.isArray(adaptation.fact_requirements)) {
        errors.push(`project_adaptations[${index}].fact_requirements must be an array`);
      } else if (!adaptation.fact_requirements.every((fact) => nonEmptyString(fact))) {
        errors.push(`project_adaptations[${index}].fact_requirements entries must be non-empty strings`);
      }
    });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: input as unknown as StructuredAnalysis };
}

/**
 * Normalize a missing-fact note to the `FACT_REQUIRED:` form (§33). The model
 * is instructed to emit the prefix; normalizing here means a model that forgets
 * it still produces a flag the UI can surface, rather than a sentence that
 * reads like an established fact.
 */
export function normalizeFactRequirement(fact: string): string {
  const trimmed = fact.trim();
  if (trimmed.toUpperCase().startsWith(FACT_REQUIRED_PREFIX)) {
    return `${FACT_REQUIRED_PREFIX} ${trimmed.slice(FACT_REQUIRED_PREFIX.length).trim()}`;
  }
  return `${FACT_REQUIRED_PREFIX} ${trimmed}`;
}
