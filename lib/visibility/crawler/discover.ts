import { promises as dns } from "node:dns";
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
  markdownRepresentation: NegotiatedResource;
  dnsAid: DnsAidResult;
  agentResources: Record<AgentResourceKey, PublicTextResource>;
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

export interface NegotiatedResource extends PublicTextResource {
  requestedAccept: "text/markdown";
  contentType: string | null;
}

export interface DnsAidResult {
  ownerNames: string[];
  status: "available" | "not_found" | "unavailable";
  records: string[];
  error?: string;
}

const AGENT_RESOURCE_PATHS = {
  webBotAuth: "/.well-known/http-message-signatures-directory",
  apiCatalog: "/.well-known/api-catalog",
  oauthDiscovery: "/.well-known/oauth-authorization-server",
  oauthProtectedResource: "/.well-known/oauth-protected-resource",
  authMd: "/auth.md",
  mcpServerCard: "/.well-known/mcp/server-card.json",
  a2aAgentCard: "/.well-known/agent-card.json",
  agentSkills: "/.well-known/agent-skills/index.json",
  openApi: "/openapi.json",
  ucp: "/.well-known/ucp",
  acp: "/.well-known/acp.json",
  ap2: "/.well-known/ap2.json",
} as const;

export type AgentResourceKey = keyof typeof AGENT_RESOURCE_PATHS;

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
  const result = await safeFetch(url, {
    ...options,
    maxBytes: 250_000,
    allowedContentTypes: [
      /^text\//i,
      /^application\/(?:json|ld\+json|xml|yaml|x-yaml)/i,
    ],
    accept: "application/json,text/plain,text/markdown,application/xml,text/xml;q=0.9,*/*;q=0.1",
  });
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

async function fetchMarkdownRepresentation(baseUrl: string, options?: SafeFetchOptions): Promise<NegotiatedResource> {
  const result = await safeFetch(baseUrl, {
    ...options,
    maxBytes: 500_000,
    accept: "text/markdown",
    allowedContentTypes: [/^text\/markdown/i, /^text\/plain/i, /^text\/html/i],
  });
  if (!result.ok) {
    return {
      url: baseUrl,
      status: "unavailable",
      statusCode: null,
      body: null,
      error: result.error,
      requestedAccept: "text/markdown",
      contentType: null,
    };
  }
  const status = result.statusCode === 404 || result.statusCode === 410
    ? "not_found"
    : result.statusCode >= 200 && result.statusCode < 300
      ? "available"
      : "unavailable";
  return {
    url: result.finalUrl,
    status,
    statusCode: result.statusCode,
    body: status === "available" ? result.body : null,
    error: status === "unavailable" ? `HTTP ${result.statusCode}` : undefined,
    requestedAccept: "text/markdown",
    contentType: result.headers["content-type"] ?? null,
  };
}

async function discoverDnsAid(baseUrl: string, options?: SafeFetchOptions): Promise<DnsAidResult> {
  const hostname = new URL(baseUrl).hostname;
  const ownerNames = [`index._agents.${hostname}`, `_agents.${hostname}`];
  if (options?.unsafeAllowPrivateHostsForTesting) {
    return { ownerNames, status: "unavailable", records: [], error: "DNS-AID is not queried for local test fixtures." };
  }

  const records: string[] = [];
  let resolved = 0;
  for (const ownerName of ownerNames) {
    try {
      const answer = await Promise.race([
        dns.resolveAny(ownerName),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DNS timeout")), 2_000)),
      ]);
      resolved += 1;
      for (const item of answer) records.push(`${ownerName} ${JSON.stringify(item)}`);
    } catch {
      // NXDOMAIN and resolver failures remain distinguishable at aggregate
      // level: at least one successful empty answer is a confirmed miss;
      // no successful query is an unavailable measurement.
    }
  }
  if (records.length > 0) return { ownerNames, status: "available", records };
  if (resolved > 0) return { ownerNames, status: "not_found", records: [] };
  return { ownerNames, status: "unavailable", records: [], error: "No DNS-AID SVCB/HTTPS evidence could be confirmed." };
}

/**
 * Five-page discovery (SSOT §4.1, §14.2). Priority order: homepage,
 * primary service/product page, about, contact, FAQ. Pages that can't be
 * found are simply absent from the result (recorded as evidence, not
 * guessed at) — a missing page is itself a technical-check signal
 * (offer.service_page_discovered / conversion.about_page_discovered).
 */
export async function discoverAndCrawl(baseUrl: string, options?: SafeFetchOptions): Promise<DiscoveryResult> {
  const resourceEntries = Object.entries(AGENT_RESOURCE_PATHS) as Array<[AgentResourceKey, string]>;
  const [sitemap, robots, llmsTxt, markdownRepresentation, dnsAid, fetchedAgentResources] = await Promise.all([
    fetchPublicTextResource(baseUrl, "/sitemap.xml", options),
    fetchPublicTextResource(baseUrl, "/robots.txt", options),
    fetchPublicTextResource(baseUrl, "/llms.txt", options),
    fetchMarkdownRepresentation(baseUrl, options),
    discoverDnsAid(baseUrl, options),
    Promise.all(resourceEntries.map(async ([key, pathname]) => [key, await fetchPublicTextResource(baseUrl, pathname, options)] as const)),
  ]);
  const agentResources = Object.fromEntries(fetchedAgentResources) as Record<AgentResourceKey, PublicTextResource>;
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
    markdownRepresentation,
    dnsAid,
    agentResources,
    pages,
    homepageChecks,
  };
}
