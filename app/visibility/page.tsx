import { buildMetadata } from "@/lib/metadata";
import { visibilityContentEn } from "@/lib/visibility/content.en";
import { visibilityLanguages } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { MetricDefinitionGrid } from "@/components/visibility/MetricDefinitionGrid";
import { MeasurementBoundary } from "@/components/visibility/MeasurementBoundary";
import { ProductPath } from "@/components/visibility/ProductPath";
import { FAQSection } from "@/components/sections/FAQSection";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

const content = visibilityContentEn;

export const metadata = buildMetadata({
  title: "AI Visibility — how search and AI represent your business",
  description:
    "Selena Visibility measures public readiness, entity clarity and a limited, dated sample of AI answers — with evidence, not guesses.",
  path: "/visibility",
  locale: "en_US",
  languages: visibilityLanguages("visibility"),
});

export default function VisibilityPage() {
  return (
    <div lang="en">
      <PageHero eyebrow={content.hero.eyebrow} title={content.hero.title} intro={content.hero.intro}>
        <div className="flex flex-wrap items-center gap-4">
          <Button href={content.cta.primary.href} size="lg">
            {content.cta.primary.label}
          </Button>
          <Button href={content.cta.secondary.href} variant="secondary" size="lg">
            {content.cta.secondary.label}
          </Button>
        </div>
      </PageHero>

      <MetricDefinitionGrid
        eyebrow="What is measured"
        headline="Five things, each with its own evidence."
        metrics={content.metrics}
      />

      <section className="bg-ivory pb-20 sm:pb-28">
        <Container size="narrow">
          <MeasurementBoundary content={content.measurementBoundary} />
        </Container>
      </section>

      <ProductPath
        eyebrow={content.productPath.eyebrow}
        headline={content.productPath.headline}
        intro={content.productPath.intro}
        steps={content.productPath.steps}
      />

      <FAQSection items={content.faq} />

      <section className="bg-charcoal py-20 text-ivory sm:py-28">
        <Container size="narrow">
          <Reveal className="text-center">
            <h2 className="text-h2 text-ivory">{content.hero.title}</h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button href={content.cta.primary.href} size="lg" variant="onDark">
                {content.cta.primary.label}
              </Button>
              <Button href={content.cta.secondary.href} size="lg" variant="secondary">
                {content.cta.secondary.label}
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
