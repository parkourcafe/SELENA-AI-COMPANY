/**
 * Seeding research topics (spec §10: "These are seed data only. Do not
 * hard-code them into business logic.").
 *
 * Seeding is idempotent and additive: it upserts by slug and never deletes or
 * deactivates, so an operator's edits and their own added topics survive every
 * subsequent seed. Nothing in the pipeline references a topic slug — the seed
 * file is a starting point, not a contract.
 *
 * There is deliberately no creator seed. A watchlist row needs a real YouTube
 * channel id, and inventing one would put fabricated data into the system.
 */

import topicsSeed from "@/data/video-radar/topics.seed.json";
import type { RadarTopic } from "./contracts";
import type { RadarStore } from "./store/types";

export async function seedTopicsIfEmpty(store: RadarStore): Promise<RadarTopic[]> {
  const existing = await store.listTopics();
  if (existing.length > 0) return existing;
  return seedTopics(store);
}

export async function seedTopics(store: RadarStore): Promise<RadarTopic[]> {
  const seeded: RadarTopic[] = [];
  for (const topic of topicsSeed.topics) {
    seeded.push(
      await store.upsertTopic({
        slug: topic.slug,
        name: topic.name,
        description: topic.description,
        active: true,
        priority: topic.priority,
        keywords: topic.keywords,
        negativeKeywords: topic.negativeKeywords,
        languages: topic.languages,
        targetProjects: topic.targetProjects,
      }),
    );
  }
  return seeded;
}
