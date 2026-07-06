import CinematicHero from "@/components/sections/CinematicHero";
import ChaosToSystemSection from "@/components/sections/ChaosToSystemSection";
import CoreLoopSection from "@/components/sections/CoreLoopSection";
import ServiceModuleGrid from "@/components/sections/ServiceModuleGrid";
import AudiencePathways from "@/components/sections/AudiencePathways";
import ImplementationExamples from "@/components/sections/ImplementationExamples";
import ProcessTimeline from "@/components/sections/ProcessTimeline";
import TrustBoundarySection from "@/components/sections/TrustBoundarySection";
import PackageCards from "@/components/sections/PackageCards";
import FAQSection from "@/components/sections/FAQSection";
import FinalCTA from "@/components/sections/FinalCTA";

export default function HomePage() {
  return (
    <>
      <CinematicHero />
      <ChaosToSystemSection />
      <CoreLoopSection />
      <ServiceModuleGrid />
      <AudiencePathways />
      <ImplementationExamples />
      <ProcessTimeline />
      <TrustBoundarySection />
      <PackageCards />
      <FAQSection />
      <FinalCTA />
    </>
  );
}
