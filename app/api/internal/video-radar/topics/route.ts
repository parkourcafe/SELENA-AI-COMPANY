import { NextResponse } from "next/server";
import { sanitizeShortText } from "@/lib/diagnostics/validators";
import { guardOperator, radarError, readJsonBody, toBoundedInt, toStringArray } from "@/lib/video-radar/api";
import { isKnownProject } from "@/lib/video-radar/projects";
import { getRadarStore } from "@/lib/video-radar/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const denied = guardOperator(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, topics: await getRadarStore().listTopics() });
}

/** Create or update a research topic (spec §48). Upserts by slug. */
export async function POST(request: Request) {
  const denied = guardOperator(request);
  if (denied) return denied;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const slug = sanitizeShortText(body.value.slug, 60)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const name = sanitizeShortText(body.value.name, 120);
  if (!slug || !name) return radarError("INVALID_INPUT", 400);

  const keywords = toStringArray(body.value.keywords);
  if (keywords.length === 0) return radarError("INVALID_INPUT", 400);

  // Silently dropping unknown project slugs would leave a topic that quietly
  // never matches its intended project.
  const targetProjects = toStringArray(body.value.targetProjects, 12, 60);
  if (targetProjects.some((slugCandidate) => !isKnownProject(slugCandidate))) {
    return radarError("INVALID_INPUT", 400);
  }

  const topic = await getRadarStore().upsertTopic({
    slug,
    name,
    description: sanitizeShortText(body.value.description, 400),
    active: body.value.active !== false,
    priority: toBoundedInt(body.value.priority, 1, 5, 3),
    keywords,
    negativeKeywords: toStringArray(body.value.negativeKeywords),
    languages: toStringArray(body.value.languages, 8, 8),
    targetProjects,
  });

  return NextResponse.json({ ok: true, topic });
}
