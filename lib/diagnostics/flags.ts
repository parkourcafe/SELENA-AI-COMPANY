/**
 * Server-side feature flags (SSOT §10.6, §27.7). Every external/paid
 * capability defaults to off; flags are read server-side only so a
 * client can never spoof an enabled capability by editing bundled JS.
 */

const FLAG_NAMES = [
  "VISIBILITY_ENABLED",
  "VISIBILITY_FREE_CHECK_ENABLED",
  "VISIBILITY_EMAIL_UNLOCK_ENABLED",
  "VISIBILITY_LIVE_CRAWLER_ENABLED",
  "VISIBILITY_PAGESPEED_ENABLED",
  "VISIBILITY_AI_SAMPLE_ENABLED",
  "VISIBILITY_SE_RANKING_ENABLED",
  "VISIBILITY_APIFY_ENABLED",
  "VISIBILITY_GSC_OAUTH_ENABLED",
  "VISIBILITY_GA4_OAUTH_ENABLED",
  "VISIBILITY_SUBSCRIPTIONS_ENABLED",
  "VISIBILITY_MONITOR_ENABLED",
  "VISIBILITY_PUBLIC_REPORTS_ENABLED",
  "VISIBILITY_PROCESS_CHECK_ENABLED",
  "VISIBILITY_VILLA_REDIRECT_ENABLED",
  // Video Research Radar. Added to this tuple rather than given a second flag
  // module, so there stays exactly one place that decides what is switched on.
  // All default off: the Radar is invisible until an owner enables it.
  "VIDEO_RADAR_ENABLED",
  "VIDEO_RADAR_DISCOVERY_ENABLED",
  "VIDEO_RADAR_TRANSCRIPTS_ENABLED",
  "VIDEO_RADAR_ANALYSIS_ENABLED",
] as const;

export type FeatureFlagName = (typeof FLAG_NAMES)[number];

function readFlag(name: FeatureFlagName): boolean {
  const raw = process.env[name];
  return raw === "true" || raw === "1";
}

/** Snapshot of every flag's current value — persisted onto reports (SSOT §27.7: "report хранит active flags snapshot"). */
export function featureFlagSnapshot(): Record<FeatureFlagName, boolean> {
  return Object.fromEntries(FLAG_NAMES.map((name) => [name, readFlag(name)])) as Record<
    FeatureFlagName,
    boolean
  >;
}

export function isFeatureEnabled(name: FeatureFlagName): boolean {
  return readFlag(name);
}
