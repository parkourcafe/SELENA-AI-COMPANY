import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = (process.env.SEO_BASE_URL ?? "https://www.selenasystems.com").replace(/\/$/, "");
const sitemapUrl = new URL(process.env.SEO_SITEMAP_PATH ?? "/sitemap.xml", baseUrl).href;
const rewriteSitemapOrigin = (process.env.SEO_REWRITE_SITEMAP_ORIGIN ?? "").replace(/\/$/, "");
const outputDir = resolve(process.env.SEO_REPORT_DIR ?? "reports/seo");
const redirectExceptionsPath = resolve("data/seo/redirect-exceptions.json");
const allowedStatuses = new Set([200]);
const redirectStatuses = new Set([301, 302, 303, 307, 308]);
const timeoutMs = Number(process.env.SEO_REQUEST_TIMEOUT_MS ?? 15_000);

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function normalizeUrl(value) {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/$/, "");
  return url.href;
}

function absoluteUrl(value) {
  const parsed = new URL(value, baseUrl);
  if (rewriteSitemapOrigin && parsed.origin === rewriteSitemapOrigin) {
    return normalizeUrl(new URL(`${parsed.pathname}${parsed.search}`, baseUrl).href);
  }
  return normalizeUrl(parsed.href);
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match?.[2]?.trim() ?? "";
}

function tagText(html, tag) {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";
}

function allTags(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "gi"))].map((match) => match[0]);
}

function metaContent(html, name) {
  for (const tag of allTags(html, "meta")) {
    if (attribute(tag, "name").toLowerCase() === name.toLowerCase()) return attribute(tag, "content");
  }
  return "";
}

function metaPropertyContent(html, property) {
  for (const tag of allTags(html, "meta")) {
    if (attribute(tag, "property").toLowerCase() === property.toLowerCase()) return attribute(tag, "content");
  }
  return "";
}

function canonicalFrom(html) {
  for (const tag of allTags(html, "link")) {
    if (attribute(tag, "rel").toLowerCase().split(/\s+/).includes("canonical")) {
      return attribute(tag, "href");
    }
  }
  return "";
}

function alternatesFrom(html) {
  return allTags(html, "link")
    .filter((tag) => attribute(tag, "rel").toLowerCase().split(/\s+/).includes("alternate"))
    .map((tag) => ({ hreflang: attribute(tag, "hreflang"), href: attribute(tag, "href") }))
    .filter((entry) => entry.hreflang && entry.href);
}

function expectedLocale(pathname) {
  if (pathname === "/ru" || pathname.startsWith("/ru/")) return "ru";
  if (pathname.startsWith("/en/") || pathname === "/") return "en";
  if (["/contact", "/privacy", "/terms", "/about", "/ai-training", "/ai-automation", "/ai-content"].includes(pathname)) return "ru";
  return "en";
}

function addIssue(issues, url, code, message, severity = "error") {
  issues.push({ url, code, message, severity });
}

async function fetchWithOneRedirect(url) {
  let current = url;
  const chain = [];

  for (let hop = 0; hop <= 1; hop += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      headers: { accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (redirectStatuses.has(response.status)) {
      const location = response.headers.get("location");
      if (!location) return { response, finalUrl: current, chain, body: "", error: "redirect-without-location" };
      chain.push({ from: current, status: response.status, to: new URL(location, current).href });
      if (hop === 1) return { response, finalUrl: current, chain, body: "", error: "redirect-chain" };
      current = new URL(location, current).href;
      continue;
    }

    return { response, finalUrl: current, chain, body: await response.text(), error: null };
  }

  return { response: null, finalUrl: current, chain, body: "", error: "redirect-chain" };
}

async function loadRedirectExceptions() {
  try {
    const raw = await readFile(redirectExceptionsPath, "utf8");
    return new Map(Object.entries(JSON.parse(raw)).map(([from, to]) => [absoluteUrl(from), absoluteUrl(to)]));
  } catch {
    return new Map();
  }
}

function parseSitemap(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)]
    .map((match) => decodeXml(match[1].trim()))
    .filter(Boolean)
    .map(absoluteUrl);
}

function markdownReport(report) {
  const lines = [
    "# Selena Systems SEO validation",
    "",
    `- Base URL: ${report.baseUrl}`,
    `- Sitemap: ${report.sitemapUrl}`,
    `- Checked: ${report.checkedAt}`,
    `- URLs: ${report.urls.length}`,
    `- Errors: ${report.issues.filter((issue) => issue.severity === "error").length}`,
    `- Warnings: ${report.issues.filter((issue) => issue.severity === "warning").length}`,
    "",
    "## URL results",
    "",
    "| URL | Status | Final URL | Locale | Title | H1 | Canonical | Alternates |",
    "|---|---:|---|---|---|---:|---|---:|",
  ];

  for (const result of report.urls) {
    lines.push(`| ${result.url} | ${result.status ?? "ERR"} | ${result.finalUrl ?? ""} | ${result.lang ?? ""} | ${result.title ? "yes" : "no"} | ${result.h1Count ?? 0} | ${result.canonical ? "yes" : "no"} | ${result.alternates?.length ?? 0} |`);
  }

  lines.push("", "## Issues", "");
  if (report.issues.length === 0) lines.push("No issues detected.");
  for (const issue of report.issues) lines.push(`- **${issue.severity.toUpperCase()} ${issue.code}** — ${issue.url}: ${issue.message}`);
  return `${lines.join("\n")}\n`;
}

async function main() {
  const issues = [];
  const redirectExceptions = await loadRedirectExceptions();
  const sitemapResponse = await fetchWithOneRedirect(sitemapUrl);
  const sitemapXml = sitemapResponse.body;
  const sitemapStatus = sitemapResponse.response?.status ?? null;

  if (sitemapStatus !== 200) addIssue(issues, sitemapUrl, "SITEMAP_STATUS", `Expected 200, received ${sitemapStatus ?? sitemapResponse.error}`);
  if (!/<urlset\b/i.test(sitemapXml) || !/<\/urlset>/i.test(sitemapXml)) addIssue(issues, sitemapUrl, "SITEMAP_XML", "Sitemap does not contain a complete <urlset> root element.");

  const sitemapUrls = [...new Set(parseSitemap(sitemapXml))];
  if (sitemapUrls.length === 0) addIssue(issues, sitemapUrl, "SITEMAP_EMPTY", "Sitemap contains no URLs.");

  const results = [];
  const knownUrls = new Set(sitemapUrls);

  for (const url of sitemapUrls) {
    let result;
    try {
      const fetched = await fetchWithOneRedirect(url);
      const response = fetched.response;
      const status = response?.status ?? null;
      const finalUrl = fetched.finalUrl ? absoluteUrl(fetched.finalUrl) : null;
      const contentType = response?.headers.get("content-type") ?? "";
      const body = fetched.body;
      const title = tagText(body, "title");
      const description = metaContent(body, "description");
      const ogTitle = metaPropertyContent(body, "og:title");
      const ogDescription = metaPropertyContent(body, "og:description");
      const ogUrl = metaPropertyContent(body, "og:url");
      const ogImage = metaPropertyContent(body, "og:image");
      const twitterCard = metaContent(body, "twitter:card");
      const htmlTag = body.match(/<html\b[^>]*>/i)?.[0] ?? "";
      const lang = attribute(htmlTag, "lang").toLowerCase();
      const canonicalRaw = canonicalFrom(body);
      const canonical = canonicalRaw ? absoluteUrl(canonicalRaw) : "";
      const alternates = alternatesFrom(body).map((entry) => ({ ...entry, rawHref: entry.href, href: absoluteUrl(entry.href) }));
      const h1Count = allTags(body, "h1").length;
      const robots = `${metaContent(body, "robots")} ${response?.headers.get("x-robots-tag") ?? ""}`.toLowerCase();

      result = { url, status, finalUrl, contentType, lang, title, description, ogTitle, ogDescription, ogUrl, ogImage, twitterCard, h1Count, canonical, alternates, redirects: fetched.chain };
      if (!allowedStatuses.has(status)) addIssue(issues, url, "HTTP_STATUS", `Expected 200, received ${status ?? fetched.error}.`);
      if (fetched.chain.length > 0 && !redirectExceptions.has(url)) addIssue(issues, url, "UNDECLARED_REDIRECT", `Sitemap URL redirects to ${finalUrl}; add an explicit exception or publish the final URL.`);
      if (fetched.error === "redirect-chain") addIssue(issues, url, "REDIRECT_CHAIN", "More than one redirect was observed.");
      if (status === 200 && !/html|xhtml/i.test(contentType)) addIssue(issues, url, "CONTENT_TYPE", `Expected an HTML response, received ${contentType || "missing content type"}.`);
      if (robots.includes("noindex")) addIssue(issues, url, "NOINDEX_IN_SITEMAP", "Sitemap URL contains noindex in meta or X-Robots-Tag.");
      if (!title) addIssue(issues, url, "TITLE_MISSING", "Indexable URL has no <title>.");
      if (!description) addIssue(issues, url, "DESCRIPTION_MISSING", "Indexable URL has no meta description.");
      if (!ogTitle) addIssue(issues, url, "OG_TITLE_MISSING", "Indexable URL has no og:title.");
      if (!ogDescription) addIssue(issues, url, "OG_DESCRIPTION_MISSING", "Indexable URL has no og:description.");
      if (!ogUrl) addIssue(issues, url, "OG_URL_MISSING", "Indexable URL has no og:url.");
      if (!ogImage) addIssue(issues, url, "OG_IMAGE_MISSING", "Indexable URL has no og:image.");
      if (!twitterCard) addIssue(issues, url, "TWITTER_CARD_MISSING", "Indexable URL has no twitter:card.");
      if (title && (title.length < 30 || title.length > 60)) addIssue(issues, url, "TITLE_LENGTH", `Title length ${title.length} is outside the 30–60 character guidance.`, "warning");
      if (description && (description.length < 120 || description.length > 160)) addIssue(issues, url, "DESCRIPTION_LENGTH", `Description length ${description.length} is outside the 120–160 character guidance.`, "warning");
      if (h1Count !== 1) addIssue(issues, url, "H1_COUNT", `Expected exactly one H1, found ${h1Count}.`);
      if (!canonical) addIssue(issues, url, "CANONICAL_MISSING", "Indexable URL has no canonical link.");
      if (canonicalRaw) {
        const rawCanonical = new URL(canonicalRaw, finalUrl ?? url);
        if (baseUrl.startsWith("https:") && rawCanonical.protocol !== "https:") addIssue(issues, url, "CANONICAL_PROTOCOL", `Canonical must use HTTPS, received ${rawCanonical.protocol}.`);
        if (rawCanonical.search || rawCanonical.hash) addIssue(issues, url, "CANONICAL_QUERY_OR_HASH", "Canonical must not contain a query string or fragment.");
      }
      if (canonical && finalUrl && canonical !== finalUrl) addIssue(issues, url, "CANONICAL_MISMATCH", `Canonical ${canonical} does not match final URL ${finalUrl}.`);
      const expected = expectedLocale(new URL(url).pathname);
      if (!lang || !lang.startsWith(expected)) addIssue(issues, url, "LANG_MISMATCH", `Expected document lang ${expected}, found ${lang || "missing"}.`);
      const imageTags = allTags(body, "img");
      if (imageTags.some((tag) => !attribute(tag, "alt"))) addIssue(issues, url, "IMAGE_ALT_MISSING", "An image has no alt attribute.");
      if (imageTags.some((tag) => attribute(tag, "alt") === "")) addIssue(issues, url, "IMAGE_ALT_EMPTY", "An image has an empty alt attribute.");
      if (/<a\b[^>]*>\s*<\/a>/i.test(body)) addIssue(issues, url, "EMPTY_ANCHOR", "An anchor has no accessible text.");
      if (/<h[1-6]\b[^>]*>\s*<\/h[1-6]>/i.test(body)) addIssue(issues, url, "EMPTY_HEADING", "A heading has no text.");
      const metadataText = [title, description, ogTitle, ogDescription, ogUrl, ogImage, twitterCard, canonicalRaw, ...alternates.map((entry) => entry.rawHref)].join(" ");
      if (/\$\s*4[ ,]?000|\bundefined\b|\bnull\b|localhost|127\.0\.0\.1|\.railway\.app/i.test(metadataText)) {
        addIssue(issues, url, "METADATA_ARTIFACT", "Metadata contains a stale price, null/undefined value or development hostname.");
      }
      if (ogUrl) {
        const parsedOgUrl = new URL(ogUrl, finalUrl ?? url);
        if (baseUrl.startsWith("https:") && parsedOgUrl.protocol !== "https:") addIssue(issues, url, "OG_URL_PROTOCOL", "og:url must use HTTPS.");
        if (finalUrl && absoluteUrl(parsedOgUrl.href) !== finalUrl) addIssue(issues, url, "OG_URL_MISMATCH", `og:url ${parsedOgUrl.href} does not match final URL ${finalUrl}.`);
      }
      if (ogImage) {
        const parsedOgImage = new URL(ogImage, finalUrl ?? url);
        if (baseUrl.startsWith("https:") && parsedOgImage.protocol !== "https:") addIssue(issues, url, "OG_IMAGE_PROTOCOL", "og:image must use HTTPS.");
      }
      if (alternates.length > 0) {
        const languages = new Map(alternates.map((entry) => [entry.hreflang, entry.href]));
        for (const key of ["en", "ru", "x-default"]) {
          if (!languages.has(key)) addIssue(issues, url, "HREFLANG_INCOMPLETE", `Missing ${key} alternate.`);
          else if (!knownUrls.has(languages.get(key))) addIssue(issues, url, "HREFLANG_TARGET", `${key} alternate is not present in the sitemap: ${languages.get(key)}.`);
        }
        for (const alternate of alternates) {
          const rawAlternate = new URL(alternate.rawHref, finalUrl ?? url);
          if (baseUrl.startsWith("https:") && rawAlternate.protocol !== "https:") addIssue(issues, url, "HREFLANG_PROTOCOL", `${alternate.hreflang} alternate must use HTTPS.`);
          if (rawAlternate.search || rawAlternate.hash) addIssue(issues, url, "HREFLANG_QUERY_OR_HASH", `${alternate.hreflang} alternate must not contain a query string or fragment.`);
        }
      }
    } catch (error) {
      result = { url, status: null, finalUrl: null, contentType: "", lang: "", title: "", description: "", ogTitle: "", ogDescription: "", ogUrl: "", ogImage: "", twitterCard: "", h1Count: 0, canonical: "", alternates: [], redirects: [] };
      addIssue(issues, url, "REQUEST_FAILED", error instanceof Error ? error.message : "Unknown request failure.");
    }
    results.push(result);
  }

  const titleOwners = new Map();
  const descriptionOwners = new Map();
  const canonicalOwners = new Map();
  for (const result of results) {
    for (const [value, owners, code, label] of [[result.title, titleOwners, "DUPLICATE_TITLE", "title"], [result.description, descriptionOwners, "DUPLICATE_DESCRIPTION", "description"], [result.canonical, canonicalOwners, "DUPLICATE_CANONICAL", "canonical"]]) {
      if (!value) continue;
      const previous = owners.get(value) ?? [];
      previous.push(result.url);
      owners.set(value, previous);
      if (previous.length === 2) addIssue(issues, result.url, code, `Duplicate ${label} is shared with ${previous[0]}.`);
    }
  }

  for (const result of results) {
    for (const alternate of result.alternates ?? []) {
      const target = results.find((candidate) => candidate.url === alternate.href);
      if (!target) continue;
      const reverse = (target.alternates ?? []).some((entry) => entry.href === result.url);
      if (!reverse) addIssue(issues, result.url, "HREFLANG_NOT_RECIPROCAL", `${alternate.hreflang} alternate does not link back from ${alternate.href}.`);
    }
  }

  const report = { baseUrl, sitemapUrl, checkedAt: new Date().toISOString(), urls: results, issues };
  await mkdir(outputDir, { recursive: true });
  await writeFile(resolve(outputDir, "seo-validation.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(resolve(outputDir, "seo-validation.md"), markdownReport(report));

  console.log(`SEO validation: ${results.length} URLs, ${issues.filter((issue) => issue.severity === "error").length} errors, ${issues.filter((issue) => issue.severity === "warning").length} warnings.`);
  if (issues.length > 0) {
    for (const issue of issues) console.error(`${issue.code}: ${issue.url} — ${issue.message}`);
    if (issues.some((issue) => issue.severity === "error")) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
