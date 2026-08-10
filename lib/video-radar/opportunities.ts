/**
 * Turning an analysis into project-specific content opportunities
 * (spec §33, §34, §35, §36).
 *
 * The prompt asks the model to adapt the mechanic rather than the content, but
 * a prompt is a request, not a guarantee. This module is the enforcement:
 * adaptations that are too close to the source are dropped here, missing facts
 * are normalized into FACT_REQUIRED flags, and unknown projects cannot get
 * through because the slug is checked against the real registry.
 */

import type { RadarOpportunity, RadarVideo } from "./contracts";
import { isKnownProject } from "./projects";
import { normalizeFactRequirement, type StructuredAnalysis } from "./analysis/schema";
import type { OpportunityUpsert, RadarStore } from "./store/types";

/** Words too common to carry any signal about copying. */
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with", "at", "by", "from",
  "is", "are", "was", "were", "be", "been", "it", "this", "that", "my", "your", "i", "we", "you",
  "how", "what", "why", "can", "do", "does", "did", "will", "would", "should",
]);

export function contentTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

/**
 * Jaccard overlap of content words. Deliberately blunt: it catches the failure
 * mode the spec calls out — "a near-identical title with nouns replaced" —
 * which leaves most of the original wording intact. It is not, and does not
 * claim to be, a plagiarism detector.
 */
export function similarityRatio(a: string, b: string): number {
  const left = new Set(contentTokens(a));
  const right = new Set(contentTokens(b));
  if (left.size === 0 || right.size === 0) return 0;

  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / (left.size + right.size - shared);
}

export const MAX_SOURCE_SIMILARITY = 0.5;

export function isTooSimilarToSource(sourceTitle: string, proposed: string): boolean {
  return similarityRatio(sourceTitle, proposed) > MAX_SOURCE_SIMILARITY;
}

export interface OpportunityBuildInput {
  video: RadarVideo;
  analysis: StructuredAnalysis;
  /** Maps a mechanic's canonical name to the stored pattern id. */
  patternIdByName: Record<string, string>;
  outlierSummary: string;
}

export interface OpportunityBuildResult {
  opportunities: OpportunityUpsert[];
  /** Adaptations dropped by the anti-copy rule, kept so the run can report them honestly. */
  rejected: { projectId: string; reason: string }[];
}

export function buildOpportunities(input: OpportunityBuildInput): OpportunityBuildResult {
  const opportunities: OpportunityUpsert[] = [];
  const rejected: { projectId: string; reason: string }[] = [];
  const patternName = input.analysis.reusable_pattern.canonical_name;

  for (const adaptation of input.analysis.project_adaptations) {
    // Belt and braces: the validator already rejected unknown projects, but an
    // opportunity pointing at a project that does not exist is exactly the kind
    // of invented entity §34 forbids, so it is checked again at the boundary.
    if (!isKnownProject(adaptation.project_id)) {
      rejected.push({ projectId: adaptation.project_id, reason: "Unknown project id" });
      continue;
    }

    if (isTooSimilarToSource(input.video.title, adaptation.proposed_hook)) {
      rejected.push({
        projectId: adaptation.project_id,
        reason: "Proposed hook too close to the source title (anti-copy rule)",
      });
      continue;
    }
    if (isTooSimilarToSource(input.video.title, adaptation.proposed_angle)) {
      rejected.push({
        projectId: adaptation.project_id,
        reason: "Proposed angle too close to the source title (anti-copy rule)",
      });
      continue;
    }

    opportunities.push({
      sourceVideoId: input.video.id,
      projectId: adaptation.project_id,
      proposedAngle: adaptation.proposed_angle,
      proposedHook: adaptation.proposed_hook,
      contentFormat: adaptation.content_format,
      sourcePatternId: input.patternIdByName[patternName] ?? null,
      rationale: adaptation.rationale,
      evidenceSummary: input.outlierSummary,
      confidence: input.analysis.confidence,
      factRequirements: adaptation.fact_requirements.map(normalizeFactRequirement),
    });
  }

  return { opportunities, rejected };
}

export async function persistOpportunities(
  store: RadarStore,
  opportunities: OpportunityUpsert[],
): Promise<RadarOpportunity[]> {
  const saved: RadarOpportunity[] = [];
  for (const opportunity of opportunities) {
    saved.push(await store.upsertOpportunity(opportunity));
  }
  return saved;
}

/**
 * One-line evidence summary attached to every opportunity, so the reason a
 * source video was considered strong travels with the recommendation instead of
 * living only in a dashboard the reader may never open.
 */
export function outlierSummaryFor(video: RadarVideo, ratio: number | null, maturity: string): string {
  const views = typeof video.latestViews === "number" ? video.latestViews.toLocaleString("en-US") : "unknown";
  const ratioText = typeof ratio === "number" ? `${ratio.toFixed(1)}x creator baseline` : "no usable baseline";
  return `${video.channelName} — ${views} views, ${ratioText} (${maturity})`;
}
