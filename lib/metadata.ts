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
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const url = `${site.url}${path === "/" ? "" : path}`;
  const fullTitle = path === "/" ? `${site.name} — ${title}` : `${title} — ${site.name}`;

  return {
    // `absolute` opts out of the root layout's title.template so pages that
    // already include the brand don't render a doubled «— KORA — KORA».
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: site.locale,
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
