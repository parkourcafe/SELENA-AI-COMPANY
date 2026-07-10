import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** All public routes (MVP site map + legal pages). */
const routes: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/ru", priority: 0.95 },
  { path: "/ru/ai-map", priority: 0.8 },
  { path: "/services", priority: 0.9 },
  { path: "/ai-training", priority: 0.8 },
  { path: "/ai-automation", priority: 0.8 },
  { path: "/ai-content", priority: 0.8 },
  { path: "/free-ai-map", priority: 0.95 },
  { path: "/about", priority: 0.6 },
  { path: "/contact", priority: 0.9 },
  { path: "/en", priority: 0.9 },
  { path: "/en/contact", priority: 0.9 },
  { path: "/en/privacy", priority: 0.2 },
  { path: "/en/terms", priority: 0.2 },
  { path: "/privacy", priority: 0.2 },
  { path: "/terms", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority }) => ({
    // Root maps to the bare domain, matching the canonical in buildMetadata.
    url: path === "/" ? site.url : `${site.url}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority,
  }));
}
