import { buildMetadata } from "@/lib/metadata";
import { visibilityContentRu } from "@/lib/visibility/content.ru";
import { visibilityLanguages } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { PricingTracks } from "@/components/visibility/PricingTracks";
import { FAQSection } from "@/components/sections/FAQSection";

const content = visibilityContentRu;

export const metadata = buildMetadata({
  title: "Цены — отслеживайте сами или доверьте Selena Systems",
  description:
    "Бесплатная проверка видимости, автоматический план Monitor за $9/мес и существующая лестница AI Audit, Sprint и Business OS.",
  path: "/ru/pricing",
  locale: "ru_RU",
  languages: visibilityLanguages("pricing"),
});

export default function RussianPricingPage() {
  return (
    <>
      <PageHero eyebrow="Цены" title={content.pricing.title} intro={content.pricing.intro} />
      <PricingTracks content={content.pricing} />
      <FAQSection items={content.faq} withHeader={false} />
    </>
  );
}
