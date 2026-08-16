import { LabLandingPage } from "@/components/lab/LabPages";
import { labContent, labLanguages } from "@/lib/lab/content";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Selena Lab — исследования, руководства, эксперименты и курсы",
  description: labContent.ru.intro,
  path: "/ru/lab",
  locale: "ru_RU",
  languages: labLanguages(),
});

export default function RussianLabPage() {
  return <LabLandingPage locale="ru" />;
}
