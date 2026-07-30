import type { SampleReportContent } from "@/lib/visibility/types";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";

/**
 * A clearly-labelled, static sample layout — never a live scan (SSOT §29.3
 * point 3). Every heading repeats "sample"/illustrative language so this
 * can never be mistaken for a real result, per §22.1/§29.7 ("mock/demo
 * cannot be mistaken for live scan").
 */
export function SampleReportPreview({ content }: { content: SampleReportContent }) {
  return (
    <Reveal>
      <Card hover={false} className="border-copper/30">
        <span className="inline-flex w-fit rounded-full border border-copper/40 bg-copper/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-copper-deep">
          {content.badge}
        </span>

        <div className="mt-6 grid gap-1 text-sm text-muted sm:grid-cols-2">
          <p>
            <span className="font-medium text-ink">Domain:</span> {content.domain}
          </p>
          <p>
            <span className="font-medium text-ink">Brand:</span> {content.brand}
          </p>
          <p>
            <span className="font-medium text-ink">Market:</span> {content.market}
          </p>
          <p>
            <span className="font-medium text-ink">Language:</span> {content.language}
          </p>
          <p>
            <span className="font-medium text-ink">{content.checkedLabel}:</span> {content.checkedDate}
          </p>
          <p>{content.methodologyLabel}</p>
          <p>{content.promptSetLabel}</p>
          <p>{content.sampleLabel}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {content.metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-line bg-ivory px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {metric.label}
              </p>
              <p className="mt-2 font-serif text-2xl font-semibold text-ink">{metric.value}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 border-t border-line pt-5 text-sm leading-relaxed text-muted">
          {content.disclaimer}
        </p>
      </Card>
    </Reveal>
  );
}
