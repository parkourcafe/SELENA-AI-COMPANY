import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { UnlockReportForm, type UnlockFormCopy } from "@/components/visibility/UnlockReportForm";
import type { MockIssue, ConversionPathLabel } from "@/lib/diagnostics/mockEvidence";

export type MockReportData = {
  isMock: true;
  methodologyVersion: string;
  domain: string;
  brand: string;
  market: string;
  language: string;
  generatedAt: string;
  publicReadiness: number;
  entityClarity: number;
  aiSample: { mentioned: number; of: number };
  ownedDomainCitation: { cited: number; of: number };
  conversionPath: ConversionPathLabel;
  confidence: string;
  unlocked: boolean;
  topIssues?: { title: string; severity: MockIssue["severity"] }[];
  issues?: MockIssue[];
  measurementBoundary: { whatWeMeasured: readonly string[]; whatWeDidNotMeasure: readonly string[] };
};

export type MockReportCopy = {
  badge: string;
  checkedLabel: string;
  metricLabels: {
    publicReadiness: string;
    entityClarity: string;
    aiSample: string;
    ownedCitation: string;
    conversionPath: string;
  };
  issuesHeading: string;
  fullIssueLabels: {
    whatWeFound: string;
    whyItMatters: string;
    whatThisDoesNotProve: string;
    recommendedAction: string;
    availablePath: string;
  };
  measurementHeading: string;
  whatWeMeasuredLabel: string;
  whatWeDidNotMeasureLabel: string;
  unlockForm: UnlockFormCopy;
};

const SEVERITY_LABEL: Record<MockIssue["severity"], string> = {
  critical: "Critical",
  important: "Important",
  later: "Later",
};

export function MockReportView({
  token,
  data,
  copy,
}: {
  token: string;
  data: MockReportData;
  copy: MockReportCopy;
}) {
  return (
    <section className="bg-ivory pb-20 sm:pb-28">
      <Container size="narrow">
        <Reveal>
          <Card hover={false} className="border-copper/30">
            <span className="inline-flex w-fit rounded-full border border-copper/40 bg-copper/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-copper-deep">
              {copy.badge}
            </span>

            <div className="mt-6 grid gap-1 text-sm text-muted sm:grid-cols-2">
              <p>
                <span className="font-medium text-ink">Domain:</span> {data.domain}
              </p>
              <p>
                <span className="font-medium text-ink">Brand:</span> {data.brand}
              </p>
              <p>
                <span className="font-medium text-ink">Market:</span> {data.market}
              </p>
              <p>
                <span className="font-medium text-ink">Language:</span> {data.language}
              </p>
              <p>
                <span className="font-medium text-ink">{copy.checkedLabel}:</span>{" "}
                {new Date(data.generatedAt).toISOString().slice(0, 10)}
              </p>
              <p>Methodology {data.methodologyVersion}</p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-ivory px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {copy.metricLabels.publicReadiness}
                </p>
                <p className="mt-2 font-serif text-2xl font-semibold text-ink">{data.publicReadiness} / 100</p>
              </div>
              <div className="rounded-xl border border-line bg-ivory px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {copy.metricLabels.entityClarity}
                </p>
                <p className="mt-2 font-serif text-2xl font-semibold text-ink">{data.entityClarity} / 100</p>
              </div>
              <div className="rounded-xl border border-line bg-ivory px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {copy.metricLabels.aiSample}
                </p>
                <p className="mt-2 font-serif text-2xl font-semibold text-ink">
                  {data.aiSample.mentioned} / {data.aiSample.of}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-ivory px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {copy.metricLabels.ownedCitation}
                </p>
                <p className="mt-2 font-serif text-2xl font-semibold text-ink">
                  {data.ownedDomainCitation.cited} / {data.ownedDomainCitation.of}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-ivory px-5 py-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {copy.metricLabels.conversionPath}
                </p>
                <p className="mt-2 font-serif text-2xl font-semibold text-ink">{data.conversionPath}</p>
              </div>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-8">
            <h2 className="text-h3 text-ink">{copy.issuesHeading}</h2>
            <div className="mt-5 space-y-4">
              {!data.unlocked
                ? data.topIssues?.map((issue) => (
                    <Card key={issue.title} hover={false}>
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-serif text-lg font-semibold text-ink">{issue.title}</h3>
                        <span className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-medium text-muted">
                          {SEVERITY_LABEL[issue.severity]}
                        </span>
                      </div>
                    </Card>
                  ))
                : data.issues?.map((issue) => (
                    <Card key={issue.title} hover={false}>
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-serif text-lg font-semibold text-ink">{issue.title}</h3>
                        <span className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-medium text-muted">
                          {SEVERITY_LABEL[issue.severity]}
                        </span>
                      </div>
                      <dl className="mt-4 space-y-3 text-sm leading-relaxed">
                        <div>
                          <dt className="font-medium text-ink">{copy.fullIssueLabels.whatWeFound}</dt>
                          <dd className="text-muted">{issue.whatWeFound}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-ink">{copy.fullIssueLabels.whyItMatters}</dt>
                          <dd className="text-muted">{issue.whyItMatters}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-ink">{copy.fullIssueLabels.whatThisDoesNotProve}</dt>
                          <dd className="text-muted">{issue.whatThisDoesNotProve}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-ink">{copy.fullIssueLabels.recommendedAction}</dt>
                          <dd className="text-muted">{issue.recommendedAction}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-ink">{copy.fullIssueLabels.availablePath}</dt>
                          <dd className="text-copper-deep">{issue.availablePath}</dd>
                        </div>
                      </dl>
                    </Card>
                  ))}
            </div>
          </div>
        </Reveal>

        {!data.unlocked ? (
          <div className="mt-8">
            <UnlockReportForm token={token} copy={copy.unlockForm} />
          </div>
        ) : null}

        <Reveal delay={120}>
          <Card hover={false} className="mt-8 border-copper/25 bg-copper/[0.04]">
            <p className="font-serif text-lg font-semibold text-ink">{copy.measurementHeading}</p>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper-deep">
                  {copy.whatWeMeasuredLabel}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-ink/80">
                  {data.measurementBoundary.whatWeMeasured.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {copy.whatWeDidNotMeasureLabel}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {data.measurementBoundary.whatWeDidNotMeasure.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </Reveal>
      </Container>
    </section>
  );
}
