import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/diagnostics/flags";
import { guardOperator, radarError, readJsonBody } from "@/lib/video-radar/api";
import { createAnalysisProvider, ANALYSIS_PROMPT_VERSION, ANALYSIS_SCHEMA_VERSION } from "@/lib/video-radar/analysis/analyze";
import { buildOpportunities, outlierSummaryFor, persistOpportunities } from "@/lib/video-radar/opportunities";
import { recordPatternsFromAnalysis } from "@/lib/video-radar/patterns";
import { createTranscriptProvider } from "@/lib/video-radar/providers";
import { radarProjects } from "@/lib/video-radar/projects";
import { getRadarStore } from "@/lib/video-radar/store";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Retry a failed transcript or analysis for one video (spec §48).
 *
 * Scoped to a single video on purpose: after a provider outage an operator
 * wants to re-drive the two or three items that failed, not pay for a whole
 * run. Both paths reuse the same store upserts as the pipeline, so retrying
 * something that actually succeeded is a no-op rather than a duplicate.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = guardOperator(request);
  if (denied) return denied;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const target = body.value.target;
  if (target !== "transcript" && target !== "analysis") return radarError("INVALID_INPUT", 400);

  const { id } = await context.params;
  const store = getRadarStore();
  const video = await store.getVideo(id);
  if (!video) return radarError("NOT_FOUND", 404);

  if (target === "transcript") {
    const result = await createTranscriptProvider().fetch({
      externalVideoId: video.externalVideoId,
      language: video.language,
    });
    await store.saveTranscript({
      videoId: video.id,
      status: result.status,
      language: result.language,
      provider: result.provider,
      text: result.text,
      fetchedAt: new Date().toISOString(),
      failureReason: result.failureReason,
    });
    await store.setVideoStatuses(video.id, { transcriptStatus: result.status });
    return NextResponse.json({ ok: true, transcriptStatus: result.status, failureReason: result.failureReason });
  }

  const runs = await store.listRuns(1);
  const scores = runs[0] ? await store.listScores(runs[0].id) : [];
  const score = scores.find((entry) => entry.videoId === video.id);
  if (!score) return radarError("NOT_FOUND", 404);

  const transcript = await store.getTranscript(video.id);
  const projects = radarProjects();

  const outcome = await createAnalysisProvider(isFeatureEnabled("VIDEO_RADAR_ANALYSIS_ENABLED")).analyze(
    {
      title: video.title,
      description: video.description,
      channelName: video.channelName,
      publishedAt: video.publishedAt,
      videoType: video.videoType,
      durationSeconds: video.durationSeconds,
      views: video.latestViews,
      likes: video.latestLikes,
      comments: video.latestComments,
      baselineViews: score.baselineViews,
      baselineSampleSize: score.baselineSampleSize,
      baselineConfidence: score.baselineConfidence,
      outlierRatio: score.outlierRatio,
      outlierMaturity: score.outlierMaturity,
      transcript: transcript?.status === "available" ? transcript.text : null,
      projects,
    },
    projects.map((project) => project.slug),
  );

  if (!outcome.ok) {
    await store.setVideoStatuses(video.id, { analysisStatus: "failed" });
    return NextResponse.json({ ok: false, error: outcome.code, message: outcome.message }, { status: 502 });
  }

  await store.saveAnalysis({
    videoId: video.id,
    promptVersion: ANALYSIS_PROMPT_VERSION,
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    model: outcome.model,
    analysis: outcome.analysis,
    analyzedAt: new Date().toISOString(),
  });
  await store.setVideoStatuses(video.id, { analysisStatus: "completed" });

  const patterns = await recordPatternsFromAnalysis(store, {
    videoId: video.id,
    channelId: video.channelId,
    analysis: outcome.analysis,
    observedAt: new Date().toISOString(),
  });

  const built = buildOpportunities({
    video,
    analysis: outcome.analysis,
    patternIdByName: Object.fromEntries(patterns.map((pattern) => [pattern.canonicalName, pattern.id])),
    outlierSummary: outlierSummaryFor(video, score.outlierRatio, score.outlierMaturity),
  });
  const saved = await persistOpportunities(store, built.opportunities);

  return NextResponse.json({
    ok: true,
    analysisStatus: "completed",
    opportunities: saved.length,
    rejected: built.rejected,
  });
}
