import { NextResponse } from "next/server";
import { sanitizeShortText } from "@/lib/diagnostics/validators";
import { guardOperator, radarError, readJsonBody, toBoundedInt, toStringArray } from "@/lib/video-radar/api";
import { getRadarStore } from "@/lib/video-radar/store";

export const runtime = "nodejs";

/** Edit or deactivate a topic (spec §48). Deactivation, not deletion — a deleted topic loses its discovery provenance. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = guardOperator(request);
  if (denied) return denied;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const { id } = await context.params;
  const patch: Record<string, unknown> = {};

  if (body.value.name !== undefined) patch.name = sanitizeShortText(body.value.name, 120);
  if (body.value.description !== undefined) {
    patch.description = sanitizeShortText(body.value.description, 400);
  }
  if (body.value.active !== undefined) patch.active = body.value.active === true;
  if (body.value.priority !== undefined) patch.priority = toBoundedInt(body.value.priority, 1, 5, 3);
  if (body.value.keywords !== undefined) patch.keywords = toStringArray(body.value.keywords);
  if (body.value.negativeKeywords !== undefined) {
    patch.negativeKeywords = toStringArray(body.value.negativeKeywords);
  }
  if (body.value.languages !== undefined) patch.languages = toStringArray(body.value.languages, 8, 8);

  const topic = await getRadarStore().updateTopic(id, patch);
  if (!topic) return radarError("NOT_FOUND", 404);
  return NextResponse.json({ ok: true, topic });
}
