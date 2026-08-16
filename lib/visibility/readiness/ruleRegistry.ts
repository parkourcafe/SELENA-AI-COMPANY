import type { SiteProfile, VisibilityLocale } from "../types";

export const AGENT_READINESS_REGISTRY_VERSION = "selena-agent-readiness-2026-08-16-v1" as const;

export type AgentReadinessCategory =
  | "discoverability"
  | "content_accessibility"
  | "bot_access"
  | "protocol_discovery"
  | "commerce"
  | "selena_depth";

export type AgentReadinessStatus = "passed" | "warning" | "failed" | "not_applicable";

export type AgentCheckId =
  | `CF-D0${1 | 2 | 3 | 4}`
  | "CF-C01"
  | `CF-B0${1 | 2 | 3}`
  | `CF-P0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`
  | `CF-X0${1 | 2 | 3 | 4 | 5}`
  | `SE-${"01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10"}`;

type Localized = Record<VisibilityLocale, string>;

export type AgentReadinessRule = {
  id: AgentCheckId;
  methodologyVersion: typeof AGENT_READINESS_REGISTRY_VERSION;
  title: Localized;
  category: AgentReadinessCategory;
  applicableProfiles: SiteProfile[];
  weight: number;
  collectionMethod: string;
  checkedTarget: string;
  genericFix: Localized;
  verification: Localized;
  doesNotProve: Localized;
  references: readonly string[];
  experimental?: boolean;
};

const ALL: SiteProfile[] = ["all_checks", "content_site", "api_application", "commerce"];
const API: SiteProfile[] = ["all_checks", "api_application", "commerce"];
const COMMERCE: SiteProfile[] = ["all_checks", "commerce"];

function text(en: string, ru: string): Localized {
  return { en, ru };
}

function define(
  id: AgentCheckId,
  category: AgentReadinessCategory,
  title: Localized,
  checkedTarget: string,
  applicableProfiles: SiteProfile[],
  genericFix: Localized,
  verification: Localized,
  options: Pick<AgentReadinessRule, "weight" | "collectionMethod" | "doesNotProve" | "references" | "experimental">,
): AgentReadinessRule {
  return {
    id,
    methodologyVersion: AGENT_READINESS_REGISTRY_VERSION,
    title,
    category,
    applicableProfiles,
    checkedTarget,
    genericFix,
    verification,
    ...options,
  };
}

const WEBSITE_BOUNDARY = text(
  "Passing this check proves only that the public technical signal was observed; it does not prove real AI mentions, citations or recommendations.",
  "Успешная проверка доказывает только наличие публичного технического сигнала; она не доказывает реальные AI-упоминания, citations или рекомендации.",
);

const RESCAN = text(
  "Publish the change, then re-scan the same URL and confirm a 2xx response with the expected evidence.",
  "Опубликуйте изменение, затем повторно проверьте тот же URL и подтвердите ответ 2xx с ожидаемым evidence.",
);

const DOCS = {
  robots: ["https://www.rfc-editor.org/rfc/rfc9309"],
  sitemap: ["https://www.sitemaps.org/protocol.html"],
  link: ["https://www.rfc-editor.org/rfc/rfc8288"],
  dnsAid: ["https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/"],
  markdown: ["https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/"],
  contentSignals: ["https://contentsignals.org/"],
  webBotAuth: ["https://datatracker.ietf.org/doc/draft-meunier-web-bot-auth-architecture/"],
  oauth: ["https://www.rfc-editor.org/rfc/rfc8414"],
  protectedResource: ["https://www.rfc-editor.org/rfc/rfc9728"],
  mcp: ["https://modelcontextprotocol.io/specification/draft/basic/authorization"],
  a2a: ["https://a2a-protocol.org/dev/specification/"],
  schema: ["https://schema.org/docs/documents.html"],
} as const;

const common = {
  weight: 1,
  doesNotProve: WEBSITE_BOUNDARY,
};

export const agentReadinessRuleRegistry: readonly AgentReadinessRule[] = [
  define("CF-D01", "discoverability", text("robots.txt", "robots.txt"), "/robots.txt", ALL,
    text("Publish a valid /robots.txt. Keep private paths disallowed and declare intentional rules for public crawlers.", "Опубликуйте валидный /robots.txt. Закройте приватные пути и явно задайте правила для публичных краулеров."), RESCAN,
    { ...common, collectionMethod: "HTTP GET and deterministic directive parsing", references: DOCS.robots }),
  define("CF-D02", "discoverability", text("Sitemap", "Sitemap"), "/sitemap.xml", ALL,
    text("Publish a valid XML sitemap of canonical public URLs and reference it from robots.txt.", "Опубликуйте валидный XML sitemap с canonical публичными URL и укажите его в robots.txt."), RESCAN,
    { ...common, collectionMethod: "HTTP GET and XML root inspection", references: DOCS.sitemap }),
  define("CF-D03", "discoverability", text("HTTP Link headers", "HTTP Link headers"), "Homepage response headers", ALL,
    text("Add an HTTP Link header only for a real discovery resource, for example: Link: </sitemap.xml>; rel=\"sitemap\".", "Добавьте HTTP Link только для реально существующего discovery-ресурса, например: Link: </sitemap.xml>; rel=\"sitemap\"."), RESCAN,
    { ...common, collectionMethod: "Homepage response-header inspection", references: DOCS.link }),
  define("CF-D04", "discoverability", text("DNS for AI Discovery (DNS-AID)", "DNS for AI Discovery (DNS-AID)"), "index._agents.<domain> / _agents.<domain>", API,
    text("If you operate a public agent, publish DNS-AID SVCB records under the _agents namespace. Otherwise select Content Site so this check is not applicable.", "Если у вас есть публичный агент, опубликуйте DNS-AID SVCB-записи в пространстве _agents. Иначе выберите профиль Content Site, чтобы проверка была неприменима."), RESCAN,
    { ...common, collectionMethod: "Bounded DNS SVCB/HTTPS discovery", references: DOCS.dnsAid }),

  define("CF-C01", "content_accessibility", text("Markdown content negotiation", "Markdown content negotiation"), "Homepage with Accept: text/markdown", ALL,
    text("Return a Markdown representation when Accept: text/markdown is requested, with Content-Type: text/markdown and the same public facts as the HTML page.", "Возвращайте Markdown-представление при Accept: text/markdown с Content-Type: text/markdown и теми же публичными фактами, что в HTML."), RESCAN,
    { ...common, collectionMethod: "HTTP content negotiation probe", references: DOCS.markdown }),

  define("CF-B01", "bot_access", text("AI bot rules", "Правила AI-ботов"), "/robots.txt", ALL,
    text("Add explicit, intentional rules for the AI user-agents you support. Do not open private or authenticated paths.", "Добавьте явные правила для поддерживаемых AI user-agent. Не открывайте приватные или авторизованные пути."), RESCAN,
    { ...common, collectionMethod: "robots.txt AI user-agent matrix", references: DOCS.robots }),
  define("CF-B02", "bot_access", text("Content Signals", "Content Signals"), "robots.txt / response headers", ALL,
    text("If policy signaling is required, publish valid Content-Signal directives for ai-train, search and ai-input. Keep the policy consistent across scopes.", "Если нужны policy-сигналы, опубликуйте валидные Content-Signal для ai-train, search и ai-input и согласуйте их между scope."), RESCAN,
    { ...common, collectionMethod: "robots.txt and HTTP-header token inspection", references: DOCS.contentSignals }),
  define("CF-B03", "bot_access", text("Web Bot Auth", "Web Bot Auth"), "/.well-known/http-message-signatures-directory", API,
    text("For authenticated bots, publish the HTTP Message Signatures directory at the well-known path. Do not expose signing secrets.", "Для аутентифицированных ботов опубликуйте каталог HTTP Message Signatures по well-known пути. Не раскрывайте секреты подписи."), RESCAN,
    { ...common, collectionMethod: "Well-known resource availability and structure", references: DOCS.webBotAuth }),

  define("CF-P01", "protocol_discovery", text("API Catalog", "API Catalog"), "/.well-known/api-catalog", API,
    text("Publish an API catalog that points only to maintained, public API descriptions.", "Опубликуйте API catalog со ссылками только на поддерживаемые публичные описания API."), RESCAN,
    { ...common, collectionMethod: "Well-known resource availability and JSON/text structure", references: ["https://www.ietf.org/archive/id/draft-ietf-httpapi-api-catalog-10.html"] }),
  define("CF-P02", "protocol_discovery", text("OAuth/OIDC discovery", "OAuth/OIDC discovery"), "/.well-known/oauth-authorization-server", API,
    text("Publish authorization-server metadata with issuer, authorization_endpoint and token_endpoint, using your real HTTPS endpoints.", "Опубликуйте metadata authorization server с issuer, authorization_endpoint и token_endpoint, используя реальные HTTPS endpoints."), RESCAN,
    { ...common, collectionMethod: "OAuth metadata fetch and required-field validation", references: DOCS.oauth }),
  define("CF-P03", "protocol_discovery", text("OAuth Protected Resource Metadata", "OAuth Protected Resource Metadata"), "/.well-known/oauth-protected-resource", API,
    text("Publish protected-resource metadata with the resource identifier and authorization_servers array.", "Опубликуйте protected-resource metadata с идентификатором resource и массивом authorization_servers."), RESCAN,
    { ...common, collectionMethod: "RFC 9728 metadata fetch and required-field validation", references: DOCS.protectedResource }),
  define("CF-P04", "protocol_discovery", text("auth.md", "auth.md"), "/auth.md", API,
    text("Publish /auth.md with the supported authentication flow, scopes, public endpoints and safe setup steps. Never include secrets.", "Опубликуйте /auth.md с поддерживаемым auth-flow, scopes, публичными endpoints и безопасной настройкой. Никогда не включайте секреты."), RESCAN,
    { ...common, collectionMethod: "Markdown resource availability and section inspection", references: DOCS.mcp }),
  define("CF-P05", "protocol_discovery", text("MCP Server Card", "MCP Server Card"), "/.well-known/mcp/server-card.json", API,
    text("Publish a valid MCP Server Card with protocol version, capabilities and public endpoint metadata.", "Опубликуйте валидную MCP Server Card с версией протокола, capabilities и metadata публичного endpoint."), RESCAN,
    { ...common, collectionMethod: "MCP card fetch and JSON structure validation", references: DOCS.mcp }),
  define("CF-P06", "protocol_discovery", text("A2A Agent Card", "A2A Agent Card"), "/.well-known/agent-card.json", API,
    text("Publish an A2A Agent Card with name, description, URL, capabilities and skills. Keep sensitive skills in an authenticated extended card.", "Опубликуйте A2A Agent Card с name, description, URL, capabilities и skills. Чувствительные skills держите в защищённой расширенной карточке."), RESCAN,
    { ...common, collectionMethod: "A2A well-known card fetch and JSON structure validation", references: DOCS.a2a }),
  define("CF-P07", "protocol_discovery", text("Agent Skills index", "Agent Skills index"), "/.well-known/agent-skills/index.json", API,
    text("Publish a versioned skills index that lists public skill names, descriptions and safe resource URLs.", "Опубликуйте версионированный skills index со списком публичных названий, описаний и безопасных URL ресурсов."), RESCAN,
    { ...common, collectionMethod: "Skills index fetch and JSON structure validation", references: ["https://agentskills.io/home"] }),
  define("CF-P08", "protocol_discovery", text("WebMCP", "WebMCP"), "Homepage browser capabilities", API,
    text("Register only intentional browser-side tools through WebMCP, with clear input schemas and read/write annotations.", "Регистрируйте через WebMCP только намеренные browser-side tools с ясными input schemas и read/write annotations."), RESCAN,
    { ...common, collectionMethod: "Static HTML capability-marker inspection; no page code is executed", references: ["https://webmachinelearning.github.io/webmcp/"] }),

  define("CF-X01", "commerce", text("x402", "x402"), "HTTP payment discovery evidence", COMMERCE,
    text("Add x402 only to intentionally paid API routes and document the payment requirements. Do not place wallet secrets in public metadata.", "Добавляйте x402 только на намеренно платные API routes и документируйте требования. Не помещайте wallet secrets в публичные metadata."), RESCAN,
    { ...common, collectionMethod: "Public headers, HTML and API-description token inspection", references: ["https://www.x402.org/"] }),
  define("CF-X02", "commerce", text("MPP", "MPP"), "/openapi.json payment metadata", COMMERCE,
    text("Describe payable operations in OpenAPI using the current MPP payment metadata and verify them in test mode before activation.", "Опишите платные операции в OpenAPI с актуальной MPP payment metadata и проверьте их в test mode до активации."), RESCAN,
    { ...common, collectionMethod: "OpenAPI payment-extension inspection", references: ["https://mpp.dev/"] }),
  define("CF-X03", "commerce", text("UCP", "UCP"), "/.well-known/ucp", COMMERCE,
    text("Publish valid UCP discovery metadata for the commerce capabilities you actually support.", "Опубликуйте валидную UCP discovery metadata только для реально поддерживаемых commerce capabilities."), RESCAN,
    { ...common, collectionMethod: "UCP well-known resource inspection", references: ["https://ucp.dev/"] }),
  define("CF-X04", "commerce", text("ACP", "ACP"), "/.well-known/acp.json", COMMERCE,
    text("Publish ACP discovery metadata with the real API base URL, protocol version and supported services.", "Опубликуйте ACP discovery metadata с реальным API base URL, версией протокола и поддерживаемыми services."), RESCAN,
    { ...common, collectionMethod: "ACP well-known resource inspection", references: ["https://agenticcommerce.dev/"] }),
  define("CF-X05", "commerce", text("AP2 (experimental)", "AP2 (экспериментально)"), "/.well-known/ap2.json", COMMERCE,
    text("Do not add AP2 solely to raise a score. If an approved AP2 implementation exists, publish its non-secret discovery metadata and document its trust model.", "Не добавляйте AP2 только ради score. Если есть утверждённая реализация, опубликуйте несекретную discovery metadata и опишите trust model."), RESCAN,
    { ...common, weight: 0, collectionMethod: "Experimental discovery probe; diagnostic only", references: ["https://github.com/google-agentic-commerce/AP2"], experimental: true }),

  define("SE-01", "selena_depth", text("Canonical URL and redirects", "Canonical URL и redirects"), "Up to five selected pages", ALL,
    text("Use one canonical public URL per page and keep redirect chains short and same-purpose.", "Используйте один canonical публичный URL на страницу и короткие redirects с сохранением назначения."), RESCAN,
    { ...common, collectionMethod: "Pinned HTTP crawl and canonical comparison", references: ["https://developers.google.com/search/docs/crawling-indexing/canonicalization"] }),
  define("SE-02", "selena_depth", text("Indexability and status", "Indexability и status"), "Up to five selected pages", ALL,
    text("Return a successful status for public pages and remove accidental noindex directives. Keep private pages protected.", "Возвращайте успешный status для публичных страниц и удалите случайный noindex. Приватные страницы оставьте защищёнными."), RESCAN,
    { ...common, collectionMethod: "HTTP status, X-Robots-Tag and meta robots inspection", references: DOCS.robots }),
  define("SE-03", "selena_depth", text("Schema / JSON-LD", "Schema / JSON-LD"), "Public page JSON-LD", ALL,
    text("Add valid JSON-LD for the entity and offer types present on the page. Use only verified business facts.", "Добавьте валидный JSON-LD для сущности и предложений страницы. Используйте только подтверждённые факты бизнеса."), RESCAN,
    { ...common, collectionMethod: "JSON-LD parsing and entity-type inspection", references: DOCS.schema }),
  define("SE-04", "selena_depth", text("Entity clarity", "Ясность сущности"), "Title, H1 and public entity data", ALL,
    text("State one consistent public brand name, offer and location across title, H1, copy and structured data.", "Укажите одно согласованное публичное имя бренда, предложение и локацию в title, H1, тексте и structured data."), RESCAN,
    { ...common, collectionMethod: "Cross-signal entity comparison", references: DOCS.schema }),
  define("SE-05", "selena_depth", text("Multi-page content readiness", "Готовность контента нескольких страниц"), "Homepage plus up to four relevant pages", ALL,
    text("Give each key page a descriptive heading, direct opening answer, verifiable scope and a clear next action.", "Дайте каждой ключевой странице содержательный заголовок, прямой первый ответ, проверяемый scope и ясное следующее действие."), RESCAN,
    { ...common, collectionMethod: "Bounded multi-page content heuristics", references: [] }),
  define("SE-06", "selena_depth", text("Block-level citability", "Citability блоков"), "Visible H1-H3 anchored blocks", ALL,
    text("Rewrite weak blocks so each can stand alone: direct answer, concrete scope, complete sentence and evidence-safe facts.", "Перепишите слабые блоки так, чтобы каждый был самостоятельным: прямой ответ, конкретный scope, законченное предложение и evidence-safe факты."), RESCAN,
    { ...common, collectionMethod: "Versioned block-level content heuristics", references: [] }),
  define("SE-07", "selena_depth", text("Business fact consistency", "Согласованность бизнес-фактов"), "Public pages and entity data", ALL,
    text("Use the same verified name, location and contact path across public pages and structured data.", "Используйте одинаковые подтверждённые имя, локацию и контактный путь на публичных страницах и в structured data."), RESCAN,
    { ...common, collectionMethod: "Multi-page business-signal comparison", references: DOCS.schema }),
  define("SE-08", "selena_depth", text("Primary action path", "Путь к основному действию"), "Homepage links, forms and machine-readable actions", ALL,
    text("Expose the primary action as a visible labelled control and, where appropriate, a documented machine-readable endpoint.", "Покажите основное действие как видимый подписанный control и, где уместно, как документированный machine-readable endpoint."), RESCAN,
    { ...common, collectionMethod: "Human-readable and machine-readable action detection", references: [] }),
  define("SE-09", "selena_depth", text("llms.txt diagnostic", "Диагностика llms.txt"), "/llms.txt", ALL,
    text("Optionally publish a concise llms.txt that links to canonical public documentation. This diagnostic has zero score weight.", "При желании опубликуйте краткий llms.txt со ссылками на canonical публичную документацию. Эта диагностика имеет нулевой вес."), RESCAN,
    { ...common, weight: 0, collectionMethod: "HTTP GET; diagnostic only", references: ["https://llmstxt.org/"] }),
  define("SE-10", "selena_depth", text("Commercial fact consistency", "Согласованность коммерческих фактов"), "Visible prices and JSON-LD offers", COMMERCE,
    text("Generate visible prices, metadata, JSON-LD and checkout quotes from one versioned commercial-facts source.", "Формируйте видимые цены, metadata, JSON-LD и checkout quotes из одного версионированного источника commercial facts."), RESCAN,
    { ...common, collectionMethod: "Visible-price and structured-price comparison", references: DOCS.schema }),
] as const;

export function getAgentReadinessRule(id: AgentCheckId): AgentReadinessRule {
  const rule = agentReadinessRuleRegistry.find((item) => item.id === id);
  if (!rule) throw new Error(`Missing Agent Readiness rule: ${id}`);
  return rule;
}

export function localizedRule(rule: AgentReadinessRule, locale: VisibilityLocale) {
  return {
    title: rule.title[locale],
    fix: rule.genericFix[locale],
    verification: rule.verification[locale],
    doesNotProve: rule.doesNotProve[locale],
  };
}
