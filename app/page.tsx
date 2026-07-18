import { buildMetadata } from "@/lib/metadata";
import { homepage } from "@/lib/data/homepage";
import { buildHomeStructuredData } from "@/lib/structured-data";
import { B2BHomeLanding } from "@/components/landing/B2BHomeLanding";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = buildMetadata({
  title: "AI-powered operating systems for growing businesses",
  description: homepage.hero.subheadline,
  path: "/",
  locale: "en_US",
  languages: {
    "x-default": "/",
    en: "/",
    ru: "/ru",
  },
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={buildHomeStructuredData("en")} />
      <B2BHomeLanding />
    </>
  );
}
