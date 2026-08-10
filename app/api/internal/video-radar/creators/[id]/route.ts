import { NextResponse } from "next/server";
import { sanitizeShortText } from "@/lib/diagnostics/validators";
import { guardOperator, radarError, readJsonBody, toBoundedInt, toStringArray } from "@/lib/video-radar/api";
import { getRadarStore } from "@/lib/video-radar/store";

export const runtime = "nodejs";

/** Edit or deactivate a watchlist creator (spec §48). */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = guardOperator(request);
  if (denied) return denied;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const { id } = await context.params;
  const patch: Record<string, unknown> = {};

  if (body.value.channelName !== undefined) {
    patch.channelName = sanitizeShortText(body.value.channelName, 200);
  }
  if (body.value.active !== undefined) patch.active = body.value.active === true;
  if (body.value.priority !== undefined) patch.priority = toBoundedInt(body.value.priority, 1, 5, 3);
  if (body.value.tags !== undefined) patch.tags = toStringArray(body.value.tags, 20, 40);
  if (body.value.languages !== undefined) patch.languages = toStringArray(body.value.languages, 8, 8);

  const creator = await getRadarStore().updateCreator(id, patch);
  if (!creator) return radarError("NOT_FOUND", 404);
  return NextResponse.json({ ok: true, creator });
}
