import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Internal operator tooling (Video Radar). Not a security control — the
      // routes are gated server-side — but it keeps internal research out of
      // search results and AI crawls.
      disallow: ["/internal/", "/api/internal/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
