import { buildMetadata } from "@/lib/metadata";
import { visibilityContentEn } from "@/lib/visibility/content.en";
import { visibilityLanguages } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { PricingTracks } from "@/components/visibility/PricingTracks";
import { FAQSection } from "@/components/sections/FAQSection";

const content = visibilityContentEn;

export const metadata = buildMetadata({
  title: "Selena Visibility pricing — Snapshot, Landscape, Expert and Implementation",
  description:
    "Four evidence-based AI visibility offers: AI Visibility Snapshot, AI Visibility Landscape, Expert Verified and Implementation + 90 days.",
  path: "/pricing",
  locale: "en_US",
  languages: visibilityLanguages("pricing"),
});

export default function PricingPage() {
  return (
    <div lang="en">
      <PageHero eyebrow="Selena Visibility pricing" title={content.pricing.title} intro={content.pricing.intro} />
      <PricingTracks content={content.pricing} showHeader={false} />
      <FAQSection items={content.faq} withHeader={false} />
    </div>
  );
}
