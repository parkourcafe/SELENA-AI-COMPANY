import type { EvidenceRow, EvidenceState, SourceStatus } from "@/lib/visibility/measurement";
import { cn } from "@/lib/cn";

const STATE_LABEL: Record<EvidenceState, string> = {
  pass: "Pass",
  warn: "Warn",
  fail: "Fail",
  info: "Info",
  not_measured: "Not measured",
};

const STATE_CLASS: Record<EvidenceState, string> = {
  pass: "border-sage/40 bg-sage/15 text-[#5f6b52]",
  warn: "border-copper/35 bg-copper/10 text-copper-deep",
  fail: "border-copper-deep/40 bg-copper-deep/10 text-copper-deep",
  info: "border-line bg-surface text-muted",
  not_measured: "border-line bg-surface text-muted",
};

/**
 * Renders evidence rows with an explicit state and source badge. State is
 * never communicated by colour alone — every row carries a text label too
 * (WCAG: "no information by colour only", SSOT §17.3).
 */
export function SourceBadge({ sourceStatus }: { sourceStatus: SourceStatus }) {
  return (
    <span className="rounded-full border border-line px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
      {sourceStatus}
    </span>
  );
}

export function EvidenceList({ rows }: { rows: EvidenceRow[] }) {
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label} className="rounded-xl border border-line bg-surface/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-ink">{row.label}</p>
            <div className="flex items-center gap-2">
              <SourceBadge sourceStatus={row.sourceStatus} />
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold",
                  STATE_CLASS[row.state],
                )}
              >
                {STATE_LABEL[row.state]}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">{row.value}</p>
          {row.limitation ? (
            <p className="mt-2 border-t border-line pt-2 text-xs leading-relaxed text-muted">
              Limitation: {row.limitation}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
