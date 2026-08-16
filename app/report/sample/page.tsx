import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import { getSampleReport } from "@/lib/visibility/sample-report-data";
import { visibilityRoutes } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { SampleReport } from "@/components/visibility/SampleReport";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const content = getSampleReport("en");

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Sample Visibility Report",
    description:
      "An illustrative sample of the AI Visibility report structure and evidence boundaries — not a live scan of any website.",
    path: "/report/sample",
    locale: "en_US",
  }),
  robots: { index: false, follow: false },
};

export default function SampleReportPage() {
  return (
    <div lang="en">
      <PageHero
        eyebrow="Sample report"
        title="This is the report structure, not a result."
        intro={content.sampleDisclaimer}
      >
        <div className="flex flex-wrap items-center gap-4">
          <Button href={visibilityRoutes.en.check}>Run Free Visibility Check</Button>
          <Button href={visibilityRoutes.en.contact} variant="secondary">
            Book an AI Audit
          </Button>
        </div>
      </PageHero>

      <SampleReport content={content} />

      <section className="bg-surface pb-20 sm:pb-28">
        <Container size="narrow">
          <div className="flex flex-wrap gap-4">
            <Button href={visibilityRoutes.en.methodology} variant="secondary">
              Read the methodology
            </Button>
            <Button href={visibilityRoutes.en.pricing} variant="secondary">
              See pricing
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
