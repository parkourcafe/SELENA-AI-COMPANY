import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import { getSampleReport } from "@/lib/visibility/sample-report-data";
import { visibilityRoutes } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { SampleReport } from "@/components/visibility/SampleReport";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const content = getSampleReport("ru");

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Пример отчёта о видимости",
    description:
      "Иллюстративный пример структуры отчёта Selena Visibility и границ доказательности — не живое сканирование какого-либо сайта.",
    path: "/ru/report/sample",
    locale: "ru_RU",
  }),
  robots: { index: false, follow: false },
};

export default function RussianSampleReportPage() {
  return (
    <>
      <PageHero
        eyebrow="Пример отчёта"
        title="Это структура отчёта, а не результат."
        intro={content.sampleDisclaimer}
      >
        <div className="flex flex-wrap items-center gap-4">
          <Button href={visibilityRoutes.ru.check}>Проверить видимость бесплатно</Button>
          <Button href={visibilityRoutes.ru.contact} variant="secondary">
            Заказать AI-аудит
          </Button>
        </div>
      </PageHero>

      <SampleReport content={content} />

      <section className="bg-surface pb-20 sm:pb-28">
        <Container size="narrow">
          <div className="flex flex-wrap gap-4">
            <Button href={visibilityRoutes.ru.methodology} variant="secondary">
              Читать методологию
            </Button>
            <Button href={visibilityRoutes.ru.pricing} variant="secondary">
              Посмотреть цены
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
