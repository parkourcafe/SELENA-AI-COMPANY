import { buildMetadata } from "@/lib/metadata";
import { visibilityContentRu } from "@/lib/visibility/content.ru";
import { visibilityLanguages } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { VisibilityCheckForm } from "@/components/visibility/VisibilityCheckForm";
import { MeasurementBoundary } from "@/components/visibility/MeasurementBoundary";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

const content = visibilityContentRu;

export const metadata = buildMetadata({
  title: "Посмотрите, как AI читает ваш сайт — бесплатная проверка",
  description:
    "Укажите адрес и получите результат прямо на странице: что машинные читатели уже находят на сайте, что им мешает и что чинить первым. Бесплатно, без регистрации и карты.",
  path: "/ru/check",
  locale: "ru_RU",
  languages: visibilityLanguages("check"),
});

export default function RussianCheckPage() {
  return (
    <>
      <PageHero
        eyebrow="Бесплатная проверка видимости"
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
                locale="ru"
              />
            </Reveal>
            <MeasurementBoundary content={content.measurementBoundary} />
          </div>
        </Container>
      </section>
    </>
  );
}
