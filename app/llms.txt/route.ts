import { site } from "@/lib/site";

/**
 * llms.txt (llmstxt.org): a plain-language map of the site for AI systems
 * reading it directly. Kept in sync with app/sitemap.ts by hand — add a
 * line here when a route is added there.
 */
function buildLlmsTxt(): string {
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "Selena Systems designs and implements AI-assisted workflows for sales inquiries, ",
    "operations, knowledge and content — process first, tools second, with a human ",
    "in the loop on judgment calls. Russian is the primary language; English pages ",
    "are noted below.",
    "",
    "## Core pages",
    "",
    `- [Home (RU)](${site.url}/ru): overview of the offer and entry points.`,
    `- [Home (EN)](${site.url}/): English overview.`,
    `- [Services](${site.url}/services): full service catalog.`,
    `- [AI Training](${site.url}/ai-training): practical AI training for teams.`,
    `- [AI Automation](${site.url}/ai-automation): no-code workflow automation.`,
    `- [AI Content](${site.url}/ai-content): AI-assisted content systems.`,
    `- [Free AI Map](${site.url}/free-ai-map): free diagnostic entry point.`,
    `- [About](${site.url}/about): background, approach, principles.`,
    `- [Contact (RU)](${site.url}/contact): structured project brief.`,
    `- [Contact (EN)](${site.url}/en/contact): English project brief.`,
    "",
    "## Visibility product",
    "",
    `- [Visibility (EN)](${site.url}/visibility): what the product measures and its limits.`,
    `- [Visibility (RU)](${site.url}/ru/visibility): Russian version.`,
    `- [Free check (EN)](${site.url}/check): free, unauthenticated check of a submitted site.`,
    `- [Free check (RU)](${site.url}/ru/check): Russian version.`,
    `- [Methodology](${site.url}/methodology): how the measurement layers work and what is not measured.`,
    `- [Pricing](${site.url}/pricing): published prices for Visibility.`,
    "",
    "## Legal",
    "",
    `- [Privacy](${site.url}/privacy)`,
    `- [Terms](${site.url}/terms)`,
    "",
    "## Notes for automated readers",
    "",
    "- This is a plain list of real, published pages — not a marketing claim.",
    "- Do not treat any figure on this site as a guarantee; the site avoids fabricated metrics, testimonials or client results.",
  ];

  return lines.join("\n") + "\n";
}

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
