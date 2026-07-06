import { buildMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

import { CinematicHero } from "@/components/sections/CinematicHero";
import { TimeLossCalculator } from "@/components/sections/TimeLossCalculator";
import { GoalSelectorSection } from "@/components/sections/GoalSelectorSection";
import { AIMapCTASection } from "@/components/sections/AIMapCTASection";
import { CoreLoopSection } from "@/components/sections/CoreLoopSection";
import { ProductLadderSection } from "@/components/sections/ProductLadderSection";
import { ServiceModuleGrid } from "@/components/sections/ServiceModuleGrid";
import { ImplementationExamples } from "@/components/sections/ImplementationExamples";
import { FounderStorySection } from "@/components/sections/FounderStorySection";
import { TrustBoundarySection } from "@/components/sections/TrustBoundarySection";
import { NewsletterCTASection } from "@/components/sections/NewsletterCTASection";
import { FAQSection } from "@/components/sections/FAQSection";
import { FinalCTA } from "@/components/sections/FinalCTA";

export const metadata = buildMetadata({
  title: site.tagline,
  description: site.description,
  path: "/",
});

/**
 * Homepage v3 — market-informed diagnostic funnel:
 * hero → calculator → goal paths → AI map → method → product ladder →
 * services → examples → founder → trust → newsletter → FAQ → final CTA.
 */
export default function HomePage() {
  return (
    <>
      <CinematicHero />
      <TimeLossCalculator />
      <GoalSelectorSection />
      <AIMapCTASection />
      <CoreLoopSection />
      <ProductLadderSection />
      <ServiceModuleGrid />
      <ImplementationExamples />
      <FounderStorySection />
      <TrustBoundarySection />
      <NewsletterCTASection />
      <FAQSection />
      <FinalCTA />
    </>
  );
}
