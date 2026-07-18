import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

type PublicRoute = {
  path: string;
  priority: number;
  languages?: Record<string, string>;
};

const routes: PublicRoute[] = [
  { path: "/", priority: 1, languages: { "x-default": "/", en: "/", ru: "/ru" } },
  { path: "/ru", priority: 0.95, languages: { "x-default": "/", en: "/", ru: "/ru" } },
  { path: "/ru/ai-map", priority: 0.8 },
  { path: "/services", priority: 0.9 },
  { path: "/ai-training", priority: 0.8 },
  { path: "/ai-automation", priority: 0.8 },
  { path: "/ai-content", priority: 0.8 },
  { path: "/free-ai-map", priority: 0.95 },
  { path: "/about", priority: 0.6 },
  { path: "/contact", priority: 0.9, languages: { "x-default": "/en/contact", en: "/en/contact", ru: "/contact" } },
  { path: "/en/contact", priority: 0.9, languages: { "x-default": "/en/contact", en: "/en/contact", ru: "/contact" } },
  { path: "/en/privacy", priority: 0.2, languages: { "x-default": "/en/privacy", en: "/en/privacy", ru: "/privacy" } },
  { path: "/en/terms", priority: 0.2, languages: { "x-default": "/en/terms", en: "/en/terms", ru: "/terms" } },
  { path: "/privacy", priority: 0.2, languages: { "x-default": "/en/privacy", en: "/en/privacy", ru: "/privacy" } },
  { path: "/terms", priority: 0.2, languages: { "x-default": "/en/terms", en: "/en/terms", ru: "/terms" } },
];

function absoluteUrl(path: string) {
  return path === "/" ? site.url : `${site.url}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority, languages }) => ({
    url: absoluteUrl(path),
    changeFrequency: "monthly",
    priority,
    ...(languages
      ? {
          alternates: {
            languages: Object.fromEntries(
              Object.entries(languages).map(([language, href]) => [language, absoluteUrl(href)]),
            ),
          },
        }
      : {}),
  }));
}
