/**
 * Seeding research topics (spec §10: "These are seed data only. Do not
 * hard-code them into business logic.").
 *
 * Seeding is idempotent and additive: it upserts by slug and never deletes or
 * deactivates, so an operator's edits and their own added topics survive every
 * subsequent seed. Nothing in the pipeline references a topic slug — the seed
 * file is a starting point, not a contract.
 *
 * The creator seed ships EMPTY, and stays that way unless a human fills it. A
 * watchlist row needs a real YouTube channel id; inventing one would put
 * fabricated data into the system. `scripts/radar-add-creators.mjs` resolves
 * real handles into real ids and writes them here.
 */

import creatorsSeed from "@/data/video-radar/creators.seed.json";
import topicsSeed from "@/data/video-radar/topics.seed.json";
import type { RadarCreator, RadarTopic } from "./contracts";
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

type CreatorUpsert = Omit<RadarCreator, "id" | "createdAt" | "updatedAt">;

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/**
 * One seed row, validated.
 *
 * Returns null unless the row carries a real YouTube channel id. The seed file
 * documents its own format with a `shape` example containing the literal text
 * "UC… (real YouTube channel id)", and a documented example must never become a
 * watchlist entry — the Radar would then spend quota every run asking YouTube
 * about a channel that does not exist.
 */
export function creatorFromSeedRow(row: unknown): CreatorUpsert | null {
  if (typeof row !== "object" || row === null) return null;
  const record = row as Record<string, unknown>;

  const externalChannelId =
    typeof record.externalChannelId === "string" ? record.externalChannelId : "";
  if (!/^UC[\w-]{20,}$/.test(externalChannelId)) return null;

  const priority = Number(record.priority);

  return {
    platform: "youtube",
    externalChannelId,
    channelName:
      typeof record.channelName === "string" && record.channelName.trim().length > 0
        ? record.channelName
        : externalChannelId,
    channelUrl:
      typeof record.channelUrl === "string"
        ? record.channelUrl
        : `https://www.youtube.com/channel/${externalChannelId}`,
    active: true,
    // 3 is a neutral middle, not a judgement about the channel. Priority is a
    // human's call and is edited in the file.
    priority: Number.isFinite(priority) ? Math.min(5, Math.max(1, priority)) : 3,
    tags: stringList(record.tags),
    languages: stringList(record.languages),
    targetProjects: stringList(record.targetProjects),
    subscriberCount: null,
    lastScannedAt: null,
  };
}

export async function seedCreatorsIfEmpty(store: RadarStore): Promise<RadarCreator[]> {
  const existing = await store.listCreators();
  if (existing.length > 0) return existing;
  return seedCreators(store);
}

/**
 * Upserts on (platform, channel id), so re-seeding updates a row rather than
 * duplicating it and an operator's runtime edits survive a later seed.
 */
export async function seedCreators(store: RadarStore): Promise<RadarCreator[]> {
  const rows = Array.isArray(creatorsSeed.creators) ? creatorsSeed.creators : [];
  const seeded: RadarCreator[] = [];

  for (const row of rows) {
    const creator = creatorFromSeedRow(row);
    if (creator) seeded.push(await store.upsertCreator(creator));
  }

  return seeded;
}
