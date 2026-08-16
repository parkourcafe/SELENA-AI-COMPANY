import { notFound } from "next/navigation";
import { LabArticlePage } from "@/components/lab/LabPages";
import { buildMetadata } from "@/lib/metadata";
import { getLabItem, labContent, labLanguages, labPath } from "@/lib/lab/content";

export function generateStaticParams() {
  return labContent.en.items.map((item) => ({ section: item.section, slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string; slug: string }> }) {
  const { section, slug } = await params;
  const item = getLabItem("en", section, slug);
  if (!item) return {};
  return buildMetadata({
    title: `${item.title} — Selena Lab`,
    description: item.summary,
    path: labPath("en", item.section, item.slug),
    locale: "en_US",
    languages: labLanguages(item.section, item.slug),
  });
}

export default async function LabArticleRoute({ params }: { params: Promise<{ section: string; slug: string }> }) {
  const { section, slug } = await params;
  const item = getLabItem("en", section, slug);
  if (!item) notFound();
  return <LabArticlePage locale="en" item={item} />;
}
