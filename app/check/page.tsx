import { buildMetadata } from "@/lib/metadata";
import { visibilityContentEn } from "@/lib/visibility/content.en";
import { visibilityLanguages } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { VisibilityCheckForm } from "@/components/visibility/VisibilityCheckForm";
import { MeasurementBoundary } from "@/components/visibility/MeasurementBoundary";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

const content = visibilityContentEn;

export const metadata = buildMetadata({
  title: "Website Public Readiness — free check",
  description:
    "Enter your address and get the result on the page: what machine readers already find on your site, what blocks them, and the one thing to fix first. Free, no login, no credit card.",
  path: "/check",
  locale: "en_US",
  languages: visibilityLanguages("check"),
});

export default function CheckPage() {
  return (
    <div lang="en">
      <PageHero
        eyebrow="Free Public Readiness"
        title={content.checkForm.title}
        intro={content.checkForm.intro}
      />

      <section className="bg-ivory pb-20 sm:pb-28">
        <Container size="narrow">
          <div className="grid gap-10">
            <Reveal>
              <VisibilityCheckForm
                copy={content.checkForm}
                reportCopy={content.liveReport}
                locale="en"
              />
            </Reveal>
            <MeasurementBoundary content={content.freeMeasurementBoundary} />
          </div>
        </Container>
      </section>
    </div>
  );
}
