import type { Metadata } from "next";
import { site } from "@/lib/site";

/**
 * Build consistent per-page metadata (title, description, canonical, OG).
 * Keeps SEO wiring in one place so every route stays consistent.
 */
export function buildMetadata({
  title,
  description,
  path = "/",
  locale = site.locale,
  languages,
}: {
  title: string;
  description: string;
  path?: string;
  locale?: string;
  languages?: Record<string, string>;
}): Metadata {
  const url = `${site.url}${path === "/" ? "" : path}`;
  const fullTitle = path === "/" ? `${site.name} — ${title}` : `${title} — ${site.name}`;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "website",
      locale,
      siteName: site.name,
      title: fullTitle,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}
