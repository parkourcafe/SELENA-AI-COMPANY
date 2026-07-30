/**
 * Lightweight, targeted HTML signal extraction (SSOT §8.2, §8.3). This is
 * deliberately regex-based rather than a full DOM parser — CLAUDE.md asks
 * to avoid heavy dependencies, and every signal here is a single
 * well-known tag/attribute, not general-purpose HTML traversal. Treat
 * these as best-effort extraction: a `null`/`false` result from a
 * malformed page means `not_measured`, never a silent failing score.
 */

export interface HtmlSignals {
  title: string | null;
  h1Count: number;
  h1Text: string | null;
  canonicalUrl: string | null;
  metaRobots: string | null;
  hasViewportMeta: boolean;
  jsonLdBlocks: unknown[];
  jsonLdParseErrors: number;
  links: { href: string; text: string }[];
}

function matchAll(html: string, pattern: RegExp): RegExpMatchArray[] {
  return [...html.matchAll(pattern)];
}

function extractAttr(tag: string, attr: string): string | null {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match ? match[1] : null;
}

export function extractHtmlSignals(html: string): HtmlSignals {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : null;

  const h1Matches = matchAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  const h1Text = h1Matches[0] ? h1Matches[0][1].replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ") : null;

  const linkTags = matchAll(html, /<link\b[^>]*>/gi);
  const canonicalTag = linkTags.find((m) => /rel\s*=\s*["']canonical["']/i.test(m[0]));
  const canonicalUrl = canonicalTag ? extractAttr(canonicalTag[0], "href") : null;

  const metaTags = matchAll(html, /<meta\b[^>]*>/gi);
  const robotsTag = metaTags.find((m) => /name\s*=\s*["']robots["']/i.test(m[0]));
  const metaRobots = robotsTag ? extractAttr(robotsTag[0], "content") : null;
  const hasViewportMeta = metaTags.some((m) => /name\s*=\s*["']viewport["']/i.test(m[0]));

  const jsonLdMatches = matchAll(html, /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const jsonLdBlocks: unknown[] = [];
  let jsonLdParseErrors = 0;
  for (const match of jsonLdMatches) {
    try {
      jsonLdBlocks.push(JSON.parse(match[1].trim()));
    } catch {
      jsonLdParseErrors += 1;
    }
  }

  const anchorMatches = matchAll(html, /<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi);
  const links = anchorMatches.map((m) => ({
    href: m[1],
    text: m[2].replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " "),
  }));

  return {
    title,
    h1Count: h1Matches.length,
    h1Text,
    canonicalUrl,
    metaRobots,
    hasViewportMeta,
    jsonLdBlocks,
    jsonLdParseErrors,
    links,
  };
}

const CONTACT_HREF_PATTERNS = [/^mailto:/i, /^tel:/i, /wa\.me\//i, /whatsapp/i, /\/contact/i];

export function hasContactPath(signals: HtmlSignals): boolean {
  return signals.links.some((link) => CONTACT_HREF_PATTERNS.some((pattern) => pattern.test(link.href)));
}

const ABOUT_HREF_PATTERN = /\/about/i;

export function hasAboutLink(signals: HtmlSignals): boolean {
  return signals.links.some((link) => ABOUT_HREF_PATTERN.test(link.href));
}

const SERVICE_HREF_PATTERN = /\/(services?|products?|pricing|solutions?)/i;

export function findServicePageLink(signals: HtmlSignals): string | null {
  const match = signals.links.find((link) => SERVICE_HREF_PATTERN.test(link.href));
  return match ? match.href : null;
}

const ORG_JSONLD_TYPES = new Set([
  "Organization",
  "LocalBusiness",
  "Product",
  "Service",
  "Corporation",
  "Store",
]);

function collectTypes(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    for (const item of node) collectTypes(item, out);
    return;
  }
  if (!node || typeof node !== "object") return;
  const record = node as Record<string, unknown>;
  const type = record["@type"];
  if (typeof type === "string") out.add(type);
  if (Array.isArray(type)) type.forEach((t) => typeof t === "string" && out.add(t));
  if (Array.isArray(record["@graph"])) collectTypes(record["@graph"], out);
}

export function hasOrgLikeJsonLd(signals: HtmlSignals): boolean {
  const types = new Set<string>();
  for (const block of signals.jsonLdBlocks) collectTypes(block, types);
  return [...types].some((t) => ORG_JSONLD_TYPES.has(t));
}
