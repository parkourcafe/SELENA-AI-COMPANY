/**
 * Dashboard view model (spec §45, §46, §47).
 *
 * Assembled server-side so the page stays a server component and no Radar data
 * or secret is ever shipped to the browser beyond what is rendered.
 *
 * The shape enforces the evidence/interpretation contract (§32): `evidence` and
 * `interpretation` are separate objects, and interpretation is null whenever no
 * analysis exists. A view model that merged them would make it possible to
 * render an AI guess in the same block as a measured number by accident.
 */

import type {
  RadarOpportunity,
  RadarPattern,
  RadarRun,
  RadarTopic,
  RadarVideo,
  PatternEmergence,
} from "./contracts";
import { emergingPatterns } from "./patterns";
import { radarProjects, type RadarProject } from "./projects";
import type { AnalysisRecord, RadarStore, ScoreRecord } from "./store/types";
import type { StructuredAnalysis } from "./analysis/schema";
import { ANALYSIS_PROMPT_VERSION } from "./analysis/analyze";

export interface CandidateView {
  video: RadarVideo;
  /** Observed / extracted only. Nothing in here came from a model. */
  evidence: {
    views: number | null;
    likes: number | null;
    comments: number | null;
    baselineViews: number | null;
    baselineSampleSize: number;
    baselineConfidence: string;
    outlierRatio: number | null;
    outlierBand: string;
    outlierMaturity: string;
    relevanceScore: number;
    candidateScore: number;
    scoringVersion: string;
    shortlisted: boolean;
    gateReasons: string[];
  };
  /** AI-generated. Null when the video has not been analysed. */
  interpretation: StructuredAnalysis | null;
  analysisModel: string | null;
  opportunities: RadarOpportunity[];
}

export interface RadarFilters {
  videoType?: "short" | "long" | "unknown";
  projectId?: string;
  minOutlier?: number;
  baselineConfidence?: string;
  maturity?: "provisional" | "mature";
  analyzed?: "yes" | "no";
  transcript?: "available" | "unavailable";
  publishedWithinDays?: number;
  channelId?: string;
}

export interface RadarDashboard {
  storeKind: "supabase" | "memory";
  durable: boolean;
  latestRun: RadarRun | null;
  runs: RadarRun[];
  topics: RadarTopic[];
  projects: RadarProject[];
  coverage: {
    discovered: number;
    monitored: number;
    shortlisted: number;
    analyzed: number;
  };
  candidates: CandidateView[];
  patterns: { pattern: RadarPattern; emergence: PatternEmergence }[];
  opportunitiesByProject: { project: RadarProject; opportunities: RadarOpportunity[] }[];
}

export function applyFilters(candidates: CandidateView[], filters: RadarFilters): CandidateView[] {
  const now = Date.now();

  return candidates.filter((candidate) => {
    const { video, evidence } = candidate;

    if (filters.videoType && video.videoType !== filters.videoType) return false;
    if (filters.channelId && video.channelId !== filters.channelId) return false;
    if (filters.baselineConfidence && evidence.baselineConfidence !== filters.baselineConfidence) {
      return false;
    }
    if (filters.maturity && evidence.outlierMaturity !== filters.maturity) return false;

    if (typeof filters.minOutlier === "number") {
      // A missing ratio is excluded by a minimum filter rather than treated as
      // zero — "unmeasured" and "measured as weak" are different answers.
      if (typeof evidence.outlierRatio !== "number") return false;
      if (evidence.outlierRatio < filters.minOutlier) return false;
    }

    if (filters.analyzed === "yes" && !candidate.interpretation) return false;
    if (filters.analyzed === "no" && candidate.interpretation) return false;

    if (filters.transcript === "available" && video.transcriptStatus !== "available") return false;
    if (filters.transcript === "unavailable" && video.transcriptStatus === "available") return false;

    if (filters.projectId) {
      const matches = candidate.opportunities.some(
        (opportunity) => opportunity.projectId === filters.projectId,
      );
      if (!matches) return false;
    }

    if (typeof filters.publishedWithinDays === "number") {
      const published = new Date(video.publishedAt).getTime();
      if (!Number.isFinite(published)) return false;
      if (now - published > filters.publishedWithinDays * 86_400_000) return false;
    }

    return true;
  });
}

export async function loadDashboard(
  store: RadarStore,
  filters: RadarFilters = {},
): Promise<RadarDashboard> {
  const runs = await store.listRuns(10);
  const latestRun = runs[0] ?? null;

  const videos = await store.listVideos({ limit: 400 });
  const scores: ScoreRecord[] = latestRun ? await store.listScores(latestRun.id) : [];
  const scoreByVideo = new Map(scores.map((score) => [score.videoId, score]));

  const analyses = await store.listAnalyses(videos.map((video) => video.id));
  const analysisByVideo = new Map<string, AnalysisRecord>();
  for (const analysis of analyses) {
    // Only the CURRENT prompt version is rendered. Showing output from an old
    // prompt beside new output would silently mix two interpretations (§51).
    if (analysis.promptVersion === ANALYSIS_PROMPT_VERSION) {
      analysisByVideo.set(analysis.videoId, analysis);
    }
  }

  const allOpportunities = await store.listOpportunities();
  const opportunitiesByVideo = new Map<string, RadarOpportunity[]>();
  for (const opportunity of allOpportunities) {
    const list = opportunitiesByVideo.get(opportunity.sourceVideoId) ?? [];
    list.push(opportunity);
    opportunitiesByVideo.set(opportunity.sourceVideoId, list);
  }

  const candidates: CandidateView[] = videos
    .filter((video) => scoreByVideo.has(video.id))
    .map((video) => {
      const score = scoreByVideo.get(video.id) as ScoreRecord;
      const analysis = analysisByVideo.get(video.id) ?? null;
      return {
        video,
        evidence: {
          views: video.latestViews,
          likes: video.latestLikes,
          comments: video.latestComments,
          baselineViews: score.baselineViews,
          baselineSampleSize: score.baselineSampleSize,
          baselineConfidence: score.baselineConfidence,
          outlierRatio: score.outlierRatio,
          outlierBand: score.outlierBand,
          outlierMaturity: score.outlierMaturity,
          relevanceScore: score.relevanceScore,
          candidateScore: score.candidateScore,
          scoringVersion: score.scoringVersion,
          shortlisted: score.shortlisted,
          gateReasons: score.gateReasons,
        },
        interpretation: analysis?.analysis ?? null,
        analysisModel: analysis?.model ?? null,
        opportunities: opportunitiesByVideo.get(video.id) ?? [],
      };
    })
    .sort((a, b) => b.evidence.candidateScore - a.evidence.candidateScore);

  const projects = radarProjects();

  return {
    storeKind: store.kind,
    durable: store.durable,
    latestRun,
    runs,
    topics: await store.listTopics(),
    projects,
    coverage: {
      discovered: videos.length,
      monitored: scores.length,
      shortlisted: scores.filter((score) => score.shortlisted).length,
      analyzed: analysisByVideo.size,
    },
    candidates: applyFilters(candidates, filters),
    patterns: await emergingPatterns(store),
    opportunitiesByProject: projects
      .map((project) => ({
        project,
        opportunities: allOpportunities.filter(
          (opportunity) => opportunity.projectId === project.slug,
        ),
      }))
      .filter((group) => group.opportunities.length > 0),
  };
}

export function parseFilters(searchParams: Record<string, string | string[] | undefined>): RadarFilters {
  const single = (key: string): string | undefined => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const minOutlier = Number(single("minOutlier"));
  const withinDays = Number(single("days"));
  const videoType = single("type");
  const maturity = single("maturity");
  const analyzed = single("analyzed");
  const transcript = single("transcript");
  const confidence = single("confidence");

  return {
    videoType: videoType === "short" || videoType === "long" || videoType === "unknown" ? videoType : undefined,
    projectId: single("project") || undefined,
    channelId: single("channel") || undefined,
    minOutlier: Number.isFinite(minOutlier) && minOutlier > 0 ? minOutlier : undefined,
    baselineConfidence: ["high", "medium", "low", "unavailable"].includes(confidence ?? "")
      ? confidence
      : undefined,
    maturity: maturity === "provisional" || maturity === "mature" ? maturity : undefined,
    analyzed: analyzed === "yes" || analyzed === "no" ? analyzed : undefined,
    transcript: transcript === "available" || transcript === "unavailable" ? transcript : undefined,
    publishedWithinDays: Number.isFinite(withinDays) && withinDays > 0 ? withinDays : undefined,
  };
}
