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
  pages: DiscoveredPage[];
  /**
   * Public Readiness / Entity Clarity are computed from the homepage's
   * checks only in v1 — SSOT §4.1 orders candidate pages by priority but
   * a full cross-page weighted aggregation is future work, not
   * implemented here. Other discovered pages are still fetched and
   * stored as evidence (status, title) for the report.
   */
  homepageChecks: CheckResult[];
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

async function checkSitemap(baseUrl: string, options?: SafeFetchOptions): Promise<boolean> {
  const sitemapUrl = new URL("/sitemap.xml", baseUrl).toString();
  const result = await safeFetch(sitemapUrl, options);
  return result.ok && result.statusCode >= 200 && result.statusCode < 300;
}

async function checkRobots(baseUrl: string, options?: SafeFetchOptions): Promise<boolean> {
  const robotsUrl = new URL("/robots.txt", baseUrl).toString();
  const result = await safeFetch(robotsUrl, options);
  if (!result.ok) return false; // absent/unreachable robots.txt is not a block signal
  return /User-agent:\s*\*[\s\S]{0,80}?Disallow:\s*\/\s*(\n|$)/i.test(result.body);
}

/**
 * Five-page discovery (SSOT §4.1, §14.2). Priority order: homepage,
 * primary service/product page, about, contact, FAQ. Pages that can't be
 * found are simply absent from the result (recorded as evidence, not
 * guessed at) — a missing page is itself a technical-check signal
 * (offer.service_page_discovered / conversion.about_page_discovered).
 */
export async function discoverAndCrawl(baseUrl: string, options?: SafeFetchOptions): Promise<DiscoveryResult> {
  const [sitemapFound, robotsDisallowsAll] = await Promise.all([
    checkSitemap(baseUrl, options),
    checkRobots(baseUrl, options),
  ]);

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

    for (const candidate of candidates) {
      if (pages.length >= MAX_PAGES) break;
      if (!candidate.href) continue;
      let absoluteUrl: string;
      try {
        absoluteUrl = new URL(candidate.href, homepageFetch.finalUrl).toString();
      } catch {
        continue;
      }
      const pageFetch = await toPageFetchResult(absoluteUrl, options);
      pages.push({ role: candidate.role, requestedUrl: absoluteUrl, fetch: pageFetch });
    }
  }

  return { baseUrl, sitemapFound, robotsDisallowsAll, pages, homepageChecks };
}
