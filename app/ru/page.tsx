import { buildMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";
import { RussianHomeLanding } from "@/components/landing/RussianHomeLanding";

export const metadata = buildMetadata({
  title: site.tagline,
  description: site.description,
  path: "/ru",
  locale: "ru_RU",
  languages: {
    en: "/",
    ru: "/ru",
  },
});

export default function RussianHomePage() {
  return <RussianHomeLanding />;
}
