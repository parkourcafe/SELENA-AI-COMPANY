/**
 * Store selection.
 *
 * Mirrors the null-safe contract of lib/supabase/server.ts: when no Supabase
 * project is configured (Decision Log D-005) the Radar falls back to the
 * in-memory store rather than throwing at import time, so the rest of the app
 * keeps building and the Radar UI can render an honest "not durable" state.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { InMemoryRadarStore } from "./memory";
import { SupabaseRadarStore } from "./supabase";
import type { RadarStore } from "./types";

/**
 * Module-level singleton: the in-memory store is only useful if it survives
 * between requests in the same process. On serverless that is one warm
 * instance, not a cluster — which is exactly why `durable` is false.
 */
let memoryStore: InMemoryRadarStore | null = null;
let cachedStore: RadarStore | null = null;

export function getRadarStore(): RadarStore {
  if (cachedStore) return cachedStore;

  const client = getSupabaseServerClient();
  if (client) {
    cachedStore = new SupabaseRadarStore(client);
    return cachedStore;
  }

  memoryStore ??= new InMemoryRadarStore();
  cachedStore = memoryStore;
  return cachedStore;
}

/** Test helper — never called from application code. */
export function resetRadarStoreForTests(): void {
  memoryStore = null;
  cachedStore = null;
}

export type { RadarStore };
