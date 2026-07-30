import { discoverAndCrawl } from "./crawler/discover";
import { extractHtmlSignals } from "./checks/htmlSignals";
import { detectActionReadiness, type ReadinessEvidence } from "./checks/actionReadiness";
import {
  getRecommendation,
  getPassedTitle,
  sortBySeverity,
  describeReadinessEvidence,
  type Severity,
} from "./checks/recommendations";
import { computePublicReadiness } from "./scoring/publicReadiness";
import { computeEntityClarity } from "./scoring/entityClarity";
import type { CheckResult } from "./checks/technicalChecks";
import type { PrimaryAction } from "./measurement";
import type { VisibilityLocale } from "./types";

/**
 * Runs the free check and assembles the four-layer report (V1.2 §2, §6).
 *
 * Three layers are measured for real from public pages with no paid
 * provider. The fourth — Recommendation Evidence — requires AI-answer
 * tracking that is not contracted yet, so it is reported as `not_measured`
 * with the reason stated, never as a zero.
 */

export type LayerState = "pass" | "warn" | "fail" | "not_measured";

export interface LiveFinding {
  ruleId: string;
  state: LayerState;
  severity: Severity;
  title: string;
  detail: string;
  action: string;
  doesNotProve: string;
}

export interface LiveLayer {
  id: "discoverability" | "understanding" | "recommendation_evidence" | "action_readiness";
  score: number | null;
  coverage: number;
  measured: boolean;
  notMeasuredReason?: string;
  findings: LiveFinding[];
  passed: string[];
}

export interface LiveReport {
  url: string;
  finalUrl: string;
  checkedAt: string;
  reachable: boolean;
  fetchError?: string;
  pagesChecked: { role: string; url: string; status: number }[];
  layers: LiveLayer[];
  topBlocker: LiveFinding | null;
  nextActions: LiveFinding[];
  partial: boolean;
}

const DIMENSION_TO_LAYER: Record<string, "discoverability" | "understanding"> = {
  access: "discoverability",
  identity: "understanding",
  offer: "understanding",
  conversion: "understanding",
};

/**
 * Turns raw check evidence into something a business owner can read.
 * The report is shown to the site's owner, not to us — dumping the raw
 * JSON would technically be honest and practically useless.
 */
function describeEvidence(evidence: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(evidence)) {
    if (value === null || value === undefined || value === "" || value === false) continue;
    if (key === "reason") continue;
    const label = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
    if (value === true) {
      parts.push(label);
    } else if (typeof value === "number") {
      parts.push(`${label}: ${value}`);
    } else if (typeof value === "string") {
      parts.push(`${label}: ${value.length > 90 ? `${value.slice(0, 90)}…` : value}`);
    }
    if (parts.length >= 3) break;
  }
  return parts.join(" · ");
}

function toFinding(check: CheckResult, locale: VisibilityLocale): LiveFinding | null {
  const rec = getRecommendation(check.ruleId, locale);
  if (!rec) return null;
  return {
    ruleId: check.ruleId,
    state: check.state,
    severity: rec.severity,
    title: rec.title,
    detail: describeEvidence(check.evidence),
    action: rec.action,
    doesNotProve: rec.doesNotProve,
  };
}

const NOT_MEASURED_REASON: Record<VisibilityLocale, string> = {
  en: "AI-answer tracking is not part of the free check. Measuring whether a brand is mentioned or cited requires a contracted provider and a versioned prompt set — reporting it without one would be invented, so it is left unmeasured rather than shown as zero.",
  ru: "Отслеживание AI-ответов не входит в бесплатную проверку. Чтобы измерить, упоминается ли бренд и цитируется ли он, нужен подключённый провайдер и версионированный набор запросов — без этого цифра была бы выдуманной, поэтому слой оставлен неизмеренным, а не показан нулём.",
};

const UNREADABLE_REASON: Record<VisibilityLocale, string> = {
  en: "The page could not be read, so this layer was not measured. Nothing here is a statement about the site itself.",
  ru: "Страницу не удалось прочитать, поэтому слой не измерялся. Это ничего не утверждает о самом сайте.",
};

export async function runLiveCheck(options: {
  url: string;
  primaryAction: PrimaryAction;
  locale: VisibilityLocale;
  totalBudgetMs?: number;
  /**
   * Test-only: lets the suite point the check at a local fixture server.
   * Never set from an API route — the value is not derived from request
   * input, only from a literal `true` in a test.
   */
  unsafeAllowPrivateHostsForTesting?: boolean;
}): Promise<LiveReport> {
  const { url, primaryAction, locale } = options;
  const budget = options.totalBudgetMs ?? 20_000;
  const perRequestTimeout = Math.min(8_000, Math.floor(budget / 3));
  const startedAt = Date.now();

  const crawl = await discoverAndCrawl(url, {
    timeoutMs: perRequestTimeout,
    maxRedirects: 4,
    unsafeAllowPrivateHostsForTesting: options.unsafeAllowPrivateHostsForTesting,
  });
  const homepage = crawl.pages.find((p) => p.role === "homepage");
  const homepageStatus = homepage?.fetch.statusCode ?? 0;
  // HTML alone is not enough: a 403 block page, a 500 or a soft error page
  // all carry a body. Scoring one of those would report a WAF's markup as
  // if it were the owner's homepage.
  const reachable =
    Boolean(homepage?.fetch.html) && homepageStatus >= 200 && homepageStatus < 300;
  const partial = Date.now() - startedAt > budget;

  const fetchError =
    homepage?.fetch.fetchError ??
    (reachable || homepageStatus === 0 ? undefined : `HTTP ${homepageStatus}`);

  const checks = crawl.homepageChecks;

  // --- Layers 1 & 2 from the deterministic technical checks ---
  const byLayer = new Map<"discoverability" | "understanding", CheckResult[]>([
    ["discoverability", []],
    ["understanding", []],
  ]);
  for (const check of checks) {
    const layer = DIMENSION_TO_LAYER[check.dimension];
    if (layer) byLayer.get(layer)!.push(check);
  }

  const readiness = computePublicReadiness(checks);
  const accessDim = readiness.dimensionScores.find((d) => d.id === "access");

  function buildLayer(
    id: "discoverability" | "understanding",
    score: number | null,
    coverage: number,
  ): LiveLayer {
    const layerChecks = byLayer.get(id) ?? [];
    const findings = layerChecks
      .filter((c) => c.state === "fail" || c.state === "warn")
      .map((c) => toFinding(c, locale))
      .filter((f): f is LiveFinding => f !== null);
    const passed = layerChecks
      .filter((c) => c.state === "pass")
      .map((c) => getPassedTitle(c.ruleId, locale) ?? c.ruleId);

    // Without the page itself, almost every check in these two layers is
    // `not_measured`. Scoring the handful that survive would put a number
    // like "17" next to a site we never actually read — technically derived,
    // practically a false statement about the site.
    if (!reachable) {
      return {
        id,
        score: null,
        coverage: 0,
        measured: false,
        notMeasuredReason: UNREADABLE_REASON[locale],
        findings: sortBySeverity(findings),
        passed: [],
      };
    }

    return { id, score, coverage, measured: true, findings: sortBySeverity(findings), passed };
  }

  const understandingCoverage =
    readiness.dimensionScores
      .filter((d) => d.id !== "access")
      .reduce((sum, d) => sum + d.coverage, 0) / 3;
  const understandingScore = Math.round(
    readiness.dimensionScores
      .filter((d) => d.id !== "access")
      .reduce((sum, d) => sum + d.score, 0) / 3,
  );

  const layers: LiveLayer[] = [
    buildLayer("discoverability", accessDim?.score ?? null, accessDim?.coverage ?? 0),
    buildLayer("understanding", understandingScore, understandingCoverage),
  ];

  // --- Layer 3: honestly not measured without a contracted provider ---
  layers.push({
    id: "recommendation_evidence",
    score: null,
    coverage: 0,
    measured: false,
    notMeasuredReason: NOT_MEASURED_REASON[locale],
    findings: [],
    passed: [],
  });

  // --- Layer 4: real Action Readiness from the homepage HTML ---
  const actionFindings: LiveFinding[] = [];
  const actionPassed: string[] = [];
  if (reachable && homepage?.fetch.html) {
    const signals = extractHtmlSignals(homepage.fetch.html);
    const detected = detectActionReadiness(signals, primaryAction, homepage.fetch.html);
    const entries: [string, { state: LayerState; found: ReadinessEvidence[] }][] = [
      ["action.human_ready", detected.humanReady],
      ["action.machine_readable", detected.machineReadable],
      ["action.agent_executable", detected.agentExecutable],
    ];
    for (const [ruleId, result] of entries) {
      const rec = getRecommendation(ruleId, locale);
      if (!rec) continue;
      if (result.state === "pass") {
        actionPassed.push(getPassedTitle(ruleId, locale) ?? rec.title);
        continue;
      }
      actionFindings.push({
        ruleId,
        state: result.state,
        severity: rec.severity,
        title: rec.title,
        detail: describeReadinessEvidence(result.found, locale),
        action: rec.action,
        doesNotProve: rec.doesNotProve,
      });
    }
  }

  layers.push({
    id: "action_readiness",
    score: null,
    coverage: reachable ? 1 : 0,
    measured: reachable,
    notMeasuredReason: reachable ? undefined : UNREADABLE_REASON[locale],
    findings: sortBySeverity(actionFindings),
    passed: actionPassed,
  });

  const allFindings = sortBySeverity(layers.flatMap((l) => l.findings));

  return {
    url,
    finalUrl: homepage?.fetch.finalUrl ?? url,
    checkedAt: new Date().toISOString(),
    reachable,
    fetchError,
    // Only pages we genuinely read. A linked URL that 404s was attempted,
    // not read — counting it would inflate "pages read" with pages whose
    // content never reached any check.
    pagesChecked: crawl.pages
      .filter((p) => p.fetch.statusCode >= 200 && p.fetch.statusCode < 300 && !p.fetch.fetchError)
      .map((p) => ({
        role: p.role,
        url: p.fetch.finalUrl,
        status: p.fetch.statusCode,
      })),
    layers,
    topBlocker: allFindings[0] ?? null,
    nextActions: allFindings.slice(0, 3),
    partial,
  };
}

/** Entity Clarity is computed but reported as supporting detail, not a headline score. */
export function entityClarityFor(html: string) {
  return computeEntityClarity(extractHtmlSignals(html));
}
