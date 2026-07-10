import { buildMetadata } from "@/lib/metadata";
import { ruHomepage } from "@/lib/data/homepage-ru";
import { B2BHomeLanding } from "@/components/landing/B2BHomeLanding";

export const metadata = buildMetadata({
  title: "AI-системы для растущего бизнеса",
  description: ruHomepage.hero.subheadline,
  path: "/ru",
  locale: "ru_RU",
  languages: {
    en: "/",
    ru: "/ru",
  },
});

export default function RussianHomePage() {
  return <B2BHomeLanding content={ruHomepage} />;
}
