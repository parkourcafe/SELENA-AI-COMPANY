import { buildMetadata } from "@/lib/metadata";
import { ruHomepage } from "@/lib/data/homepage-ru";
import { visibilityContentRu } from "@/lib/visibility/content.ru";
import { visibilityLanguages } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { PackagesSection } from "@/components/landing/B2BHomeLanding";
import { PricingDirectory, PricingTracks } from "@/components/visibility/PricingTracks";
import { FAQSection } from "@/components/sections/FAQSection";

const content = visibilityContentRu;

export const metadata = buildMetadata({
  title: "Цены — Selena Visibility и AI Systems",
  description:
    "Сравните бесплатную проверку и четыре варианта Selena Visibility отдельно от четырёх индивидуальных услуг AI Systems.",
  path: "/ru/pricing",
  locale: "ru_RU",
  languages: visibilityLanguages("pricing"),
});

export default function RussianPricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Цены Selena Systems"
        title="Два продукта — без смешения."
        intro="Selena Visibility измеряет, как AI видит ваш бизнес. AI Systems диагностирует и строит процессы внутри него. Сначала выберите направление, затем сравнивайте только подходящие предложения."
        compact
      />
      <PricingDirectory content={content.pricing.directory} />
      <PricingTracks content={content.pricing} showHeader={false} />
      <PackagesSection content={ruHomepage} />
      <FAQSection items={content.faq} withHeader={false} />
    </>
  );
}
