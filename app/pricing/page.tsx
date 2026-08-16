import { buildMetadata } from "@/lib/metadata";
import { homepage } from "@/lib/data/homepage";
import { visibilityContentEn } from "@/lib/visibility/content.en";
import { visibilityLanguages } from "@/lib/visibility/routes";
import { PageHero } from "@/components/sections/PageHero";
import { PackagesSection } from "@/components/landing/B2BHomeLanding";
import { PricingDirectory, PricingTracks } from "@/components/visibility/PricingTracks";
import { FAQSection } from "@/components/sections/FAQSection";

const content = visibilityContentEn;

export const metadata = buildMetadata({
  title: "Pricing — AI Visibility and AI Systems",
  description:
    "Compare AI Visibility's free check and four paid options separately from Selena Systems' four custom AI Systems services.",
  path: "/pricing",
  locale: "en_US",
  languages: visibilityLanguages("pricing"),
});

export default function PricingPage() {
  return (
    <div lang="en">
      <PageHero
        eyebrow="Selena Systems pricing"
        title="Two products, clearly separated."
        intro="AI Visibility measures how AI sees your business. AI Systems diagnoses and builds the workflows inside it. Start with the map below, then compare only the offers that match your goal."
        compact
      />
      <PricingDirectory content={content.pricing.directory} />
      <PricingTracks content={content.pricing} showHeader={false} />
      <PackagesSection content={homepage} />
      <FAQSection items={content.faq} withHeader={false} />
    </div>
  );
}
