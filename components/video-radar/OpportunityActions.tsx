"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { findRadarProject } from "@/lib/video-radar/projects";
import type { OpportunityStatus, RadarOpportunity } from "@/lib/video-radar/contracts";

const ACTIONS: { status: OpportunityStatus; label: string }[] = [
  { status: "saved", label: "Save" },
  { status: "rejected", label: "Reject" },
  { status: "sent_to_pipeline", label: "Send to content pipeline" },
];

/**
 * One project opportunity with its operator actions (spec §46).
 *
 * FACT_REQUIRED entries are rendered prominently rather than tucked away: a
 * reader who skims past them would treat an angle with unresolved facts as
 * ready to produce, which is exactly the failure §33 exists to prevent.
 */
export function OpportunityActions({ opportunity }: { opportunity: RadarOpportunity }) {
  const [status, setStatus] = useState<OpportunityStatus>(opportunity.status);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const project = findRadarProject(opportunity.projectId);

  async function update(next: OpportunityStatus) {
    setPending(true);
    setError(false);

    const response = await fetch(`/api/internal/video-radar/opportunities/${opportunity.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    }).catch(() => null);

    if (response?.ok) setStatus(next);
    else setError(true);
    setPending(false);
  }

  return (
    <article className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{project?.name ?? opportunity.projectId}</p>
        <div className="flex items-center gap-2">
          <Badge tone={status === "saved" ? "sage" : status === "rejected" ? "neutral" : "copper"}>
            {status.replace(/_/g, " ")}
          </Badge>
          <Badge>{opportunity.contentFormat}</Badge>
        </div>
      </div>

      <p className="mt-2 text-sm">
        <span className="font-medium">Angle:</span> {opportunity.proposedAngle}
      </p>
      <p className="mt-1 text-sm">
        <span className="font-medium">Hook:</span> {opportunity.proposedHook}
      </p>
      <p className="mt-1 text-sm text-muted">{opportunity.rationale}</p>
      <p className="mt-2 text-xs text-muted">Source evidence: {opportunity.evidenceSummary}</p>

      {opportunity.factRequirements.length > 0 ? (
        <div className="mt-3 rounded-md border border-copper/40 bg-copper/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-copper-deep">
            Facts required before this can be produced
          </p>
          <ul className="mt-1.5 grid gap-1 text-sm">
            {opportunity.factRequirements.map((fact, index) => (
              <li key={index}>{fact}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action.status}
            type="button"
            onClick={() => update(action.status)}
            disabled={pending || status === action.status}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:border-copper-deep/60 hover:text-copper-deep disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-700">
          Could not update. Try again.
        </p>
      ) : null}
    </article>
  );
}
