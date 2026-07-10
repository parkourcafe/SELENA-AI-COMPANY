import { buildMetadata } from "@/lib/metadata";
import { homepage } from "@/lib/data/homepage";
import { B2BHomeLanding } from "@/components/landing/B2BHomeLanding";

export const metadata = buildMetadata({
  title: "AI-powered operating systems for growing businesses",
  description: homepage.hero.subheadline,
  path: "/",
});

export default function HomePage() {
  return <B2BHomeLanding />;
}
