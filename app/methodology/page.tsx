import { buildMetadata } from "@/lib/metadata";
import { visibilityContentEn } from "@/lib/visibility/content.en";
import { visibilityLanguages } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { MethodologySummary } from "@/components/visibility/MethodologySummary";
import { MeasurementBoundary } from "@/components/visibility/MeasurementBoundary";
import { MetricDefinitionGrid } from "@/components/visibility/MetricDefinitionGrid";
import { Container } from "@/components/ui/Container";

const content = visibilityContentEn;

export const metadata = buildMetadata({
  title: "Methodology — evidence, sample size and limits",
  description:
    "How Selena Visibility measures public readiness and AI answers: evidence types, versioning, sample-size disclosure and what the score cannot prove.",
  path: "/methodology",
  locale: "en_US",
  languages: visibilityLanguages("methodology"),
});

export default function MethodologyPage() {
  return (
    <div lang="en">
      <PageHero
        eyebrow="Methodology"
        title="Evidence first. Every result shows what was checked, when, and what it does not prove."
        intro="This page is the honesty contract behind every Selena Visibility report."
      />

      <section className="bg-ivory pb-4 sm:pb-8">
        <Container size="narrow">
          <MeasurementBoundary content={content.measurementBoundary} />
        </Container>
      </section>

      <MetricDefinitionGrid
        eyebrow="Metric definitions"
        headline="What each number means."
        metrics={content.metrics}
      />

      <MethodologySummary content={content.methodology} />
    </div>
  );
}
