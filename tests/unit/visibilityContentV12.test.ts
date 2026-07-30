import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { visibilityContentEn } from "@/lib/visibility/content.en";
import { visibilityContentRu } from "@/lib/visibility/content.ru";
import { getSampleReport } from "@/lib/visibility/sample-report-data";
import { visibilityRoutes } from "@/lib/visibility/routes";
import { BUSINESS_MODELS, PRIMARY_ACTIONS, inferLocalBusinessMode } from "@/lib/visibility/measurement";

const LOCALES = [
  { name: "en", content: visibilityContentEn, routes: visibilityRoutes.en },
  { name: "ru", content: visibilityContentRu, routes: visibilityRoutes.ru },
] as const;

/** TZ L.2 — homepage primary CTA points at the locale-correct /check route. */
test("homepage primary CTA targets the locale-correct check route", () => {
  assert.equal(visibilityContentEn.homeTeaser.primaryCta.href, visibilityRoutes.en.check);
  assert.equal(visibilityContentRu.homeTeaser.primaryCta.href, visibilityRoutes.ru.check);
});

/** TZ C — exact required primary CTA labels. */
test("primary CTA labels match the binding owner copy", () => {
  assert.equal(visibilityContentEn.homeTeaser.primaryCta.label, "Run Free Visibility Check");
  assert.equal(visibilityContentRu.homeTeaser.primaryCta.label, "Проверить видимость бесплатно");
});

/** TZ L.3 — secondary CTA still routes to the existing AI Audit booking path. */
test("secondary CTA preserves the existing AI Audit contact path", () => {
  assert.equal(visibilityContentEn.homeTeaser.secondaryCta.href, visibilityRoutes.en.contact);
  assert.equal(visibilityContentRu.homeTeaser.secondaryCta.href, visibilityRoutes.ru.contact);
  assert.match(visibilityContentEn.homeTeaser.secondaryCta.label, /Audit/i);
  assert.match(visibilityContentRu.homeTeaser.secondaryCta.label, /аудит/i);
});

/** TZ decision 11 — four measurement layers, in both locales. */
test("all four measurement layers are defined in both locales", () => {
  const expected = ["discoverability", "understanding", "recommendation_evidence", "action_readiness"];
  for (const { name, content } of LOCALES) {
    assert.deepEqual(
      content.measurementLayers.layers.map((l) => l.id),
      expected,
      `${name} measurement layers`,
    );
  }
});

/** TZ decision 12 / L.12 — the three Action Readiness states stay separate. */
test("Action Readiness exposes exactly three distinct states in both locales", () => {
  const expected = ["human_ready", "machine_readable", "agent_executable"];
  for (const { name, content } of LOCALES) {
    assert.deepEqual(
      content.actionReadiness.states.map((s) => s.id),
      expected,
      `${name} action readiness states`,
    );
    for (const state of content.actionReadiness.states) {
      assert.ok(state.doesNotProve.length > 0, `${name}/${state.id} must state what it does not prove`);
    }
  }
});

/** TZ decision 13 / L.13 — a WhatsApp or button link is never called agent-executable. */
test("sample report does not label a contact link as agent-executable", () => {
  for (const locale of ["en", "ru"] as const) {
    const report = getSampleReport(locale);
    const agent = report.actionReadiness.states.find((s) => s.id === "agent_executable");
    assert.ok(agent, "agent_executable state must exist");
    // The sample deliberately fails this state; the point is that human-ready
    // passing must never be enough to mark agent-executable as met.
    const human = report.actionReadiness.states.find((s) => s.id === "human_ready");
    assert.equal(human?.state, "pass");
    assert.notEqual(agent?.state, "pass", "human-ready must not imply agent-executable");
    assert.match(report.actionReadiness.agentCaveat, /WhatsApp/i);
  }
});

/** TZ E — every value in the sample report is tagged as sample, never observed. */
test("every sample-report datum is tagged sourceStatus 'sample'", () => {
  for (const locale of ["en", "ru"] as const) {
    const report = getSampleReport(locale);
    assert.equal(report.identity.sourceStatus, "sample");
    for (const section of [report.discoverability, report.understanding]) {
      for (const row of section.rows) {
        assert.equal(row.sourceStatus, "sample", `${locale} ${section.title} ${row.label}`);
      }
    }
    for (const ratio of report.recommendationEvidence.ratios) {
      assert.equal(ratio.sourceStatus, "sample");
    }
    for (const state of report.actionReadiness.states) {
      assert.equal(state.sourceStatus, "sample");
    }
    for (const step of report.actionReadiness.timeline) {
      assert.equal(step.sourceStatus, "sample");
    }
  }
});

/** TZ E.5 — the action path timeline has all six ordered steps. */
test("action path timeline contains the six required steps in order", () => {
  const expected = [
    "discovery",
    "business_understood",
    "primary_action_found",
    "action_understandable",
    "action_completable",
    "confirmation_detected",
  ];
  for (const locale of ["en", "ru"] as const) {
    assert.deepEqual(
      getSampleReport(locale).actionReadiness.timeline.map((s) => s.id),
      expected,
    );
  }
});

/** TZ E.4 — recommendation evidence is ratios, not a score. */
test("recommendation evidence is reported as X/Y ratios with a denominator", () => {
  for (const locale of ["en", "ru"] as const) {
    const ratios = getSampleReport(locale).recommendationEvidence.ratios;
    assert.ok(ratios.length >= 3);
    for (const ratio of ratios) {
      assert.ok(ratio.total > 0, "every ratio needs a denominator");
      assert.ok(ratio.matched <= ratio.total, "matched can never exceed the denominator");
    }
  }
});

/**
 * TZ D, revised for the live check.
 *
 * The V1.2 intake asked for eight fields because a human was going to read
 * the brief. The check now runs on the page, so the form asks only for what
 * the check itself consumes plus a contact — every other field would be
 * friction in front of the result the visitor came for. See DOC-021.
 */
test("check form asks only for what the live check needs, with every action labelled", () => {
  for (const { name, content } of LOCALES) {
    const f = content.checkForm.fields;
    for (const key of [
      "website",
      "websiteHint",
      "primaryAction",
      "primaryActionHint",
      "contact",
      "contactHint",
      "contactPlaceholder",
    ] as const) {
      assert.ok(f[key] && f[key].length > 0, `${name} field ${key}`);
    }
    for (const action of PRIMARY_ACTIONS) {
      assert.ok(content.checkForm.primaryActionOptions[action], `${name} primary action ${action}`);
    }
    assert.ok(content.checkForm.whatYouGet.items.length >= 3, `${name} must state what is delivered`);
  }
  assert.equal(BUSINESS_MODELS.length, 6);
  assert.equal(PRIMARY_ACTIONS.length, 9);
});

/** TZ decision 14 — Local Business Mode is inferred, and is a mode not a scanner. */
test("Local Business Mode is inferred for local and hospitality models only", () => {
  assert.equal(inferLocalBusinessMode("local_business"), true);
  assert.equal(inferLocalBusinessMode("hospitality"), true);
  assert.equal(inferLocalBusinessMode("saas"), false);
  assert.equal(inferLocalBusinessMode("ecommerce"), false);
  for (const { name, content } of LOCALES) {
    assert.ok(content.localBusinessMode.boundary.length > 0, `${name} needs an explicit boundary`);
    assert.match(
      content.localBusinessMode.boundary,
      /Google/i,
      `${name} boundary must say no Google/Maps integration exists`,
    );
  }
});

/**
 * TZ D replacement. The calibration disclaimer existed because the free
 * check returned a sample of someone else's site. It now returns a real
 * measurement of the submitted site, so the disclaimer would be false —
 * what must hold instead is that the layer we genuinely cannot measure is
 * named as unmeasured rather than quietly scored.
 */
test("the live report names the unmeasured layer instead of scoring it", () => {
  for (const { name, content } of LOCALES) {
    assert.equal(
      content.liveReport.layerTitles.recommendation_evidence.length > 0,
      true,
      `${name} must title the recommendation-evidence layer`,
    );
    assert.ok(content.liveReport.notMeasuredLabel.length > 0, `${name} needs a not-measured label`);
    assert.ok(
      content.liveReport.layersIntro.length > 0,
      `${name} must explain why a layer is left unmeasured`,
    );
  }
  assert.match(visibilityContentEn.liveReport.layersIntro, /rather than shown as a zero/i);
  assert.match(visibilityContentRu.liveReport.layersIntro, /а не показан нулём/i);
});

/** TZ L.9 + decision 5/8 — pricing matches the owner decisions exactly. */
test("pricing shows exactly the approved ladder with $9/$90 Monitor", () => {
  for (const { name, content } of LOCALES) {
    const allPlans = content.pricing.tracks.flatMap((t) => t.plans);
    const prices = allPlans.map((p) => p.price).join(" | ");

    assert.match(prices, /\$9\/(month|месяц)/, `${name} must show $9 monthly`);
    assert.match(prices, /\$90\/(year|год)/, `${name} must show $90 yearly`);
    assert.match(prices, /\$500/, `${name} must keep the $500 Audit`);
    assert.match(prices, /\$4[ ,]000/, `${name} must keep the $4,000 Sprint`);
    assert.match(prices, /\$10[ ,]000/, `${name} must keep the from-$10,000 Business OS`);

    const monitor = allPlans.find((p) => /Monitor/i.test(p.name));
    assert.ok(monitor, `${name} Monitor plan`);
    assert.notEqual(monitor?.status, "active", "Monitor checkout must not be open");
  }
});

/** TZ L.11 + decision 8 — no legacy monitoring tiers anywhere in active copy. */
test("no $149 / $349 / $1,250 tiers and no Growth or Managed plan remain", () => {
  for (const { name, content } of LOCALES) {
    const serialized = JSON.stringify(content);
    for (const banned of ["$149", "$349", "$1,250", "$1250"]) {
      assert.ok(!serialized.includes(banned), `${name} still contains ${banned}`);
    }
    const planNames = content.pricing.tracks.flatMap((t) => t.plans).map((p) => p.name);
    assert.ok(!planNames.some((n) => /Growth|Managed/i.test(n)), `${name} still offers a Growth/Managed plan`);
  }
});

/** TZ L.10 + decision 3 — no regional provider claims in active product copy. */
test("no Yandex/Topvisor/Alice references in active visibility copy or sample reports", () => {
  const banned = /yandex|яндекс|topvisor|топвизор|alice ai|алиса/i;
  for (const { name, content } of LOCALES) {
    assert.ok(!banned.test(JSON.stringify(content)), `${name} visibility content mentions a regional provider`);
  }
  for (const locale of ["en", "ru"] as const) {
    assert.ok(
      !banned.test(JSON.stringify(getSampleReport(locale))),
      `${locale} sample report mentions a regional provider`,
    );
  }
});

/** TZ decision 20 + L — llms.txt is never described as a ranking factor. */
test("llms.txt is described as zero-weight, never as a ranking factor", () => {
  for (const locale of ["en", "ru"] as const) {
    const report = getSampleReport(locale);
    const row = report.discoverability.rows.find((r) => /llms\.txt/i.test(r.label));
    assert.ok(row, `${locale} sample should mention llms.txt`);
    assert.equal(row?.state, "info", "llms.txt must be informational, never pass/fail");
  }
  assert.match(visibilityContentEn.notClaimed.items.join(" "), /llms\.txt/i);
  assert.match(visibilityContentRu.notClaimed.items.join(" "), /llms\.txt/i);
});

/**
 * Sections whose entire purpose is to negate a claim ("we do NOT do X")
 * legitimately contain the banned phrases in negated form. Scanning them
 * for the raw phrase would fail the honest copy and pass the dishonest
 * copy, so they are excluded and asserted separately below.
 */
function promotionalCopy(content: typeof visibilityContentEn): string {
  const { notClaimed, ...rest } = content;
  void notClaimed;
  return JSON.stringify(rest);
}

/** TZ decision 19 — no revenue-loss estimate is ever asserted as a finding. */
test("no revenue-loss estimate is asserted in any visibility copy", () => {
  const revenueClaim = /(you are|вы) (are )?losing|теряете \$|losing \$\d|потерянн\w+ выручк\w+ составля/i;
  for (const { name, content } of LOCALES) {
    assert.ok(!revenueClaim.test(promotionalCopy(content)), `${name} asserts a revenue-loss estimate`);
  }
  // And the disclaimer explicitly refusing to estimate revenue must exist.
  assert.match(visibilityContentEn.notClaimed.items.join(" "), /does not estimate lost revenue/i);
  assert.match(visibilityContentRu.notClaimed.items.join(" "), /не оценивает потерянную выручку/i);
});

/** TZ C — forbidden marketing phrases must never be asserted as promises. */
test("forbidden marketing phrases are absent from promotional copy", () => {
  const forbidden = [
    /what ai thinks about your business/i,
    /guaranteed (ai )?(ranking|citation)/i,
    /get cited by chatgpt/i,
    /complete ai visibility/i,
  ];
  const haystack = [
    promotionalCopy(visibilityContentEn),
    promotionalCopy(visibilityContentRu),
    JSON.stringify(getSampleReport("en")),
    JSON.stringify(getSampleReport("ru")),
  ].join(" ");
  for (const pattern of forbidden) {
    assert.ok(!pattern.test(haystack), `forbidden phrase asserted as a promise: ${pattern}`);
  }
  // The negated forms belong in notClaimed and must actually be there.
  assert.match(visibilityContentEn.notClaimed.items.join(" "), /does not claim complete AI visibility/i);
});

/** TZ E + J — /report/sample must be noindex and excluded from the sitemap. */
test("sample report routes are noindex and absent from the sitemap", () => {
  for (const path of ["app/report/sample/page.tsx", "app/ru/report/sample/page.tsx"]) {
    const source = readFileSync(join(process.cwd(), path), "utf8");
    assert.match(source, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/, `${path} must be noindex,nofollow`);
  }
  const sitemap = readFileSync(join(process.cwd(), "app/sitemap.ts"), "utf8");
  assert.ok(!/\/report/.test(sitemap), "sitemap must not include any /report route");
});

/** Strips comments so source assertions test executable code, not prose about it. */
function executableSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

/**
 * The result the form shows must come from a real check of the submitted
 * site — never from a timer, and never from stored sample data.
 *
 * The earlier version of this test forbade a network request entirely,
 * because at the time there was nothing to request and any call would have
 * been theatre. The check is now real, so the rule inverts: the form MUST
 * call the check endpoint, and must still not fake elapsed time or invent
 * progress it cannot observe. See Decision Log DOC-021.
 */
test("check form runs a real check and simulates nothing", () => {
  const source = executableSource("components/visibility/VisibilityCheckForm.tsx");
  assert.match(source, /fetch\("\/api\/checks"/, "form must call the live check endpoint");
  assert.ok(!/setTimeout|setInterval/.test(source), "form must not simulate elapsed scan time");
  assert.ok(!/percent|Math\.random/i.test(source), "form must not invent progress it cannot observe");
  assert.ok(
    !/getSampleReport|sample-report-data/.test(source),
    "the free result must never be backed by sample data",
  );
});

/** Lead capture must be an explicit opt-in, never implied (architecture §5.3). */
test("check form requires an explicit consent checkbox and links to the privacy page", () => {
  const source = executableSource("components/visibility/VisibilityCheckForm.tsx");
  assert.match(source, /name="consent"[\s\S]{0,200}type="checkbox"/, "consent must be a checkbox");
  assert.match(source, /copy\.privacyHref/, "consent must link to the privacy page");
  assert.match(source, /copy\.errors\.consent/, "missing consent must block submission");

  for (const { name, content } of LOCALES) {
    assert.ok(content.checkForm.privacyHref.startsWith("/"), `${name} privacy href`);
    assert.ok(content.checkForm.errors.consent.length > 0, `${name} consent error`);
  }
});

/** The promise made before submitting must be the promise kept after it. */
test("form copy promises an on-page result, not a review that arrives later", () => {
  assert.match(visibilityContentEn.checkForm.intro, /on this page/i);
  assert.match(visibilityContentEn.checkForm.fields.contactHint, /immediately/i);
  assert.match(visibilityContentRu.checkForm.intro, /на этой странице/i);
  assert.match(visibilityContentRu.checkForm.fields.contactHint, /сразу/i);

  // And it must not resurrect the manual-review promise it replaced.
  for (const { name, content } of LOCALES) {
    const serialized = JSON.stringify(content.checkForm);
    assert.ok(!/by hand|вручную|руками/i.test(serialized), `${name} still promises a manual review`);
  }
});

/** Every finding must carry a concrete fix, in both locales. */
test("live report copy labels both the fix and its honest limit", () => {
  for (const { name, content } of LOCALES) {
    assert.ok(content.liveReport.howToFixLabel.length > 0, `${name} how-to-fix label`);
    assert.ok(content.liveReport.doesNotProveLabel.length > 0, `${name} does-not-prove label`);
    assert.ok(content.liveReport.unreachable.body.length > 0, `${name} unreachable explanation`);
  }
  // A failed check must not read as a verdict on the visitor's site.
  assert.match(visibilityContentEn.liveReport.errors.generic, /not yours/i);
  assert.match(visibilityContentRu.liveReport.errors.generic, /не на вашей/i);
});

/** The visibility lead type must exist and require its fields server-side. */
test("visibility_check lead type is registered and server-side required fields are enforced", () => {
  const leads = readFileSync(join(process.cwd(), "lib/leads.ts"), "utf8");
  assert.match(leads, /"visibility_check"/, "visibility_check must be a registered lead type");

  const route = executableSource("app/api/leads/route.ts");
  const block = route.match(/visibility_check:\s*\[([\s\S]*?)\]/);
  assert.ok(block, "route must declare required fields for visibility_check");
  for (const field of ["contact", "website", "primaryAction"]) {
    assert.match(block![1], new RegExp(`"${field}"`), `required field ${field}`);
  }
  assert.match(route, /record\.consent !== true/, "route must reject submissions without consent");
});

/** TZ E — the sample report page collects no email either. */
test("sample report components collect no email", () => {
  const dir = join(process.cwd(), "components/visibility");
  const sampleSources = ["SampleReport.tsx", "EvidenceList.tsx", "ActionReadinessCard.tsx", "ActionPathTimeline.tsx"]
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .join("\n");
  assert.ok(!/type="email"/.test(sampleSources));
  assert.ok(!/fetch\(/.test(sampleSources));
});

/** Basic hygiene: every visibility page declares its own metadata. */
test("every visibility route declares unique title metadata", () => {
  const routes = [
    "app/visibility/page.tsx",
    "app/ru/visibility/page.tsx",
    "app/check/page.tsx",
    "app/ru/check/page.tsx",
    "app/methodology/page.tsx",
    "app/ru/methodology/page.tsx",
    "app/pricing/page.tsx",
    "app/ru/pricing/page.tsx",
    "app/report/sample/page.tsx",
    "app/ru/report/sample/page.tsx",
  ];
  const titles = new Set<string>();
  for (const route of routes) {
    const source = readFileSync(join(process.cwd(), route), "utf8");
    const match = source.match(/title:\s*"([^"]+)"/);
    assert.ok(match, `${route} must declare a title`);
    const title = match![1];
    assert.ok(!titles.has(title), `duplicate title "${title}" in ${route}`);
    titles.add(title);
  }
});

/** The existing /ru/ai-map route must remain present and untouched by this PR. */
test("legacy /ru/ai-map route still exists", () => {
  const path = join(process.cwd(), "app/ru/ai-map/page.tsx");
  assert.ok(statSync(path).isFile(), "/ru/ai-map must not be removed in PR-01");
  const appRu = readdirSync(join(process.cwd(), "app/ru"));
  assert.ok(appRu.includes("ai-map"));
});
