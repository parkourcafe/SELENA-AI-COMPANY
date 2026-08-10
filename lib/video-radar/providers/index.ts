/**
 * Provider selection from flags and environment.
 *
 * Every provider degrades to a safe, honest substitute rather than throwing:
 * no YouTube key means the fixture provider (an empty Radar, not a crash), no
 * transcripts flag means every transcript reports `unsupported`, no Anthropic
 * key means metadata-level Radar with deep analysis marked unavailable (§30,
 * §58). That is what lets the whole pipeline be exercised end to end before any
 * secret exists.
 */

import { isFeatureEnabled } from "@/lib/diagnostics/flags";
import { DisabledTranscriptProvider, TimedTextTranscriptProvider } from "./transcript";
import type { TranscriptProvider, VideoProvider } from "./types";
import { FixtureVideoProvider, YouTubeProvider } from "./youtube";

export function createVideoProvider(): { provider: VideoProvider; live: boolean } {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!isFeatureEnabled("VIDEO_RADAR_DISCOVERY_ENABLED") || !apiKey) {
    return { provider: new FixtureVideoProvider(), live: false };
  }
  return { provider: new YouTubeProvider(apiKey), live: true };
}

export function createTranscriptProvider(): TranscriptProvider {
  if (!isFeatureEnabled("VIDEO_RADAR_TRANSCRIPTS_ENABLED")) return new DisabledTranscriptProvider();
  return new TimedTextTranscriptProvider();
}

export * from "./types";
