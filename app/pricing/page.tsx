import { buildMetadata } from "@/lib/metadata";
import { visibilityContentEn } from "@/lib/visibility/content.en";
import { visibilityLanguages } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { PricingTracks } from "@/components/visibility/PricingTracks";
import { FAQSection } from "@/components/sections/FAQSection";

const content = visibilityContentEn;

export const metadata = buildMetadata({
  title: "Pricing — track it yourself, or have Selena Systems fix it",
  description:
    "Free Visibility Check, founding Monitor/Growth plans, and the existing AI Audit, Sprint and Business OS ladder.",
  path: "/pricing",
  locale: "en_US",
  languages: visibilityLanguages("pricing"),
});

export default function PricingPage() {
  return (
    <div lang="en">
      <PageHero eyebrow="Pricing" title={content.pricing.title} intro={content.pricing.intro} />
      <PricingTracks content={content.pricing} />
      <FAQSection items={content.faq} withHeader={false} />
    </div>
  );
}
