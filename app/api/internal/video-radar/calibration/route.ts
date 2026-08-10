import { NextResponse } from "next/server";
import { guardOperator } from "@/lib/video-radar/api";
import { loadCalibrationReport } from "@/lib/video-radar/calibration";
import { getRadarStore } from "@/lib/video-radar/store";

export const runtime = "nodejs";

/**
 * Threshold calibration report for the latest run.
 *
 * Read-only: it reports the distribution the run already persisted, re-scores
 * nothing and calls no provider, so it costs nothing to hit repeatedly while
 * tuning data/video-radar/scoring.v1.json.
 */
export async function GET(request: Request) {
  const denied = guardOperator(request);
  if (denied) return denied;

  return NextResponse.json({ ok: true, report: await loadCalibrationReport(getRadarStore()) });
}
