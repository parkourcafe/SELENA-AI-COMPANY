import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/diagnostics/flags";
import { guardOperator, radarError } from "@/lib/video-radar/api";
import { createAnalysisProvider } from "@/lib/video-radar/analysis/analyze";
import { createTranscriptProvider, createVideoProvider } from "@/lib/video-radar/providers";
import { runRadar } from "@/lib/video-radar/run";
import { seedTopicsIfEmpty } from "@/lib/video-radar/seed";
import { getRadarStore } from "@/lib/video-radar/store";

export const runtime = "nodejs";
/**
 * Bounded so a run cannot outlive the platform's function limit. The pipeline
 * is idempotent, so a run cut short here is safely resumed by invoking again —
 * already-processed videos are skipped rather than redone.
 */
export const maxDuration = 300;

/**
 * Manual Radar run (spec §48).
 *
 * This repository has no job scheduler (see docs/video-radar-audit.md), so the
 * "weekly" cadence in §49 is supplied by whoever calls this endpoint — an
 * operator, a Vercel Cron entry, or a scheduled GitHub Action. Deliberately not
 * implemented as a new scheduling framework: that would be the parallel system
 * §4 forbids.
 */
export async function POST(request: Request) {
  const denied = guardOperator(request);
  if (denied) return denied;

  const store = getRadarStore();

  try {
    await seedTopicsIfEmpty(store);

    const { provider, live } = createVideoProvider();
    const run = await runRadar({
      store,
      videoProvider: provider,
      transcriptProvider: createTranscriptProvider(),
      analysisProvider: createAnalysisProvider(isFeatureEnabled("VIDEO_RADAR_ANALYSIS_ENABLED")),
      discoveryEnabled: live,
    });

    return NextResponse.json({
      ok: true,
      run,
      // Surfaced so a caller can never mistake a fixture run for a live one, or
      // an in-memory run for something that persisted.
      discovery: live ? "live" : "disabled",
      durable: store.durable,
    });
  } catch (cause) {
    // A run that throws all the way out here is a bug, not an item failure —
    // item failures are captured inside the run and reported as `partial`.
    console.error("[video-radar] run failed", cause);
    return radarError("INTERNAL_ERROR", 500);
  }
}
