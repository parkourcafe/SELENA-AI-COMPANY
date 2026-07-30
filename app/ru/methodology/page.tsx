import { buildMetadata } from "@/lib/metadata";
import { visibilityContentRu } from "@/lib/visibility/content.ru";
import { visibilityLanguages } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { MethodologySummary } from "@/components/visibility/MethodologySummary";
import { MeasurementBoundary } from "@/components/visibility/MeasurementBoundary";
import { MetricDefinitionGrid } from "@/components/visibility/MetricDefinitionGrid";
import { Container } from "@/components/ui/Container";

const content = visibilityContentRu;

export const metadata = buildMetadata({
  title: "Методология — доказательства, выборка и границы",
  description:
    "Как Selena Visibility измеряет публичную готовность и AI-ответы: типы доказательств, версионирование, размер выборки и то, чего балл не доказывает.",
  path: "/ru/methodology",
  locale: "ru_RU",
  languages: visibilityLanguages("methodology"),
});

export default function RussianMethodologyPage() {
  return (
    <>
      <PageHero
        eyebrow="Методология"
        title="Сначала доказательства. Каждый результат показывает, что проверено, когда и чего он не доказывает."
        intro="Эта страница — контракт честности за каждым отчётом Selena Visibility."
      />

      <section className="bg-ivory pb-4 sm:pb-8">
        <Container size="narrow">
          <MeasurementBoundary content={content.measurementBoundary} />
        </Container>
      </section>

      <MetricDefinitionGrid
        eyebrow="Определения метрик"
        headline="Что означает каждая цифра."
        metrics={content.metrics}
      />

      <MethodologySummary content={content.methodology} />
    </>
  );
}
