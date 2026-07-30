import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import { visibilityContentEn } from "@/lib/visibility/content.en";
import { visibilityRoutes } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { SampleReportPreview } from "@/components/visibility/SampleReportPreview";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const content = visibilityContentEn;

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Sample Visibility Report",
    description: "An illustrative sample of the Selena Visibility report layout — not a live scan.",
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
        title="This is what a finished report looks like."
        intro="Illustrative layout and numbers only — the live checker is being calibrated, this is not a scan of a real website."
      />
      <section className="bg-ivory pb-20 sm:pb-28">
        <Container size="narrow">
          <SampleReportPreview content={content.sampleReport} />
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href={visibilityRoutes.en.check}>Run a Free Visibility Check</Button>
            <Button href={visibilityRoutes.en.contact} variant="secondary">
              Book an AI Audit
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
