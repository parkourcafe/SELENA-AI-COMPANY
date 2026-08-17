import { detectActionReadiness } from "../checks/actionReadiness";
import { extractHtmlSignals, htmlToVisibleText } from "../checks/htmlSignals";
import type { CheckState } from "../checks/technicalChecks";
import type { DiscoveryResult, PublicTextResource } from "../crawler/discover";
import type { PrimaryAction } from "../measurement";
import type { SiteProfile, VisibilityLocale } from "../types";
import { detectPlatform, platformFixFor, type PlatformDetection } from "./platformAdapters";
import {
  AGENT_READINESS_REGISTRY_VERSION,
  agentReadinessRuleRegistry,
  localizedRule,
  type AgentCheckId,
  type AgentReadinessCategory,
  type AgentReadinessRule,
  type AgentReadinessStatus,
} from "./ruleRegistry";

export type AgentReadinessFix = {
  summary: string;
  steps: string[];
  files: string[];
  codeBlocks: string[];
  platform: string;
  platformConfidence: number;
  platformInstruction: string;
};

export type AgentReadinessCheckResult = {
  checkId: AgentCheckId;
  title: string;
  category: AgentReadinessCategory;
  status: AgentReadinessStatus;
  checkedTarget: string;
  evidence: string[];
  explanation: string;
  impact: string;
  fix: AgentReadinessFix;
  verification: string[];
  doesNotProve: string[];
  methodologyVersion: typeof AGENT_READINESS_REGISTRY_VERSION;
  capturedAt: string;
  weight: number;
  diagnosticOnly: boolean;
  references: readonly string[];
};

export type AgentReadinessCategoryScore = {
  id: AgentReadinessCategory;
  label: string;
  score: number | null;
  applicableChecks: number;
  passedChecks: number;
  warningChecks: number;
  failedChecks: number;
  notApplicableChecks: number;
};

export type AgentReadinessResult = {
  registryVersion: typeof AGENT_READINESS_REGISTRY_VERSION;
  profile: SiteProfile;
  profileEvidence: string;
  platform: PlatformDetection;
  score: number | null;
  categories: AgentReadinessCategoryScore[];
  checks: AgentReadinessCheckResult[];
};

export type SelenaDepthSummary = {
  technicalStates: CheckState[];
  indexabilityStates: CheckState[];
  structuredDataScore: number | null;
  entityClarityScore: number | null;
  contentReadinessScore: number | null;
  businessConsistencyScore: number | null;
  conversionReadinessScore: number | null;
  blockScores: number[];
};

const CATEGORY_LABELS: Record<VisibilityLocale, Record<AgentReadinessCategory, string>> = {
  en: {
    discoverability: "Discoverability & crawl access",
    content_accessibility: "Content & machine readability",
    bot_access: "Agent controls & trust",
    protocol_discovery: "Protocol & API readiness",
    commerce: "Action & commerce readiness",
    selena_depth: "Entity & citability — Selena layer",
  },
  ru: {
    discoverability: "Обнаружимость и доступ краулеров",
    content_accessibility: "Контент и машиночитаемость",
    bot_access: "Управление агентами и trust",
    protocol_discovery: "Готовность протоколов и API",
    commerce: "Готовность действий и commerce",
    selena_depth: "Сущность и citability — слой Selena",
  },
};

const STATUS_SCORE: Record<Exclude<AgentReadinessStatus, "not_applicable">, number> = {
  passed: 100,
  warning: 50,
  failed: 0,
};

function redactEvidence(value: string): string {
  return value
    .replace(/-----BEGIN[\s\S]{0,120}?-----/gi, "[redacted key material]")
    .replace(/\b(?:sk-|ghp_|AKIA)[A-Za-z0-9_\-]{8,}\b/g, "[redacted token]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]{8,}/gi, "Bearer [redacted]")
    .replace(/(["']?(?:client_secret|access_token|refresh_token|password)["']?\s*[:=]\s*)["'][^"']+["']/gi, "$1[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function resourceEvidence(resource: PublicTextResource): string[] {
  const base = [`${resource.url} → ${resource.statusCode ?? "no HTTP status"} (${resource.status})`];
  if (resource.body) base.push(redactEvidence(resource.body.slice(0, 500)));
  if (resource.error) base.push(`Collection warning: ${redactEvidence(resource.error)}`);
  return base;
}

function parseObject(body: string | null): Record<string, unknown> | null {
  if (!body) return null;
  try {
    const parsed = JSON.parse(body) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function availableResourceStatus(
  resource: PublicTextResource,
  validator?: (body: string, parsed: Record<string, unknown> | null) => boolean,
): AgentReadinessStatus {
  if (resource.status === "unavailable") return "warning";
  if (resource.status === "not_found" || !resource.body?.trim()) return "failed";
  if (!validator) return "passed";
  return validator(resource.body, parseObject(resource.body)) ? "passed" : "warning";
}

function scoreStatus(score: number | null, passAt = 75, warningAt = 40): AgentReadinessStatus {
  if (score === null) return "warning";
  if (score >= passAt) return "passed";
  return score >= warningAt ? "warning" : "failed";
}

function stateGroupStatus(states: CheckState[]): AgentReadinessStatus {
  const measured = states.filter((state) => state !== "not_measured");
  if (measured.length === 0) return "warning";
  if (measured.some((state) => state === "fail")) return "failed";
  if (measured.some((state) => state === "warn") || measured.length !== states.length) return "warning";
  return "passed";
}

function hasCommerceEvidence(crawl: DiscoveryResult, profile: SiteProfile): boolean {
  if (profile === "commerce") return true;
  const homepage = crawl.pages.find((page) => page.role === "homepage")?.fetch.html ?? "";
  return /add to cart|buy now|checkout|shopping cart|product:price|"@type"\s*:\s*"(?:Product|Offer)"/i.test(homepage);
}

function isApplicable(rule: AgentReadinessRule, profile: SiteProfile, commerceEvidence: boolean): boolean {
  if (rule.category === "commerce" || rule.id === "SE-10") {
    return profile === "commerce" || (profile === "all_checks" && commerceEvidence);
  }
  return rule.applicableProfiles.includes(profile);
}

function codeSnippet(ruleId: AgentCheckId, locale: VisibilityLocale): string[] {
  const snippets: Partial<Record<AgentCheckId, string>> = {
    "CF-D01": "User-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /private/\n\nSitemap: https://example.com/sitemap.xml",
    "CF-D02": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n  <url><loc>https://example.com/</loc></url>\n</urlset>",
    "CF-D03": "Link: </sitemap.xml>; rel=\"sitemap\"",
    "CF-C01": "if (request.headers.get(\"accept\")?.includes(\"text/markdown\")) {\n  return new Response(markdown, { headers: { \"content-type\": \"text/markdown; charset=utf-8\", \"vary\": \"Accept\" } });\n}",
    "CF-B02": "Content-Signal: ai-train=no, search=yes, ai-input=no",
    "CF-P02": "{\n  \"issuer\": \"https://auth.example.com\",\n  \"authorization_endpoint\": \"https://auth.example.com/authorize\",\n  \"token_endpoint\": \"https://auth.example.com/token\"\n}",
    "CF-P03": "{\n  \"resource\": \"https://api.example.com\",\n  \"authorization_servers\": [\"https://auth.example.com\"]\n}",
    "CF-P06": "{\n  \"name\": \"Public agent name\",\n  \"description\": \"Verified public capability\",\n  \"url\": \"https://example.com/a2a\",\n  \"skills\": []\n}",
    "SE-03": "{\n  \"@context\": \"https://schema.org\",\n  \"@type\": \"Organization\",\n  \"name\": \"[verified public name]\",\n  \"url\": \"https://example.com/\"\n}",
  };
  const snippet = snippets[ruleId];
  if (!snippet) return [];
  return [locale === "ru" ? `Шаблон — замените placeholders только подтверждёнными данными:\n${snippet}` : `Template — replace placeholders only with verified data:\n${snippet}`];
}

type Observation = { status: AgentReadinessStatus; evidence: string[]; explanation: string; impact: string };

function observeRule(
  id: AgentCheckId,
  options: {
    crawl: DiscoveryResult;
    summary: SelenaDepthSummary;
    primaryAction: PrimaryAction;
    locale: VisibilityLocale;
    commerceEvidence: boolean;
  },
): Observation {
  const { crawl, summary, primaryAction, locale } = options;
  const ru = locale === "ru";
  const homepage = crawl.pages.find((page) => page.role === "homepage")?.fetch;
  const html = homepage?.html ?? "";
  const headers = homepage?.headers ?? {};
  const observed = (status: AgentReadinessStatus, evidence: string[], en: string, ruText: string): Observation => ({
    status,
    evidence: evidence.map(redactEvidence).filter(Boolean),
    explanation: ru ? ruText : en,
    impact: ru
      ? "Этот сигнал влияет на способность машин обнаружить, прочитать или безопасно использовать публичный ресурс."
      : "This signal affects whether machines can discover, read or safely use the public resource.",
  });

  if (id === "CF-D01") {
    const status = crawl.robots.status === "available" ? "passed" : crawl.robots.status === "not_found" ? "failed" : "warning";
    return observed(status, resourceEvidence(crawl.robots), "robots.txt was fetched and inspected for public crawler rules.", "robots.txt загружен и проверен на правила публичных краулеров.");
  }
  if (id === "CF-D02") {
    const status = availableResourceStatus(crawl.sitemap, (body) => /<(?:urlset|sitemapindex)\b/i.test(body));
    return observed(status, resourceEvidence(crawl.sitemap), "The sitemap endpoint and XML root were inspected.", "Проверены endpoint sitemap и корневой XML-элемент.");
  }
  if (id === "CF-D03") {
    const link = headers.link ?? "";
    return observed(link && /<[^>]+>\s*;\s*rel=/i.test(link) ? "passed" : "failed", [`Homepage Link header: ${link || "not present"}`], "The homepage response was checked for typed discovery links.", "Ответ главной страницы проверен на типизированные discovery links.");
  }
  if (id === "CF-D04") {
    const status = crawl.dnsAid.status === "available" ? "passed" : crawl.dnsAid.status === "not_found" ? "failed" : "warning";
    return observed(status, [...crawl.dnsAid.ownerNames.map((name) => `DNS query: ${name}`), ...crawl.dnsAid.records.slice(0, 4), crawl.dnsAid.error ?? ""], "DNS-AID owner names were queried without treating draft metadata as a trust signal.", "DNS-AID owner names запрошены без трактовки draft metadata как trust-сигнала.");
  }
  if (id === "CF-C01") {
    const item = crawl.markdownRepresentation;
    const status = item.status === "unavailable" ? "warning" : item.status === "available" && /^text\/markdown/i.test(item.contentType ?? "") ? "passed" : "failed";
    return observed(status, [`GET ${item.url} with Accept: text/markdown → ${item.statusCode ?? "no status"}`, `Content-Type: ${item.contentType ?? "not present"}`], "The homepage was requested with Markdown content negotiation.", "Главная страница запрошена с Markdown content negotiation.");
  }
  if (id === "CF-B01") {
    if (crawl.robots.status !== "available") return observed(crawl.robots.status === "not_found" ? "failed" : "warning", resourceEvidence(crawl.robots), "Named AI bot policy could not be confirmed.", "Явную политику для AI-ботов подтвердить не удалось.");
    const body = crawl.robots.body ?? "";
    const agents = [...body.matchAll(/User-agent:\s*(OAI-SearchBot|ChatGPT-User|GPTBot|Google-Extended|ClaudeBot|PerplexityBot)/gi)].map((match) => match[1]);
    return observed(agents.length > 0 ? "passed" : "warning", [`Named AI user-agents found: ${agents.join(", ") || "none"}`], "robots.txt was inspected for named AI user-agent groups and wildcard fallback.", "robots.txt проверен на группы именованных AI user-agent и wildcard fallback.");
  }
  if (id === "CF-B02") {
    const combined = `${crawl.robots.body ?? ""}\n${headers["content-signal"] ?? headers["content-signals"] ?? ""}`;
    const matches = combined.match(/Content-Signal[^\n]*/gi) ?? [];
    return observed(matches.length > 0 ? "passed" : "warning", [`Content Signals: ${matches.slice(0, 3).join(" | ") || "not observed"}`], "Public policy signals were inspected without inferring legal permission.", "Публичные policy-сигналы проверены без вывода о юридическом разрешении.");
  }
  if (id === "CF-B03") {
    const resource = crawl.agentResources.webBotAuth;
    return observed(availableResourceStatus(resource), resourceEvidence(resource), "The Web Bot Auth discovery directory was fetched.", "Запрошен discovery directory Web Bot Auth.");
  }

  const resourceByProtocol: Partial<Record<AgentCheckId, keyof DiscoveryResult["agentResources"]>> = {
    "CF-P01": "apiCatalog",
    "CF-P02": "oauthDiscovery",
    "CF-P03": "oauthProtectedResource",
    "CF-P04": "authMd",
    "CF-P05": "mcpServerCard",
    "CF-P06": "a2aAgentCard",
    "CF-P07": "agentSkills",
  };
  const resourceKey = resourceByProtocol[id];
  if (resourceKey) {
    const resource = crawl.agentResources[resourceKey];
    const validators: Partial<Record<AgentCheckId, (body: string, parsed: Record<string, unknown> | null) => boolean>> = {
      "CF-P01": (body) => /api|openapi|href|url/i.test(body),
      "CF-P02": (_body, parsed) => Boolean(parsed?.issuer && parsed.authorization_endpoint && parsed.token_endpoint),
      "CF-P03": (_body, parsed) => Boolean(parsed?.resource && Array.isArray(parsed.authorization_servers)),
      "CF-P04": (body) => /auth|oauth|scope|token/i.test(body),
      "CF-P05": (_body, parsed) => Boolean(parsed && (parsed.capabilities || parsed.serverInfo || parsed.endpoint || parsed.protocolVersion)),
      "CF-P06": (_body, parsed) => Boolean(parsed?.name && parsed.url && Array.isArray(parsed.skills)),
      "CF-P07": (_body, parsed) => Boolean(parsed && (Array.isArray(parsed.skills) || Array.isArray(parsed.items))),
    };
    return observed(availableResourceStatus(resource, validators[id]), resourceEvidence(resource), "The standardized public discovery resource was fetched and checked for minimum structure.", "Стандартизированный публичный discovery resource загружен и проверен на минимальную структуру.");
  }
  if (id === "CF-P08") {
    const markers = ["navigator.modelContext", "modelContext.registerTool", "WebMCP"].filter((marker) => html.includes(marker));
    return observed(markers.length > 0 ? "passed" : "failed", [`Static HTML markers: ${markers.join(", ") || "none"}`, "Scanned HTML only; page JavaScript was not executed."], "Public HTML was inspected for explicit WebMCP capability registration.", "Публичный HTML проверен на явную регистрацию WebMCP capability.");
  }

  if (id === "CF-X01") {
    const combined = `${JSON.stringify(headers)} ${html.slice(0, 50_000)} ${crawl.agentResources.openApi.body ?? ""}`;
    const markers = combined.match(/x402|PAYMENT-REQUIRED|X-PAYMENT/gi) ?? [];
    return observed(markers.length > 0 ? "passed" : "failed", [`x402 markers: ${[...new Set(markers)].join(", ") || "none"}`], "Public payment-discovery evidence was inspected; no transaction was attempted.", "Проверено публичное payment-discovery evidence; транзакция не выполнялась.");
  }
  if (id === "CF-X02") {
    const resource = crawl.agentResources.openApi;
    return observed(availableResourceStatus(resource, (body) => /x-payment-info|mpp/i.test(body)), resourceEvidence(resource), "OpenAPI was inspected for MPP payment metadata; no payment was attempted.", "OpenAPI проверен на MPP payment metadata; платёж не выполнялся.");
  }
  if (id === "CF-X03" || id === "CF-X04" || id === "CF-X05") {
    const key = id === "CF-X03" ? "ucp" : id === "CF-X04" ? "acp" : "ap2";
    const resource = crawl.agentResources[key];
    return observed(availableResourceStatus(resource, (_body, parsed) => Boolean(parsed)), resourceEvidence(resource), "The public commerce discovery document was fetched; no checkout or payment was started.", "Публичный commerce discovery document загружен; checkout или платёж не запускались.");
  }

  if (id === "SE-01") {
    const canonicalEvidence = crawl.pages.map((page) => {
      const canonical = page.fetch.html ? extractHtmlSignals(page.fetch.html).canonicalUrl : null;
      if (!canonical) return { line: `${page.fetch.finalUrl} → canonical not present`, mismatch: false };
      try {
        const actual = new URL(page.fetch.finalUrl);
        const declared = new URL(canonical, actual);
        const normalized = (value: URL) => `${value.origin}${value.pathname.replace(/\/$/, "") || "/"}`;
        return {
          line: `${page.fetch.finalUrl} → canonical ${declared.toString()}`,
          mismatch: normalized(actual) !== normalized(declared),
        };
      } catch {
        return { line: `${page.fetch.finalUrl} → malformed canonical ${canonical}`, mismatch: true };
      }
    });
    const base = stateGroupStatus(summary.technicalStates);
    const status = canonicalEvidence.some((item) => item.mismatch) ? "failed" : base;
    return observed(status, [`Pages inspected: ${crawl.pages.length}`, ...crawl.pages.map((page) => `${page.requestedUrl} → ${page.fetch.finalUrl}`), ...canonicalEvidence.map((item) => item.line)], "Redirect outcomes and canonical evidence were compared across selected pages.", "Redirect outcomes и canonical evidence сопоставлены по выбранным страницам.");
  }
  if (id === "SE-02") return observed(stateGroupStatus(summary.indexabilityStates), crawl.pages.map((page) => `${page.fetch.finalUrl} → HTTP ${page.fetch.statusCode}`), "Status codes and indexability directives were checked per page.", "Status codes и indexability directives проверены для каждой страницы.");
  if (id === "SE-03") return observed(scoreStatus(summary.structuredDataScore), [`Structured-data score: ${summary.structuredDataScore ?? "not measured"}`], "Public JSON-LD was parsed and checked for entity-like types.", "Публичный JSON-LD разобран и проверен на типы сущностей.");
  if (id === "SE-04") return observed(scoreStatus(summary.entityClarityScore), [`Entity-clarity score: ${summary.entityClarityScore ?? "not measured"}`], "Title, H1 and structured entity names were compared.", "Сопоставлены title, H1 и имена сущностей в structured data.");
  if (id === "SE-05") return observed(scoreStatus(summary.contentReadinessScore), [`Content-readiness score: ${summary.contentReadinessScore ?? "not measured"}`, `Selected page roles: ${crawl.pages.map((page) => page.role).join(", ")}`], "Up to five relevant public pages were inspected with provenance.", "До пяти релевантных публичных страниц проверены с provenance.");
  if (id === "SE-06") {
    const average = summary.blockScores.length ? Math.round(summary.blockScores.reduce((sum, value) => sum + value, 0) / summary.blockScores.length) : null;
    return observed(scoreStatus(average), [`Blocks measured: ${summary.blockScores.length}`, `Average block readiness: ${average ?? "not measured"}`], "Heading-anchored blocks were scored with versioned extractability heuristics.", "Блоки с заголовками оценены версионированными эвристиками извлекаемости.");
  }
  if (id === "SE-07") return observed(scoreStatus(summary.businessConsistencyScore, 70, 40), [`Business-consistency score: ${summary.businessConsistencyScore ?? "not measured"}`], "Public name, location and contact-path signals were compared.", "Сопоставлены публичные name, location и contact-path signals.");
  if (id === "SE-08") {
    const signals = html ? extractHtmlSignals(html) : null;
    const readiness = signals ? detectActionReadiness(signals, primaryAction, html) : null;
    return observed(readiness ? (readiness.humanReady.state === "pass" ? (readiness.machineReadable.state === "pass" ? "passed" : "warning") : "failed") : "warning", [`Primary action: ${primaryAction}`, `Human-ready: ${readiness?.humanReady.state ?? "not measured"}`, `Machine-readable: ${readiness?.machineReadable.state ?? "not measured"}`], "The declared primary action was checked separately for human and machine readability.", "Заявленное основное действие отдельно проверено на human- и machine-readability.");
  }
  if (id === "SE-09") return observed(crawl.llmsTxt.status === "available" && Boolean(crawl.llmsTxt.body?.trim()) ? "passed" : crawl.llmsTxt.status === "unavailable" ? "warning" : "failed", resourceEvidence(crawl.llmsTxt), "llms.txt is reported as a zero-weight diagnostic, never as a ranking factor.", "llms.txt показан как диагностика с нулевым весом, а не как ranking factor.");
  if (id === "SE-10") {
    const visible = new Set((htmlToVisibleText(html).match(/(?:US\$|\$)\s?\d[\d,.]*/g) ?? []).map((value) => value.replace(/[^\d.]/g, "")));
    const signals = html ? extractHtmlSignals(html) : null;
    const structured = new Set<string>();
    const visit = (value: unknown): void => {
      if (Array.isArray(value)) return value.forEach(visit);
      if (!value || typeof value !== "object") return;
      const record = value as Record<string, unknown>;
      if (typeof record.price === "string" || typeof record.price === "number") structured.add(String(record.price).replace(/[^\d.]/g, ""));
      Object.values(record).forEach(visit);
    };
    signals?.jsonLdBlocks.forEach(visit);
    const missing = [...structured].filter((price) => price && !visible.has(price));
    const status: AgentReadinessStatus = structured.size === 0 || visible.size === 0 ? "warning" : missing.length === 0 ? "passed" : "failed";
    return observed(status, [`Visible USD values: ${[...visible].join(", ") || "none"}`, `Structured prices: ${[...structured].join(", ") || "none"}`, `Structured values absent from visible copy: ${missing.join(", ") || "none"}`], "Visible and structured price values were compared without assuming that different offers should have the same price.", "Видимые и structured значения цен сопоставлены без предположения, что разные предложения должны стоить одинаково.");
  }

  return observed("warning", ["No deterministic observation was produced."], "The check could not be confirmed.", "Проверку не удалось подтвердить.");
}

function profileEvidence(profile: SiteProfile, commerceEvidence: boolean, locale: VisibilityLocale): string {
  const label = profile.replaceAll("_", " ");
  return locale === "ru"
    ? `Профиль выбран пользователем: ${label}. Commerce evidence ${commerceEvidence ? "обнаружено" : "не обнаружено"}; неприменимые проверки исключены из score.`
    : `User-selected profile: ${label}. Commerce evidence was ${commerceEvidence ? "observed" : "not observed"}; non-applicable checks are excluded from scoring.`;
}

export function buildAgentReadiness(options: {
  crawl: DiscoveryResult;
  siteProfile: SiteProfile;
  locale: VisibilityLocale;
  primaryAction: PrimaryAction;
  capturedAt: string;
  summary: SelenaDepthSummary;
}): AgentReadinessResult {
  const { crawl, siteProfile, locale, primaryAction, capturedAt, summary } = options;
  const commerceEvidence = hasCommerceEvidence(crawl, siteProfile);
  const platform = detectPlatform(crawl);
  const checks = agentReadinessRuleRegistry.map((rule): AgentReadinessCheckResult => {
    const copy = localizedRule(rule, locale);
    const applicable = isApplicable(rule, siteProfile, commerceEvidence);
    const observation = applicable
      ? observeRule(rule.id, { crawl, summary, primaryAction, locale, commerceEvidence })
      : {
          status: "not_applicable" as const,
          evidence: [locale === "ru" ? `Профиль ${siteProfile}: проверка не применяется и не влияет на score.` : `Profile ${siteProfile}: this check is not applicable and does not affect the score.`],
          explanation: locale === "ru" ? "Проверка исключена по профилю и наблюдаемому типу сайта." : "The check is excluded by the selected profile and observed site type.",
          impact: locale === "ru" ? "Not applicable не является ошибкой." : "Not applicable is not a defect.",
        };
    const adapter = platformFixFor(rule.id, platform, locale);
    const checkedTarget = rule.checkedTarget
      .replace("<domain>", new URL(crawl.baseUrl).hostname);
    return {
      checkId: rule.id,
      title: copy.title,
      category: rule.category,
      status: observation.status,
      checkedTarget,
      evidence: observation.evidence,
      explanation: observation.explanation,
      impact: observation.impact,
      fix: {
        summary: copy.fix,
        steps: [copy.fix, adapter.instruction],
        files: checkedTarget.startsWith("/") ? [checkedTarget] : [],
        codeBlocks: codeSnippet(rule.id, locale),
        platform: adapter.platform,
        platformConfidence: adapter.confidence,
        platformInstruction: adapter.instruction,
      },
      verification: [copy.verification],
      doesNotProve: [copy.doesNotProve],
      methodologyVersion: AGENT_READINESS_REGISTRY_VERSION,
      capturedAt,
      weight: rule.weight,
      diagnosticOnly: rule.weight === 0,
      references: rule.references,
    };
  });

  const categories = (Object.keys(CATEGORY_LABELS[locale]) as AgentReadinessCategory[]).map((id) => {
    const items = checks.filter((item) => item.category === id);
    const weighted = items.filter((item) => item.status !== "not_applicable" && item.weight > 0);
    const denominator = weighted.reduce((sum, item) => sum + item.weight, 0);
    const earned = weighted.reduce((sum, item) => sum + STATUS_SCORE[item.status as Exclude<AgentReadinessStatus, "not_applicable">] * item.weight, 0);
    return {
      id,
      label: CATEGORY_LABELS[locale][id],
      score: denominator > 0 ? Math.round(earned / denominator) : null,
      applicableChecks: items.filter((item) => item.status !== "not_applicable").length,
      passedChecks: items.filter((item) => item.status === "passed").length,
      warningChecks: items.filter((item) => item.status === "warning").length,
      failedChecks: items.filter((item) => item.status === "failed").length,
      notApplicableChecks: items.filter((item) => item.status === "not_applicable").length,
    };
  });
  const weighted = checks.filter((item) => item.status !== "not_applicable" && item.weight > 0);
  const denominator = weighted.reduce((sum, item) => sum + item.weight, 0);
  const earned = weighted.reduce((sum, item) => sum + STATUS_SCORE[item.status as Exclude<AgentReadinessStatus, "not_applicable">] * item.weight, 0);

  return {
    registryVersion: AGENT_READINESS_REGISTRY_VERSION,
    profile: siteProfile,
    profileEvidence: profileEvidence(siteProfile, commerceEvidence, locale),
    platform,
    score: denominator > 0 ? Math.round(earned / denominator) : null,
    categories,
    checks,
  };
}
