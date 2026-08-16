import { buildMetadata } from "@/lib/metadata";
import { visibilityContentRu } from "@/lib/visibility/content.ru";
import { visibilityLanguages } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { PricingTracks } from "@/components/visibility/PricingTracks";
import { FAQSection } from "@/components/sections/FAQSection";

const content = visibilityContentRu;

export const metadata = buildMetadata({
  title: "Тарифы Selena Visibility — Snapshot, Landscape, Expert и Implementation",
  description:
    "Четыре доказательных предложения AI-видимости: AI Visibility Snapshot, AI Visibility Landscape, Expert Verified и Implementation + 90 days.",
  path: "/ru/pricing",
  locale: "ru_RU",
  languages: visibilityLanguages("pricing"),
});

export default function RussianPricingPage() {
  return (
    <>
      <PageHero eyebrow="Тарифы Selena Visibility" title={content.pricing.title} intro={content.pricing.intro} />
      <PricingTracks content={content.pricing} showHeader={false} />
      <FAQSection items={content.faq} withHeader={false} />
    </>
  );
}
