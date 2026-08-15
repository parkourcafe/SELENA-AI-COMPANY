import { buildMetadata } from "@/lib/metadata";
import { visibilityContentEn } from "@/lib/visibility/content.en";
import { visibilityLanguages } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { PricingTracks } from "@/components/visibility/PricingTracks";
import { FAQSection } from "@/components/sections/FAQSection";

const content = visibilityContentEn;

export const metadata = buildMetadata({
  title: "Selena Visibility pricing — Visitor, Full Landscape, Expert and Growth",
  description:
    "Four evidence-based AI visibility plans: Visitor Local, Full AI Landscape, Expert Verified and Growth 90 Days.",
  path: "/pricing",
  locale: "en_US",
  languages: visibilityLanguages("pricing"),
});

export default function PricingPage() {
  return (
    <div lang="en">
      <PageHero eyebrow="Selena Visibility pricing" title={content.pricing.title} intro={content.pricing.intro} />
      <PricingTracks content={content.pricing} />
      <FAQSection items={content.faq} withHeader={false} />
    </div>
  );
}
