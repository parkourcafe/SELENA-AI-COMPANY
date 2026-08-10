import { NextResponse } from "next/server";
import { sanitizeShortText } from "@/lib/diagnostics/validators";
import { guardOperator, radarError, readJsonBody, toBoundedInt, toStringArray } from "@/lib/video-radar/api";
import { isKnownProject } from "@/lib/video-radar/projects";
import { getRadarStore } from "@/lib/video-radar/store";

export const runtime = "nodejs";

/** YouTube channel ids are `UC` followed by 22 url-safe base64 characters. */
const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;

export async function GET(request: Request) {
  const denied = guardOperator(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, creators: await getRadarStore().listCreators() });
}

/** Add or update a watchlist creator (spec §11, §48). Upserts by (platform, channel id). */
export async function POST(request: Request) {
  const denied = guardOperator(request);
  if (denied) return denied;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const externalChannelId = sanitizeShortText(body.value.externalChannelId, 40);
  // Validated up front: a malformed id would otherwise fail silently on every
  // run, showing up as a permanently empty watchlist rather than an error.
  if (!CHANNEL_ID.test(externalChannelId)) return radarError("INVALID_INPUT", 400);

  const targetProjects = toStringArray(body.value.targetProjects, 12, 60);
  if (targetProjects.some((slug) => !isKnownProject(slug))) return radarError("INVALID_INPUT", 400);

  const creator = await getRadarStore().upsertCreator({
    platform: "youtube",
    externalChannelId,
    channelName: sanitizeShortText(body.value.channelName, 200),
    channelUrl: `https://www.youtube.com/channel/${externalChannelId}`,
    active: body.value.active !== false,
    priority: toBoundedInt(body.value.priority, 1, 5, 3),
    tags: toStringArray(body.value.tags, 20, 40),
    languages: toStringArray(body.value.languages, 8, 8),
    targetProjects,
    subscriberCount: null,
    lastScannedAt: null,
  });

  return NextResponse.json({ ok: true, creator });
}
