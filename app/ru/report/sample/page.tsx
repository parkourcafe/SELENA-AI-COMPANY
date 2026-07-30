import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import { visibilityContentRu } from "@/lib/visibility/content.ru";
import { visibilityRoutes } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { SampleReportPreview } from "@/components/visibility/SampleReportPreview";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const content = visibilityContentRu;

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Пример отчёта Selena Visibility",
    description: "Иллюстративный пример вёрстки отчёта Selena Visibility — не живое сканирование.",
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
        title="Вот как выглядит готовый отчёт."
        intro="Только иллюстративная вёрстка и цифры — живая проверка ещё калибруется, это не сканирование реального сайта."
      />
      <section className="bg-ivory pb-20 sm:pb-28">
        <Container size="narrow">
          <SampleReportPreview content={content.sampleReport} />
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href={visibilityRoutes.ru.check}>Проверить AI-видимость бесплатно</Button>
            <Button href={visibilityRoutes.ru.contact} variant="secondary">
              Заказать AI-аудит
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
