import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Browser Supabase client using the public anon key only. Not wired into
 * any page yet — Phase 3+ (organizations/auth, SSOT §12.2) is the first
 * consumer. Returns `null` when unconfigured, same contract as
 * lib/supabase/server.ts.
 */
let cachedClient: SupabaseClient<Database> | null | undefined;

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (cachedClient !== undefined) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient<Database>(url, anonKey);
  return cachedClient;
}
