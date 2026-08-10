import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { CandidateView } from "@/lib/video-radar/view";
import { OpportunityActions } from "./OpportunityActions";

/**
 * Video result card (spec §46).
 *
 * The section headings are the contract, not decoration: EVIDENCE holds only
 * measured/extracted values, INTERPRETATION holds only model output, and they
 * are never rendered in the same block. §32 forbids merging them into one
 * unlabelled paragraph, so the separation lives in the markup rather than
 * relying on a reader to remember which numbers came from where.
 */
export function CandidateCard({ candidate }: { candidate: CandidateView }) {
  const { video, evidence, interpretation } = candidate;

  return (
    <Card hover={false} className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={video.videoType === "short" ? "copper" : "neutral"}>
              {video.videoType === "unknown" ? "type unknown" : video.videoType}
            </Badge>
            {evidence.shortlisted ? <Badge tone="sage">shortlisted</Badge> : null}
            {evidence.outlierMaturity === "provisional" ? (
              <Badge tone="copper">provisional</Badge>
            ) : null}
          </div>
          <h3 className="mt-2 text-base font-semibold leading-snug">{video.title}</h3>
          <p className="mt-1 text-sm text-muted">
            {video.channelName} · published {new Date(video.publishedAt).toLocaleDateString()}
            {video.durationSeconds ? ` · ${formatDuration(video.durationSeconds)}` : ""}
          </p>
        </div>
        {video.thumbnailUrl ? (
          // Thumbnails come from arbitrary third-party channels. Allow-listing every
          // YouTube CDN host in next.config just to optimise images on an
          // internal-only tool is not worth the config surface.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt=""
            width={160}
            height={90}
            className="h-[90px] w-[160px] shrink-0 rounded-lg object-cover"
          />
        ) : null}
      </header>

      <section aria-labelledby={`evidence-${video.id}`}>
        <h4
          id={`evidence-${video.id}`}
          className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted"
        >
          Evidence — observed and measured
        </h4>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <Fact label="Views" value={formatCount(evidence.views)} />
          <Fact label="Likes" value={formatCount(evidence.likes)} />
          <Fact label="Comments" value={formatCount(evidence.comments)} />
          <Fact label="Creator baseline" value={formatCount(evidence.baselineViews)} />
          <Fact
            label="Baseline sample"
            value={`${evidence.baselineSampleSize} videos · ${evidence.baselineConfidence}`}
          />
          <Fact
            label="Outlier ratio"
            value={
              typeof evidence.outlierRatio === "number"
                ? `${evidence.outlierRatio.toFixed(2)}x (${evidence.outlierBand})`
                : "not available"
            }
          />
          <Fact label="Maturity" value={evidence.outlierMaturity} />
          <Fact label="Relevance" value={evidence.relevanceScore.toFixed(2)} />
          <Fact
            label="Candidate score"
            value={`${evidence.candidateScore.toFixed(3)} · ${evidence.scoringVersion}`}
          />
        </dl>
        <p className="mt-3 text-xs text-muted">
          Transcript: {video.transcriptStatus} ·{" "}
          <a href={video.sourceUrl} target="_blank" rel="noreferrer noopener" className="underline">
            open source
          </a>
        </p>
        {evidence.gateReasons.length > 0 ? (
          <p className="mt-2 text-xs text-muted">
            Did not clear the quality gate: {evidence.gateReasons.join("; ")}
          </p>
        ) : null}
      </section>

      {interpretation ? (
        <section aria-labelledby={`interpretation-${video.id}`} className="border-t border-line pt-5">
          <h4
            id={`interpretation-${video.id}`}
            className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-copper-deep"
          >
            Interpretation — AI-generated, not proven
          </h4>

          <p className="mt-3 text-sm">{interpretation.summary}</p>

          <p className="mt-3 text-sm">
            <span className="font-medium">Observed hook:</span>{" "}
            {interpretation.hook.observed
              ? `${interpretation.hook.text} (from ${interpretation.hook.basis})`
              : "not observable from the available material"}
          </p>

          <p className="mt-2 text-sm">
            <span className="font-medium">Core idea:</span> {interpretation.core_idea}
          </p>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Likely contributing factors
            </p>
            <ul className="mt-2 grid gap-1.5 text-sm">
              {interpretation.likely_contributing_factors.map((factor, index) => (
                <li key={index}>
                  <span className="font-medium">{factor.factor}</span> — {factor.reasoning}{" "}
                  <span className="text-muted">({factor.confidence} confidence)</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-lg border border-line bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Reusable pattern</p>
            <p className="mt-1 text-sm">
              <span className="font-medium">{interpretation.reusable_pattern.canonical_name}</span> —{" "}
              {interpretation.reusable_pattern.description}
            </p>
            <p className="mt-1 text-sm text-muted">
              {interpretation.reusable_pattern.why_transferable}
            </p>
          </div>

          <p className="mt-3 text-xs text-muted">
            Model: {candidate.analysisModel ?? "unknown"} · overall confidence{" "}
            {interpretation.confidence}
          </p>
        </section>
      ) : (
        <section className="border-t border-line pt-5">
          <h4 className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
            Interpretation
          </h4>
          <p className="mt-2 text-sm text-muted">
            Not analysed. The evidence above stands on its own — no interpretation is shown because
            none exists.
          </p>
        </section>
      )}

      {candidate.opportunities.length > 0 ? (
        <section className="border-t border-line pt-5">
          <h4 className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
            Project opportunities
          </h4>
          <div className="mt-3 grid gap-3">
            {candidate.opportunities.map((opportunity) => (
              <OpportunityActions key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </section>
      ) : null}
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 tabular-nums">{value}</dd>
    </div>
  );
}

/** Missing counts render as "not reported", never as 0 — the distinction is the point (§23). */
function formatCount(value: number | null): string {
  return typeof value === "number" ? value.toLocaleString("en-US") : "not reported";
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
}
