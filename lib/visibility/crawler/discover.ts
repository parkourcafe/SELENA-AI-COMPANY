import { safeFetch, type SafeFetchOptions } from "../security/url-safety";
import { extractHtmlSignals, hasAboutLink, hasContactPath, findServicePageLink } from "../checks/htmlSignals";
import { runTechnicalChecks, type CheckResult, type PageFetchForChecks } from "../checks/technicalChecks";

export type PageRole = "homepage" | "service" | "about" | "contact" | "faq";

export interface DiscoveredPage {
  role: PageRole;
  requestedUrl: string;
  fetch: PageFetchForChecks;
}

export interface DiscoveryResult {
  baseUrl: string;
  sitemapFound: boolean;
  robotsDisallowsAll: boolean;
  robots: PublicTextResource;
  sitemap: PublicTextResource;
  llmsTxt: PublicTextResource;
  pages: DiscoveredPage[];
  /**
   * Kept for the compact legacy readiness layers. The canonical RC6 score
   * aggregates page-level checks from every successfully read key page.
   */
  homepageChecks: CheckResult[];
}

export interface PublicTextResource {
  url: string;
  status: "available" | "not_found" | "unavailable";
  statusCode: number | null;
  body: string | null;
  error?: string;
}

const MAX_PAGES = 5;
const FAQ_HREF_PATTERN = /faq|frequently-asked/i;

async function toPageFetchResult(requestedUrl: string, options?: SafeFetchOptions): Promise<PageFetchForChecks> {
  const result = await safeFetch(requestedUrl, options);
  if (!result.ok) {
    return {
      requestedUrl,
      finalUrl: requestedUrl,
      statusCode: 0,
      headers: {},
      html: null,
      fetchError: result.error,
    };
  }
  return {
    requestedUrl,
    finalUrl: result.finalUrl,
    statusCode: result.statusCode,
    headers: result.headers,
    html: result.body,
  };
}

async function fetchPublicTextResource(
  baseUrl: string,
  pathname: string,
  options?: SafeFetchOptions,
): Promise<PublicTextResource> {
  const url = new URL(pathname, baseUrl).toString();
  const result = await safeFetch(url, { ...options, maxBytes: 250_000 });
  if (!result.ok) {
    return { url, status: "unavailable", statusCode: null, body: null, error: result.error };
  }
  if (result.statusCode === 404 || result.statusCode === 410) {
    return { url: result.finalUrl, status: "not_found", statusCode: result.statusCode, body: null };
  }
  if (result.statusCode < 200 || result.statusCode >= 300) {
    return {
      url: result.finalUrl,
      status: "unavailable",
      statusCode: result.statusCode,
      body: null,
      error: `HTTP ${result.statusCode}`,
    };
  }
  return {
    url: result.finalUrl,
    status: "available",
    statusCode: result.statusCode,
    body: result.body,
  };
}

/**
 * Five-page discovery (SSOT §4.1, §14.2). Priority order: homepage,
 * primary service/product page, about, contact, FAQ. Pages that can't be
 * found are simply absent from the result (recorded as evidence, not
 * guessed at) — a missing page is itself a technical-check signal
 * (offer.service_page_discovered / conversion.about_page_discovered).
 */
export async function discoverAndCrawl(baseUrl: string, options?: SafeFetchOptions): Promise<DiscoveryResult> {
  const [sitemap, robots, llmsTxt] = await Promise.all([
    fetchPublicTextResource(baseUrl, "/sitemap.xml", options),
    fetchPublicTextResource(baseUrl, "/robots.txt", options),
    fetchPublicTextResource(baseUrl, "/llms.txt", options),
  ]);
  const sitemapFound = sitemap.status === "available";
  const robotsDisallowsAll = Boolean(
    robots.body && /User-agent:\s*\*[\s\S]{0,160}?Disallow:\s*\/\s*(?:\r?\n|$)/i.test(robots.body),
  );

  const homepageFetch = await toPageFetchResult(baseUrl, options);
  const pages: DiscoveredPage[] = [{ role: "homepage", requestedUrl: baseUrl, fetch: homepageFetch }];

  const homepageChecks = runTechnicalChecks(homepageFetch, { sitemapFound });

  if (homepageFetch.html) {
    const signals = extractHtmlSignals(homepageFetch.html);
    const candidates: { role: PageRole; href: string | null }[] = [
      { role: "service", href: findServicePageLink(signals) },
      { role: "about", href: hasAboutLink(signals) ? signals.links.find((l) => /\/about/i.test(l.href))?.href ?? null : null },
      { role: "contact", href: hasContactPath(signals) ? signals.links.find((l) => /\/contact/i.test(l.href))?.href ?? null : null },
      { role: "faq", href: signals.links.find((l) => FAQ_HREF_PATTERN.test(l.href))?.href ?? null },
    ];

    const origin = new URL(homepageFetch.finalUrl).origin;
    const seen = new Set([new URL(homepageFetch.finalUrl).toString()]);
    const selected: { role: PageRole; requestedUrl: string }[] = [];
    for (const candidate of candidates) {
      if (selected.length >= MAX_PAGES - 1 || !candidate.href) continue;
      try {
        const absolute = new URL(candidate.href, homepageFetch.finalUrl);
        absolute.hash = "";
        if (!/^https?:$/.test(absolute.protocol) || absolute.origin !== origin || seen.has(absolute.toString())) continue;
        seen.add(absolute.toString());
        selected.push({ role: candidate.role, requestedUrl: absolute.toString() });
      } catch {
        // Malformed or unsupported links are evidence about the page, but
        // they are not safe crawl targets and are ignored here.
      }
    }
    const fetched = await Promise.all(
      selected.map(async (candidate) => ({
        role: candidate.role,
        requestedUrl: candidate.requestedUrl,
        fetch: await toPageFetchResult(candidate.requestedUrl, options),
      })),
    );
    pages.push(...fetched);
  }

  return {
    baseUrl,
    sitemapFound,
    robotsDisallowsAll,
    robots,
    sitemap,
    llmsTxt,
    pages,
    homepageChecks,
  };
}
