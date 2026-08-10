import { NextResponse } from "next/server";
import { guardOperator, radarError, readJsonBody } from "@/lib/video-radar/api";
import type { OpportunityStatus } from "@/lib/video-radar/contracts";
import { getRadarStore } from "@/lib/video-radar/store";

export const runtime = "nodejs";

/**
 * Statuses an operator can set (spec §36).
 *
 * `produced` is deliberately absent: the spec says not to introduce it when a
 * content workflow already tracks production. This repository has no content
 * pipeline at all, so `sent_to_pipeline` is the honest terminal state — the
 * opportunity has left the Radar. Inventing a `produced` state here would mean
 * the Radar claiming knowledge of work it cannot observe.
 */
const ALLOWED: OpportunityStatus[] = ["new", "saved", "rejected", "sent_to_pipeline"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = guardOperator(request);
  if (denied) return denied;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const status = body.value.status;
  if (!ALLOWED.includes(status as OpportunityStatus)) return radarError("INVALID_INPUT", 400);

  const { id } = await context.params;
  const opportunity = await getRadarStore().updateOpportunityStatus(id, status as OpportunityStatus);
  if (!opportunity) return radarError("NOT_FOUND", 404);

  return NextResponse.json({ ok: true, opportunity });
}
