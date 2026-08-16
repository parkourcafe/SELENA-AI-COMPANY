import { LabLandingPage } from "@/components/lab/LabPages";
import { labContent, labLanguages } from "@/lib/lab/content";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Selena Lab — AI research, guides, experiments and courses",
  description: labContent.en.intro,
  path: "/lab",
  locale: "en_US",
  languages: labLanguages(),
});

export default function LabPage() {
  return <LabLandingPage locale="en" />;
}
