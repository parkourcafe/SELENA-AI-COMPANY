/**
 * Pattern library and emergence (spec §37, §38).
 *
 * The load-bearing distinction here is that a pattern is NOT a trend. Several
 * videos sharing a mechanic proves only that the mechanic is common — quite
 * possibly because one creator repeats it, or because all three videos are from
 * the same week two years ago. "Emerging" therefore requires evidence on three
 * independent axes at once: enough qualifying videos, enough DISTINCT creators,
 * and all of it inside a recent window. The evidence is returned alongside the
 * verdict so a reader can check the claim rather than trust it.
 */

import { radarConfig } from "./config";
import type { PatternEmergence, RadarPattern } from "./contracts";
import type { PatternObservation, RadarStore } from "./store/types";
import type { StructuredAnalysis } from "./analysis/schema";

export interface PatternRecordInput {
  videoId: string;
  channelId: string;
  analysis: StructuredAnalysis;
  observedAt: string;
}

/**
 * Persist the mechanics observed in one analysis.
 *
 * Both writes are upserts keyed on (pattern, video), so re-processing the same
 * video cannot inflate an observation count — which would otherwise be the
 * easiest way to manufacture a fake trend (spec §40).
 */
export async function recordPatternsFromAnalysis(
  store: RadarStore,
  input: PatternRecordInput,
): Promise<RadarPattern[]> {
  const mechanics = [...input.analysis.mechanics];
  const primary = input.analysis.reusable_pattern;

  if (!mechanics.some((mechanic) => mechanic.canonical_name === primary.canonical_name)) {
    mechanics.push({
      canonical_name: primary.canonical_name,
      category: "reusable_pattern",
      description: primary.description,
    });
  }

  const recorded: RadarPattern[] = [];
  const seen = new Set<string>();

  for (const mechanic of mechanics) {
    if (seen.has(mechanic.canonical_name)) continue;
    seen.add(mechanic.canonical_name);

    const pattern = await store.upsertPattern({
      canonicalName: mechanic.canonical_name,
      description: mechanic.description,
      category: mechanic.category,
      observedAt: input.observedAt,
    });

    await store.observePattern({
      patternId: pattern.id,
      videoId: input.videoId,
      channelId: input.channelId,
      observedAt: input.observedAt,
      evidence: mechanic.description.slice(0, 500),
    });

    recorded.push(pattern);
  }

  return recorded;
}

export function computeEmergence(
  patternId: string,
  observations: PatternObservation[],
  now: Date = new Date(),
): PatternEmergence {
  const { minQualifyingVideos, minIndependentCreators, windowDays } = radarConfig.patterns.emerging;
  const cutoff = now.getTime() - windowDays * 86_400_000;

  const inWindow = observations.filter((observation) => {
    const observedAt = new Date(observation.observedAt).getTime();
    return Number.isFinite(observedAt) && observedAt >= cutoff;
  });

  // Distinct videos and distinct CHANNELS. Counting rows instead would let one
  // prolific creator satisfy the independence test on their own.
  const videoIds = [...new Set(inWindow.map((observation) => observation.videoId))];
  const creators = new Set(inWindow.map((observation) => observation.channelId));

  return {
    patternId,
    emerging: videoIds.length >= minQualifyingVideos && creators.size >= minIndependentCreators,
    qualifyingVideos: videoIds.length,
    independentCreators: creators.size,
    windowDays,
    evidenceVideoIds: videoIds,
  };
}

export async function emergingPatterns(
  store: RadarStore,
  now: Date = new Date(),
): Promise<{ pattern: RadarPattern; emergence: PatternEmergence }[]> {
  const patterns = await store.listPatterns();
  const results = await Promise.all(
    patterns.map(async (pattern) => ({
      pattern,
      emergence: computeEmergence(pattern.id, await store.listPatternObservations(pattern.id), now),
    })),
  );
  return results.sort(
    (a, b) => b.emergence.qualifyingVideos - a.emergence.qualifyingVideos,
  );
}
