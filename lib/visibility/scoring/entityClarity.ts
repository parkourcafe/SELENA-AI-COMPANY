import scoringConfig from "@/data/visibility/scoring.v1.json";
import type { HtmlSignals } from "../checks/htmlSignals";

export interface EntityClarityDimensionResult {
  id: string;
  label: string;
  score: number; // 0-max
  max: number;
  status: "measured" | "not_measured";
  note: string;
}

export interface EntityClarityResult {
  score: number; // sum of measured dimensions, 0-100
  coverage: number; // fraction of the 100 possible points that were actually measured
  dimensions: EntityClarityDimensionResult[];
}

interface JsonLdOrgFields {
  name: string | null;
  hasAddressOrAreaServed: boolean;
}

function extractOrgFields(jsonLdBlocks: unknown[]): JsonLdOrgFields {
  let name: string | null = null;
  let hasAddressOrAreaServed = false;

  function visit(node: unknown): void {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    if (typeof record.name === "string" && !name) name = record.name;
    if (record.address || record.areaServed) hasAddressOrAreaServed = true;
    if (Array.isArray(record["@graph"])) visit(record["@graph"]);
  }

  jsonLdBlocks.forEach(visit);
  return { name, hasAddressOrAreaServed };
}

function normalizeForComparison(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, " ").trim();
}

/**
 * v1 is deliberately partial (SSOT §8.4 requires a "deterministic
 * evaluator" over LLM-extracted candidate statements for the full
 * identity/offer/audience/geography/proof model — that needs an LLM
 * extraction step with its own provider/cost decision, which does not
 * exist in this codebase yet). Two of five dimensions are computed here
 * from structural signals alone; the rest are honestly `not_measured`
 * rather than faked. Extending this is future work, not a regression —
 * see docs/visibility/SELENA_VISIBILITY_RISK_REGISTER.md.
 */
export function computeEntityClarity(signals: HtmlSignals): EntityClarityResult {
  const { dimensions: config } = scoringConfig.entityClarity;
  const org = extractOrgFields(signals.jsonLdBlocks);

  const results: EntityClarityDimensionResult[] = config.map((dim) => {
    if (dim.id === "identity_who") {
      const measured = Boolean(org.name);
      return {
        id: dim.id,
        label: dim.label,
        max: dim.max,
        status: measured ? "measured" : "not_measured",
        score: measured ? dim.max : 0,
        note: measured
          ? `Structured data declares a name: "${org.name}".`
          : "No name field found in structured data.",
      };
    }

    if (dim.id === "geography") {
      const measured = org.hasAddressOrAreaServed;
      return {
        id: dim.id,
        label: dim.label,
        max: dim.max,
        status: measured ? "measured" : "not_measured",
        score: measured ? dim.max : 0,
        note: measured
          ? "Structured data declares an address or service area."
          : "No address/areaServed field found in structured data.",
      };
    }

    if (dim.id === "proof_consistency") {
      if (!org.name || !signals.title) {
        return {
          id: dim.id,
          label: dim.label,
          max: dim.max,
          status: "not_measured",
          score: 0,
          note: "Need both a page title and a structured-data name to compare.",
        };
      }
      const consistent = normalizeForComparison(signals.title).includes(normalizeForComparison(org.name));
      return {
        id: dim.id,
        label: dim.label,
        max: dim.max,
        status: "measured",
        score: consistent ? dim.max : Math.round(dim.max * 0.4),
        note: consistent
          ? "Page title and structured-data name are consistent."
          : "Page title does not contain the structured-data name — possible inconsistency.",
      };
    }

    // offer_what / audience_who_for: require content understanding beyond
    // regex-extractable signals — not implemented in v1, see note above.
    return {
      id: dim.id,
      label: dim.label,
      max: dim.max,
      status: "not_measured",
      score: 0,
      note: "Requires content/LLM-assisted extraction not implemented in this version.",
    };
  });

  const measuredMax = results.filter((r) => r.status === "measured").reduce((sum, r) => sum + r.max, 0);
  const totalMax = results.reduce((sum, r) => sum + r.max, 0);
  const earned = results.reduce((sum, r) => sum + r.score, 0);

  return {
    score: measuredMax > 0 ? Math.round((earned / measuredMax) * 100) : 0,
    coverage: totalMax > 0 ? measuredMax / totalMax : 0,
    dimensions: results,
  };
}
