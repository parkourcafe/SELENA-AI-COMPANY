import { notFound } from "next/navigation";
import { LabSectionPage } from "@/components/lab/LabPages";
import { buildMetadata } from "@/lib/metadata";
import { getLabSection, labLanguages, labSectionIds, type LabSectionId } from "@/lib/lab/content";

export function generateStaticParams() {
  return labSectionIds.map((section) => ({ section }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section: sectionId } = await params;
  const section = getLabSection("en", sectionId);
  if (!section) return {};
  return buildMetadata({
    title: `${section.title} — Selena Lab`,
    description: section.description,
    path: `/lab/${section.id}`,
    locale: "en_US",
    languages: labLanguages(section.id),
  });
}

export default async function LabSectionRoute({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!labSectionIds.includes(section as LabSectionId)) notFound();
  return <LabSectionPage locale="en" sectionId={section as LabSectionId} />;
}
