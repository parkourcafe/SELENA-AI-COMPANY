import Link from "next/link";
import type { LiveFinding, LiveLayer, LiveReport } from "@/lib/visibility/liveReport";
import type { LiveReportCopy } from "@/lib/visibility/types";
import { cn } from "@/lib/cn";

/**
 * The result the visitor came for, rendered on the page that ran it.
 *
 * Everything here is measured from the submitted site. Where a layer could
 * not be measured it says so and explains why — a missing measurement is
 * never rendered as a zero, because a zero is a claim and we do not have
 * the evidence to make it (SSOT §8.3).
 */

const SEVERITY_STYLES: Record<LiveFinding["severity"], string> = {
  critical: "border-bad/40 bg-bad-soft text-bad",
  important: "border-warn/40 bg-warn-soft text-warn",
  later: "border-line bg-ivory text-muted",
};

/** Card accent per severity, so a critical card reads as red before the tag is. */
const CARD_STYLES: Record<LiveFinding["severity"], string> = {
  critical: "border-bad/30",
  important: "border-warn/30",
  later: "border-line",
};

/** Traffic-light colour for a 0-100 layer score. */
function scoreColor(score: number): string {
  return score >= 80 ? "text-good" : score >= 50 ? "text-warn" : "text-bad";
}

function scoreDot(score: number): string {
  return score >= 80 ? "bg-good" : score >= 50 ? "bg-warn" : "bg-bad";
}

function SeverityTag({ severity, copy }: { severity: LiveFinding["severity"]; copy: LiveReportCopy }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase",
        SEVERITY_STYLES[severity],
      )}
    >
      {copy.severityLabels[severity]}
    </span>
  );
}

function FindingCard({
  finding,
  copy,
  expanded,
}: {
  finding: LiveFinding;
  copy: LiveReportCopy;
  expanded?: boolean;
}) {
  return (
    <li className={cn("rounded-2xl border bg-surface p-5 sm:p-6", CARD_STYLES[finding.severity])}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="font-medium text-ink">{finding.title}</p>
        <SeverityTag severity={finding.severity} copy={copy} />
      </div>

      {finding.detail ? (
        <p className="mt-2 font-mono text-xs leading-relaxed break-words text-muted">
          {finding.detail}
        </p>
      ) : null}

      <div className="mt-4">
        <p className="text-xs font-semibold tracking-wide text-copper-deep uppercase">
          {copy.howToFixLabel}
        </p>
        <p className="mt-1.5 leading-relaxed text-ink/85">{finding.action}</p>
      </div>

      {expanded ? (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            {copy.doesNotProveLabel}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{finding.doesNotProve}</p>
        </div>
      ) : null}
    </li>
  );
}

function LayerCard({ layer, copy }: { layer: LiveLayer; copy: LiveReportCopy }) {
  const title = copy.layerTitles[layer.id] ?? layer.id;
  const question = copy.layerQuestions[layer.id] ?? "";
  const problems = layer.findings.length;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-serif text-lg font-semibold text-ink">{title}</h4>
        {/*
          Three cases, not two. Action Readiness is measured but carries no
          number by design — it is three independent states, and averaging
          them into a score would invent a precision the layer does not have.
          Labelling it "not measured" would be simply false.
        */}
        {layer.score !== null ? (
          <p className="flex items-center gap-2">
            <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", scoreDot(layer.score))} />
            <span className={cn("font-serif text-2xl font-semibold", scoreColor(layer.score))}>{layer.score}</span>{" "}
            <span className="text-sm text-muted">{copy.scoreSuffix}</span>
          </p>
        ) : layer.measured ? null : (
          <span className="rounded-full border border-line bg-ivory px-2.5 py-0.5 text-xs font-medium tracking-wide text-muted uppercase">
            {copy.notMeasuredLabel}
          </span>
        )}
      </div>

      <p className="mt-1.5 text-sm leading-relaxed text-muted">{question}</p>

      {layer.notMeasuredReason ? (
        <p className="mt-3 rounded-xl border border-line bg-ivory p-3.5 text-sm leading-relaxed text-muted">
          {layer.notMeasuredReason}
        </p>
      ) : (
        <p className="mt-3 text-sm">
          <span className="font-medium text-good">{layer.passed.length} {copy.layerPassedLabel}</span>
          <span className="text-muted"> · </span>
          <span className={problems > 0 ? "font-medium text-bad" : "text-muted"}>{problems} {copy.layerProblemsLabel}</span>
        </p>
      )}
    </div>
  );
}

export function LiveReportView({
  report,
  copy,
  remainingChecks,
  leadDelivered,
  onRestart,
}: {
  report: LiveReport;
  copy: LiveReportCopy;
  remainingChecks?: number;
  leadDelivered: boolean;
  onRestart: () => void;
}) {
  const passed = report.layers.flatMap((layer) => layer.passed);
  const problems = report.layers.flatMap((layer) => layer.findings);
  const topBlocker = report.topBlocker;
  const rest = report.nextActions.filter((finding) => finding.ruleId !== topBlocker?.ruleId);

  if (!report.reachable) {
    return (
      <div className="card-premium p-8 sm:p-10" role="status">
        <h2 className="font-serif text-h3 text-ink">{copy.unreachable.heading}</h2>
        <p className="mt-3 text-sm break-all text-muted">{report.url}</p>
        <p className="mt-4 leading-relaxed text-muted">{copy.unreachable.body}</p>
        {report.fetchError ? (
          <p className="mt-3 font-mono text-xs text-muted">{report.fetchError}</p>
        ) : null}
        <button
          type="button"
          onClick={onRestart}
          className="mt-7 inline-flex items-center justify-center rounded-full border border-line bg-surface px-6 py-3 text-[0.95rem] font-medium text-ink transition-all duration-300 hover:border-copper-deep/60 hover:text-copper-deep"
        >
          {copy.restartLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6" role="status">
      {/* --- Header: what was actually read --- */}
      <div className="card-premium p-6 sm:p-8">
        <h2 className="font-serif text-h3 text-ink">{copy.heading}</h2>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">{copy.checkedLabel}</dt>
            <dd className="mt-0.5 font-medium break-all text-ink">{report.finalUrl}</dd>
          </div>
          <div>
            <dt className="text-muted">{copy.checkedAtLabel}</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {new Date(report.checkedAt).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-muted">{copy.pagesLabel}</dt>
            <dd className="mt-0.5 font-medium text-ink">{report.pagesChecked.length}</dd>
          </div>
        </dl>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
          {report.pagesChecked.map((page) => (
            <li key={`${page.role}-${page.url}`} className="font-mono break-all">
              {page.role} · {page.status}
            </li>
          ))}
        </ul>
      </div>

      {/* --- The one thing to fix first --- */}
      {topBlocker ? (
        <section className="card-premium p-6 sm:p-8">
          <h3 className="font-serif text-xl font-semibold text-ink">{copy.fixHeading}</h3>
          <p className="mt-1.5 text-sm text-muted">{copy.fixIntro}</p>
          <ul className="mt-5 grid gap-4">
            <FindingCard finding={topBlocker} copy={copy} expanded />
          </ul>
        </section>
      ) : null}

      {/* --- What works --- */}
      <section className="card-premium p-6 sm:p-8">
        <h3 className="font-serif text-xl font-semibold text-ink">{copy.goodHeading}</h3>
        <p className="mt-1.5 text-sm text-muted">{copy.goodIntro}</p>
        {passed.length > 0 ? (
          <ul className="mt-5 grid gap-2.5">
            {passed.map((item) => (
              <li key={item} className="flex items-start gap-3 text-ink/85">
                <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-good-soft text-xs font-bold text-good">
                  ✓
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 leading-relaxed text-muted">{copy.goodEmpty}</p>
        )}
      </section>

      {/* --- Everything else that gets in the way --- */}
      <section className="card-premium p-6 sm:p-8">
        <h3 className="font-serif text-xl font-semibold text-ink">{copy.problemsHeading}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{copy.problemsIntro}</p>
        {problems.length > 0 ? (
          <ul className="mt-5 grid gap-4">
            {problems.map((finding) => (
              <FindingCard
                key={finding.ruleId}
                finding={finding}
                copy={copy}
                expanded={rest.some((item) => item.ruleId === finding.ruleId)}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-5 leading-relaxed text-muted">{copy.problemsEmpty}</p>
        )}
      </section>

      {/* --- The four layers, including the one we cannot measure --- */}
      <section className="card-premium p-6 sm:p-8">
        <h3 className="font-serif text-xl font-semibold text-ink">{copy.layersHeading}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{copy.layersIntro}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {report.layers.map((layer) => (
            <LayerCard key={layer.id} layer={layer} copy={copy} />
          ))}
        </div>
      </section>

      {/* --- Where this goes next --- */}
      <section className="card-premium p-6 sm:p-8">
        <h3 className="font-serif text-xl font-semibold text-ink">{copy.cta.heading}</h3>
        <p className="mt-3 leading-relaxed text-muted">{copy.cta.body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={copy.cta.primary.href}
            className="inline-flex items-center justify-center rounded-full bg-copper px-6 py-3 text-[0.95rem] font-medium text-surface transition-all duration-300 hover:-translate-y-px hover:bg-copper-deep"
          >
            {copy.cta.primary.label}
          </Link>
          <Link
            href={copy.cta.secondary.href}
            className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-6 py-3 text-[0.95rem] font-medium text-ink transition-all duration-300 hover:border-copper-deep/60 hover:text-copper-deep"
          >
            {copy.cta.secondary.label}
          </Link>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center justify-center rounded-full px-4 py-3 text-[0.95rem] font-medium text-muted underline decoration-line underline-offset-4 transition-colors hover:text-copper-deep"
          >
            {copy.restartLabel}
          </button>
        </div>

        <div className="mt-6 border-t border-line pt-5 text-sm text-muted">
          {leadDelivered ? <p className="leading-relaxed">{copy.leadNote}</p> : null}
          {typeof remainingChecks === "number" ? (
            <p className="mt-2">
              {copy.remainingLabel}: {remainingChecks}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
