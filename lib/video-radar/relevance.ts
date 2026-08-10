/**
 * Cheap relevance filtering (spec §24).
 *
 * This runs on the whole discovery pool, so it must stay pure string work — no
 * network, no model. Its job is to stop popularity alone from dominating and to
 * cut the pool down before anything expensive happens. Optional AI
 * classification could refine this later; it is not needed to make v1 correct.
 */

import { radarConfig } from "./config";
import type { RadarCreator, RadarTopic, RelevanceResult } from "./contracts";
import { radarProjects } from "./projects";

export interface RelevanceInput {
  title: string;
  description: string;
  language: string | null;
  topics: RadarTopic[];
  creator?: Pick<RadarCreator, "priority" | "languages"> | null;
  /** Optional restriction to specific project slugs; defaults to every known project. */
  projectSlugs?: string[];
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

function containsKeyword(haystack: string, keyword: string): boolean {
  const needle = keyword.toLowerCase().trim();
  if (!needle) return false;
  // Word-boundary match for single tokens so "ai" does not match "chair";
  // multi-word keywords are matched as phrases.
  if (/^[a-z0-9]+$/i.test(needle)) {
    return new RegExp(`(^|[^a-z0-9])${needle}([^a-z0-9]|$)`, "i").test(haystack);
  }
  return haystack.includes(needle);
}

export function computeRelevance(input: RelevanceInput): RelevanceResult {
  const title = normalize(input.title ?? "");
  const description = normalize(input.description ?? "");
  const haystack = `${title} ${description}`;
  const weights = radarConfig.relevance.weights;

  const matchedTopics: string[] = [];
  const matchedKeywords = new Set<string>();
  let blockedByNegativeKeyword = false;
  let topicHits = 0;
  let titleHit = false;

  for (const topic of input.topics) {
    if (!topic.active) continue;

    if (topic.negativeKeywords.some((keyword) => containsKeyword(haystack, keyword))) {
      blockedByNegativeKeyword = true;
      continue;
    }

    const hits = topic.keywords.filter((keyword) => containsKeyword(haystack, keyword));
    if (hits.length === 0) continue;

    matchedTopics.push(topic.slug);
    hits.forEach((keyword) => matchedKeywords.add(keyword));
    // Priority-weighted, so a hit on a priority-5 topic counts for more than a
    // hit on a background one. Divided by 5 to keep every term in 0..1.
    topicHits += Math.min(1, hits.length / 2) * (Math.max(1, topic.priority) / 5);

    if (!titleHit && hits.some((keyword) => containsKeyword(title, keyword))) titleHit = true;
  }

  const wantedSlugs = input.projectSlugs;
  const matchedProjects: string[] = [];
  let projectHits = 0;

  for (const project of radarProjects()) {
    if (wantedSlugs && !wantedSlugs.includes(project.slug)) continue;
    const hits = project.keywords.filter((keyword) => containsKeyword(haystack, keyword));
    if (hits.length === 0) continue;
    matchedProjects.push(project.slug);
    hits.forEach((keyword) => matchedKeywords.add(keyword));
    projectHits += Math.min(1, hits.length / 2);
  }

  const topicSignal = Math.min(1, topicHits);
  const projectSignal = Math.min(1, projectHits);

  // An unknown language neither helps nor penalizes: half credit, because
  // "we could not detect it" is not evidence the video is in the wrong language.
  const wantedLanguages = new Set(input.topics.flatMap((topic) => topic.languages));
  const languageSignal =
    input.language === null ? 0.5 : wantedLanguages.size === 0 || wantedLanguages.has(input.language) ? 1 : 0;

  const creatorSignal = input.creator ? Math.min(1, Math.max(0, input.creator.priority) / 5) : 0;

  let score =
    topicSignal * weights.topicKeyword +
    projectSignal * weights.projectKeyword +
    languageSignal * weights.languageMatch +
    creatorSignal * weights.creatorPriority;

  if (titleHit) score += radarConfig.relevance.titleMatchBonus;
  if (blockedByNegativeKeyword) score *= 1 - radarConfig.relevance.negativeKeywordPenalty;

  return {
    score: Math.min(1, Math.max(0, score)),
    matchedTopics,
    matchedProjects,
    matchedKeywords: [...matchedKeywords],
    blockedByNegativeKeyword,
  };
}
