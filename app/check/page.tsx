import { buildMetadata } from "@/lib/metadata";
import { visibilityContentEn } from "@/lib/visibility/content.en";
import { visibilityLanguages, visibilityRoutes } from "@/lib/visibility/routes";
import { isFeatureEnabled } from "@/lib/diagnostics/flags";
import { PageHero } from "@/components/sections/PageHero";
import { VisibilityCheckForm } from "@/components/visibility/VisibilityCheckForm";
import { MeasurementBoundary } from "@/components/visibility/MeasurementBoundary";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

const content = visibilityContentEn;

export const metadata = buildMetadata({
  title: "Run a Free Visibility Check",
  description:
    "Check your public readiness, entity clarity and a limited, dated AI-answer sample — free, no login, no credit card.",
  path: "/check",
  locale: "en_US",
  languages: visibilityLanguages("check"),
});

export default function CheckPage() {
  return (
    <div lang="en">
      <PageHero
        eyebrow="Free Visibility Check"
        title={content.checkForm.title}
        intro={content.checkForm.intro}
      />

      <section className="bg-ivory pb-20 sm:pb-28">
        <Container size="narrow">
          <div className="grid gap-10">
            <Reveal>
              <VisibilityCheckForm
                copy={content.checkForm}
                sampleReportHref={visibilityRoutes.en.sampleReport}
                auditHref={visibilityRoutes.en.contact}
                mockFlowEnabled={isFeatureEnabled("VISIBILITY_FREE_CHECK_ENABLED")}
              />
            </Reveal>
            <MeasurementBoundary content={content.measurementBoundary} />
          </div>
        </Container>
      </section>
    </div>
  );
}
