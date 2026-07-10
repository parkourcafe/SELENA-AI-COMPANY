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

/**
 * The original Russian diagnostic funnel, kept as a separate AI-map landing.
 * The primary Russian homepage uses the B2B sales structure.
 */
export function RussianHomeLanding() {
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
