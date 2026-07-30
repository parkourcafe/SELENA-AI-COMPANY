import type { VisibilityContent } from "./types";
import { visibilityRoutes } from "./routes";

/**
 * English Visibility copy (SSOT §18, §29.5). Guardrails: no guaranteed
 * rankings, no "AI thinks about you" framing, no revenue-loss claims,
 * no overclaiming llms.txt or schema. Every measured thing states its
 * sample size and what it does not prove.
 */
export const visibilityContentEn: VisibilityContent = {
  locale: "en",
  nav: { label: "Visibility" },
  homeTeaser: {
    eyebrow: "New: Selena Visibility",
    headline: "See how search and AI systems can find, understand and represent your business.",
    intro:
      "A free, evidence-based check of your public pages, technical readiness and a limited, dated sample of AI answers — before you spend anything on fixing it.",
    formNote: "Free. Takes a few minutes. No credit card, no login.",
    primaryCta: { label: "Run a Free Visibility Check", href: visibilityRoutes.en.check },
    secondaryCta: { label: "Book an AI Audit", href: visibilityRoutes.en.contact },
  },
  hero: {
    eyebrow: "Selena Visibility",
    title: "Measure public readiness and a limited sample of AI answers.",
    intro:
      "Selena Visibility checks how your public pages, technical signals and brand entity read to search engines and to a dated, limited sample of AI assistants — then routes you to the right next step, whether that is tracking it yourself or having Selena Systems fix it.",
  },
  metrics: [
    {
      name: "Public Readiness",
      definition:
        "A deterministic 0-100 score built from access/indexability signals, machine-readable identity, offer and page clarity, and conversion path — every dimension shows what was actually measured.",
    },
    {
      name: "Entity Clarity",
      definition:
        "How consistently your brand, offer, audience, geography and proof are described across your homepage, metadata and structured data.",
    },
    {
      name: "AI Sample",
      definition:
        "How often your brand was mentioned in a limited, dated set of tracked AI answers — reported as a count, e.g. \"mentioned in 2 of 6 valid answers,\" never as a single invented percentage.",
    },
    {
      name: "Owned-Domain Citation Sample",
      definition:
        "How often a page on your own domain was cited as a source in that same sample of tracked AI answers.",
    },
    {
      name: "Conversion Path",
      definition:
        "Whether a visitor (human or machine-readable signal) can find a clear next step: contact, booking or a direct answer to a commercial question.",
    },
  ],
  measurementBoundary: {
    heading: "Evidence first.",
    whatWeMeasure: [
      "Publicly available pages",
      "Technical accessibility and indexability signals",
      "Structured identity and service clarity",
      "A limited, dated sample of AI responses",
      "Public links and citations returned by supported providers",
    ],
    whatWeDontMeasure: [
      "Every possible prompt",
      "Every user location or personal context",
      "Private analytics",
      "CRM conversions",
      "Revenue impact",
      "Guaranteed future recommendations",
      "Causality between one website change and one AI answer",
    ],
  },
  productPath: {
    eyebrow: "How it connects",
    headline: "A verified path from public evidence to action.",
    intro:
      "Selena Systems does not sell a score. Visibility is the diagnostic entry point into the same implementation ladder as everything else Selena Systems builds.",
    steps: [
      { title: "Free Visibility Check", description: "A one-time, evidence-based read of your public readiness and a limited AI sample." },
      { title: "Monitor / Growth", description: "Recurring measurement with a consistent prompt and market set, once these founding plans open." },
      { title: "AI Visibility Audit — $500", description: "Human-reviewed, deeper sample, competitor comparison and a 90-day plan." },
      { title: "7-Day Visibility Sprint — $4,000", description: "Fixes to crawl, entity consistency, page clarity and measurement setup." },
      { title: "AI Business OS — from $10,000", description: "When the gap is broader than visibility: intake, CRM, content and operations." },
    ],
  },
  methodology: {
    eyebrow: "Methodology",
    title: "What we measured, when, and what it does not prove.",
    intro:
      "Every result in a Selena Visibility report carries its evidence: what was checked, when it was checked, the sample size behind it, and the limits of what it can honestly claim.",
    evidenceKinds: [
      { name: "Observed", description: "Directly fetched from a public page: HTML, headers, structured data." },
      { name: "Provider", description: "Returned by a named AI-tracking or performance provider, with the provider and date recorded." },
      { name: "User-supplied", description: "Entered by you: brand name, target market, category, optional competitor." },
      { name: "Derived", description: "Calculated from other evidence, always referencing the source evidence IDs." },
      { name: "Generated explanation", description: "A plain-language summary of evidence — never the sole basis for a finding." },
      { name: "Unavailable", description: "Not measured. Shown as \"not measured,\" never treated as zero or as a failing score." },
    ],
    versioning:
      "Every report records a methodology version, check version, prompt-set version and scoring version. If the methodology changes, older reports are not silently recalculated with new rules.",
    privacyBoundary:
      "The check only reads publicly available pages. It does not log in, does not read private dashboards, and does not collect data from forms on the site being checked.",
    supported: [
      "Public page crawl (up to 5 pages)",
      "Indexability and structured-data checks",
      "PageSpeed performance evidence (when available)",
      "A limited, dated AI-answer sample across supported environments",
    ],
    notYetSupported: [
      "Live AI providers (in calibration — see the sample report)",
      "Google Search Console / GA4 connected data",
      "Recurring monitoring and history",
      "Human-reviewed reports",
    ],
  },
  checkForm: {
    title: "Run a Free Visibility Check",
    intro:
      "Tell us where to look. Market and language matter: an AI answer in English for a global search is not the same evidence as one in Russian for a local market.",
    fields: {
      website: "Website",
      brandName: "Brand name",
      market: "Target market / country",
      language: "Language",
      category: "Business category",
      competitor: "One competitor (optional)",
    },
    submitLabel: "Run Free Check",
    submittingLabel: "Checking...",
    errors: {
      website: "Enter your website address.",
      brandName: "Enter your brand name.",
      market: "Enter your target market or country.",
      language: "Choose a language.",
      category: "Enter your business category.",
    },
    calibration: {
      heading: "The live checker is being calibrated on Selena Systems projects.",
      body:
        "We are currently calibrating the automated check against Selena Systems' own portfolio before opening it publicly, so this submission was not sent anywhere and no scan ran. In the meantime you can see what a finished report looks like, or skip straight to a human-reviewed AI Audit.",
      sampleReportLabel: "View a sample report",
      auditLabel: "Book an AI Audit",
    },
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Track it yourself, or have Selena Systems fix it.",
    intro:
      "Founding prices below are a hypothesis, not a final rate card, and are marked as such until a plan is generally available.",
    tracks: [
      {
        title: "Track it yourself",
        intro: "Recurring measurement, once these plans open.",
        plans: [
          {
            name: "Free Check",
            price: "$0",
            status: "beta",
            statusLabel: "Coming through calibrated beta",
            description: "One-time public readiness score and a limited AI sample.",
          },
          {
            name: "Monitor",
            price: "$149/mo",
            status: "founding_soon",
            statusLabel: "Founding plan, not yet open",
            description: "Monthly run, 25 tracked prompts, up to 4 AI environments, history.",
          },
          {
            name: "Growth",
            price: "$349/mo",
            status: "founding_soon",
            statusLabel: "Founding plan, not yet open",
            description: "Up to 3 markets, 50 prompts, integrations, human-reviewed memo.",
          },
        ],
      },
      {
        title: "Have Selena Systems fix it",
        intro: "Human-reviewed implementation work, available now.",
        plans: [
          {
            name: "AI Audit",
            price: "$500",
            status: "active",
            statusLabel: "Available now",
            description: "Human-reviewed visibility audit with a 90-day prioritized plan.",
            href: visibilityRoutes.en.contact,
            ctaLabel: "Book an AI Audit",
          },
          {
            name: "AI Sprint",
            price: "$4,000",
            status: "active",
            statusLabel: "Available now",
            description: "A focused 7-day sprint fixing crawl, entity and conversion gaps.",
            href: visibilityRoutes.en.contact,
            ctaLabel: "Apply for the Sprint",
          },
          {
            name: "AI Business OS",
            price: "from $10,000",
            status: "active",
            statusLabel: "Available now",
            description: "For gaps broader than visibility: intake, CRM, content, operations.",
            href: visibilityRoutes.en.contact,
            ctaLabel: "Talk about Business OS",
          },
        ],
      },
    ],
  },
  sampleReport: {
    badge: "Sample report — illustrative data, not a live scan",
    domain: "example-selena-project.com",
    brand: "Sample Business",
    market: "United States",
    language: "English",
    checkedLabel: "Checked",
    checkedDate: "Sample date",
    methodologyLabel: "Methodology v1.0",
    promptSetLabel: "Prompt set: commercial-core-v1",
    sampleLabel: "Sample: 6 valid AI answers (illustrative)",
    metrics: [
      { label: "Public Readiness", value: "64 / 100" },
      { label: "Entity Clarity", value: "71 / 100" },
      { label: "AI Sample", value: "Mentioned in 2 of 6 valid answers" },
      { label: "Owned-Domain Citation Sample", value: "Cited in 1 of 6 valid answers" },
      { label: "Conversion Path", value: "Partial" },
    ],
    disclaimer:
      "This is a sample layout with illustrative numbers used to show the report format while the live checker is being calibrated. It is not a scan of any real website.",
  },
  faq: [
    {
      q: "Is this the same as \"what ChatGPT thinks about my business\"?",
      a: "No. We do not ask a chatbot for its opinion. We track a limited, dated set of specific prompts through named, supported environments and report exact counts — mentioned in X of Y valid answers — not a vibe.",
    },
    {
      q: "Will this guarantee AI recommends us?",
      a: "No tool can guarantee that. The check finds verifiable technical, entity and content gaps and shows a dated sample of current results. It does not promise future recommendations.",
    },
    {
      q: "Does having schema/structured data mean AI will quote us correctly?",
      a: "No. Structured data is machine-readable corroboration, not proof of future citation. We report it as present-and-valid or missing, nothing more.",
    },
    {
      q: "Is llms.txt required?",
      a: "No. It is an emerging, unproven convention. Its score weight in our methodology is zero, and we do not recommend it as a priority fix.",
    },
    {
      q: "What happens after I submit the free check?",
      a: "While the live checker is being calibrated on Selena Systems' own projects, submitting shows you a sample report and the option to book a human-reviewed AI Audit instead. Nothing is sent anywhere and no email is collected at this stage.",
    },
  ],
  cta: {
    primary: { label: "Run a Free Visibility Check", href: visibilityRoutes.en.check },
    secondary: { label: "Book an AI Audit", href: visibilityRoutes.en.contact },
  },
};
