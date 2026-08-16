import { notFound } from "next/navigation";
import { LabArticlePage } from "@/components/lab/LabPages";
import { buildMetadata } from "@/lib/metadata";
import { getLabItem, labContent, labLanguages, labPath } from "@/lib/lab/content";

export function generateStaticParams() {
  return labContent.ru.items.map((item) => ({ section: item.section, slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string; slug: string }> }) {
  const { section, slug } = await params;
  const item = getLabItem("ru", section, slug);
  if (!item) return {};
  return buildMetadata({
    title: `${item.title} — Selena Lab`,
    description: item.summary,
    path: labPath("ru", item.section, item.slug),
    locale: "ru_RU",
    languages: labLanguages(item.section, item.slug),
  });
}

export default async function RussianLabArticleRoute({ params }: { params: Promise<{ section: string; slug: string }> }) {
  const { section, slug } = await params;
  const item = getLabItem("ru", section, slug);
  if (!item) notFound();
  return <LabArticlePage locale="ru" item={item} />;
}
