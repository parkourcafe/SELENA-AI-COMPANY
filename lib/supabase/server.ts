import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Server-only Supabase client using the service role key. Returns `null`
 * when no project is configured (Decision Log D-005, NEEDS_OWNER) instead
 * of throwing at import time, so the rest of the app keeps building and
 * running on the mock-evidence path (lib/diagnostics/mockRun.ts) until a
 * real project exists. Any code path that actually needs persistence must
 * check for `null` and surface `PROVIDER_UNAVAILABLE`-style handling
 * rather than crash (SSOT §27.9 stop conditions).
 */
let cachedClient: SupabaseClient<Database> | null | undefined;

export function getSupabaseServerClient(): SupabaseClient<Database> | null {
  if (cachedClient !== undefined) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return cachedClient;
}
