/**
 * Deep analysis provider (spec §31, §42, §51, §54).
 *
 * The model is constrained twice: `output_config.format` makes the API enforce
 * the JSON schema, and validateAnalysis re-checks the result before anything is
 * stored. On a validation failure the model is asked once more WITH the
 * specific errors, which fixes the common case (a plausible-but-wrong enum
 * value) without an unbounded retry loop.
 *
 * Behind an interface so tests never call a live model (spec §57).
 */

import Anthropic from "@anthropic-ai/sdk";
import { radarConfig } from "../config";
import { RADAR_VERSIONS, type RadarErrorCode } from "../contracts";
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt, type AnalysisPromptInput } from "./prompt";
import { ANALYSIS_JSON_SCHEMA, validateAnalysis, type StructuredAnalysis } from "./schema";

export type AnalysisOutcome =
  | { ok: true; analysis: StructuredAnalysis; model: string }
  | { ok: false; code: RadarErrorCode; message: string };

export interface AnalysisProvider {
  readonly model: string;
  analyze(input: AnalysisPromptInput, knownProjectIds: string[]): Promise<AnalysisOutcome>;
}

export const DEFAULT_ANALYSIS_MODEL = "claude-opus-5";

/**
 * Effort is the cost lever for this pipeline (spec §28). `medium` is a
 * deliberate default for per-video analysis running over a shortlist; raise it
 * via VIDEO_RADAR_ANALYSIS_EFFORT when a run matters more than its token spend.
 */
type Effort = "low" | "medium" | "high" | "xhigh" | "max";
const EFFORTS: Effort[] = ["low", "medium", "high", "xhigh", "max"];

function configuredEffort(): Effort {
  const raw = process.env.VIDEO_RADAR_ANALYSIS_EFFORT;
  return EFFORTS.includes(raw as Effort) ? (raw as Effort) : "medium";
}

export class AnthropicAnalysisProvider implements AnalysisProvider {
  readonly model: string;

  constructor(
    private readonly client: Anthropic,
    model: string = process.env.VIDEO_RADAR_ANALYSIS_MODEL || DEFAULT_ANALYSIS_MODEL,
  ) {
    this.model = model;
  }

  async analyze(input: AnalysisPromptInput, knownProjectIds: string[]): Promise<AnalysisOutcome> {
    const basePrompt = buildAnalysisPrompt(input);
    let correction = "";

    for (let attempt = 0; attempt < 2; attempt += 1) {
      let response: Anthropic.Message;
      try {
        response = await this.client.messages.create({
          model: this.model,
          // Caps thinking plus response text together. Generous because the
          // schema is large and a truncated object fails validation entirely.
          max_tokens: 16_000,
          system: ANALYSIS_SYSTEM_PROMPT,
          output_config: {
            effort: configuredEffort(),
            format: { type: "json_schema", schema: ANALYSIS_JSON_SCHEMA },
          },
          messages: [{ role: "user", content: `${basePrompt}${correction}` }],
        });
      } catch (cause) {
        const mapped = mapAnthropicError(cause);
        // Permanent failures exit immediately; transient ones are already
        // retried by the SDK's own backoff, so re-asking here would compound it.
        if (!mapped.retryable || attempt === 1) return { ok: false, code: mapped.code, message: mapped.message };
        continue;
      }

      // Opus-family safety classifiers can decline with HTTP 200. Reading
      // content[0] without this check would throw on an empty content array.
      if (response.stop_reason === "refusal") {
        return {
          ok: false,
          code: "ANALYSIS_UNAVAILABLE",
          message: `Model declined to analyse this video (${response.stop_details?.category ?? "unspecified"})`,
        };
      }
      if (response.stop_reason === "max_tokens") {
        return {
          ok: false,
          code: "ANALYSIS_INVALID_OUTPUT",
          message: "Response hit max_tokens before the object was complete",
        };
      }

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("");

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        correction = `\n\nYour previous reply was not valid JSON. Return only the structured object.`;
        continue;
      }

      const validation = validateAnalysis(parsed, knownProjectIds);
      if (validation.ok) return { ok: true, analysis: validation.value, model: this.model };

      if (attempt === 1) {
        return {
          ok: false,
          code: "ANALYSIS_INVALID_OUTPUT",
          message: `Schema validation failed: ${validation.errors.join("; ")}`,
        };
      }
      // One targeted correction. Naming the exact failures is what makes the
      // retry worth spending tokens on.
      correction = `\n\nYour previous reply failed validation:\n- ${validation.errors.join("\n- ")}\nReturn a corrected object. Only use project_id values from the <projects> block.`;
    }

    return { ok: false, code: "ANALYSIS_INVALID_OUTPUT", message: "Exhausted analysis attempts" };
  }
}

function mapAnthropicError(cause: unknown): {
  code: RadarErrorCode;
  message: string;
  retryable: boolean;
} {
  if (cause instanceof Anthropic.AuthenticationError) {
    return { code: "PROVIDER_AUTH_FAILED", message: "Anthropic API key rejected", retryable: false };
  }
  if (cause instanceof Anthropic.PermissionDeniedError) {
    return { code: "PROVIDER_AUTH_FAILED", message: "Anthropic API key lacks access", retryable: false };
  }
  if (cause instanceof Anthropic.RateLimitError) {
    return { code: "PROVIDER_RATE_LIMITED", message: "Anthropic rate limit reached", retryable: true };
  }
  if (cause instanceof Anthropic.APIConnectionError) {
    return { code: "PROVIDER_UNAVAILABLE", message: "Could not reach the Anthropic API", retryable: true };
  }
  if (cause instanceof Anthropic.APIError) {
    return {
      code: "ANALYSIS_UNAVAILABLE",
      message: `Anthropic API error ${cause.status ?? ""}`.trim(),
      retryable: (cause.status ?? 0) >= 500,
    };
  }
  return {
    code: "INTERNAL_ERROR",
    message: cause instanceof Error ? cause.message.slice(0, 200) : "unknown analysis failure",
    retryable: false,
  };
}

/** Used when analysis is flagged off or no API key is set. The Radar still works at metadata level (§30). */
export class DisabledAnalysisProvider implements AnalysisProvider {
  readonly model = "disabled";

  async analyze(): Promise<AnalysisOutcome> {
    return {
      ok: false,
      code: "ANALYSIS_UNAVAILABLE",
      message: "Deep analysis is disabled (VIDEO_RADAR_ANALYSIS_ENABLED / ANTHROPIC_API_KEY)",
    };
  }
}

export class FixtureAnalysisProvider implements AnalysisProvider {
  readonly model = "fixture";
  calls = 0;

  constructor(private readonly outcomes: AnalysisOutcome[]) {}

  async analyze(): Promise<AnalysisOutcome> {
    const outcome = this.outcomes[Math.min(this.calls, this.outcomes.length - 1)];
    this.calls += 1;
    return (
      outcome ?? { ok: false, code: "ANALYSIS_UNAVAILABLE", message: "No fixture analysis configured" }
    );
  }
}

export function createAnalysisProvider(enabled: boolean): AnalysisProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!enabled || !apiKey) return new DisabledAnalysisProvider();
  return new AnthropicAnalysisProvider(
    new Anthropic({ apiKey, maxRetries: radarConfig.pipeline.maxProviderRetries }),
  );
}

export const ANALYSIS_PROMPT_VERSION = RADAR_VERSIONS.analysisPrompt;
export const ANALYSIS_SCHEMA_VERSION = RADAR_VERSIONS.analysisSchema;
