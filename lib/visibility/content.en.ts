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
    headline:
      "See how search and AI systems can find, understand and represent your business — and whether a customer or agent can complete the next action.",
    intro:
      "A free, evidence-based check of your public pages, technical readiness, a limited dated sample of AI answers, and whether your primary action is actually completable.",
    formNote: "Free. Takes a few minutes. No credit card, no login.",
    primaryCta: { label: "Run Free Visibility Check", href: visibilityRoutes.en.check },
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
  measurementLayers: {
    eyebrow: "What is measured",
    headline: "Four separate layers, reported separately.",
    intro:
      "Each layer answers a different question and is reported on its own evidence. They are never collapsed into one universal score — a business can be perfectly discoverable and still be impossible to act on.",
    layers: [
      {
        id: "discoverability",
        title: "Discoverability",
        question: "Can public search and AI systems access and find the business?",
        description:
          "Reachability, crawler access, sitemap, canonical and indexability signals — read from public pages only.",
      },
      {
        id: "understanding",
        title: "Understanding",
        question: "Can they understand who the business is, what it offers, for whom and where?",
        description:
          "Brand consistency, service clarity, market and location clarity, structured-data evidence and direct-answer coverage.",
      },
      {
        id: "recommendation_evidence",
        title: "Recommendation Evidence",
        question: "Is the brand mentioned or cited in a limited, disclosed sample?",
        description:
          "Reported as ratios — mentioned in X of Y sampled answers, cited in X of Y — with the prompt set, environments and date disclosed.",
      },
      {
        id: "action_readiness",
        title: "Action Readiness",
        question: "Can a customer, or an agent acting for them, complete the next action?",
        description:
          "Measured as three independent states: human-ready, machine-readable and agent-executable.",
      },
    ],
  },
  actionReadiness: {
    eyebrow: "Action Readiness",
    headline: "Three independent states, not one checkbox.",
    intro:
      "Most sites are built for a human with a mouse. Increasingly, the visitor is an assistant acting on someone's behalf. These are different capabilities and we measure them separately.",
    states: [
      {
        id: "human_ready",
        label: "Human-ready",
        definition: "A person can find and complete the intended action unaided.",
        example: "A visible, reachable booking button that works on mobile.",
        doesNotProve: "Does not prove a machine can parse the action, or that an agent could execute it.",
      },
      {
        id: "machine_readable",
        label: "Machine-readable",
        definition: "The action and its parameters are exposed in structured, parseable form.",
        example: "Structured action markup that names the required inputs.",
        doesNotProve: "Markup being present does not prove the action can actually be completed programmatically.",
      },
      {
        id: "agent_executable",
        label: "Agent-executable",
        definition:
          "An autonomous agent can complete the action end to end and receive a confirmation it can verify.",
        example: "A documented endpoint plus a machine-verifiable confirmation.",
        doesNotProve: "This is the strictest state and is the one most often assumed without evidence.",
      },
    ],
    caveat:
      "A visible button, a WhatsApp link or a block of JSON-LD is not, by itself, proof of agent execution. We report what each state actually demonstrates and nothing beyond it.",
  },
  localBusinessMode: {
    eyebrow: "Local Business Mode",
    headline: "A profile of the same engine, not a separate scanner.",
    intro:
      "When the business model is local or hospitality, the same four layers are applied with location-aware expectations. It is a configuration, not a different product.",
    mayInclude: [
      "Website evidence, as in every other mode",
      "Location and service-area clarity",
      "Opening hours as published on the site",
      "Contact, booking and ordering paths",
      "Later, and only with verified provider capability: Google Business Profile and Maps facts",
    ],
    boundary:
      "No Google Business Profile or Maps integration exists in this version. Nothing in a report is sourced from those services today, and none is implied.",
  },
  notClaimed: {
    heading: "What this product does not claim",
    items: [
      "It does not claim to know what any AI system \"thinks\" about a business.",
      "It does not guarantee rankings, citations or recommendations.",
      "It does not estimate lost revenue — that needs your analytics, conversion data and an explicit model.",
      "It does not treat llms.txt as a ranking factor; its weight is zero.",
      "It does not present a generic model API response as a consumer ChatGPT or Search result.",
      "It does not claim complete AI visibility — every sample is limited, dated and disclosed.",
    ],
  },
  productPath: {
    eyebrow: "How it connects",
    headline: "A verified path from public evidence to action.",
    intro:
      "Selena Systems does not sell a score. Visibility is the diagnostic entry point into the same implementation ladder as everything else Selena Systems builds.",
    steps: [
      { title: "Free Visibility Check", description: "A one-time, evidence-based read of your public readiness and a limited AI sample." },
      { title: "Monitor — $9/month", description: "Fully automated: 5 tracked prompts, 2 AI environments, 1 competitor, one scheduled run a month, 12 months of history. No human review." },
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
    title: "See how AI reads your site",
    intro:
      "Enter your address, tell us what a customer should do there, and leave a contact. The check runs on this page against your live site — you get the findings and the fixes right here, not a promise of a report later.",
    fields: {
      website: "Your website address",
      websiteHint: "We fetch your public pages only — the homepage and, if they are linked, a service page and an about page.",
      primaryAction: "What should a customer do on your site?",
      primaryActionHint: "This is what the Action Readiness layer is measured against.",
      contact: "Phone / WhatsApp",
      contactHint:
        "The result appears on this page immediately. The contact is how we reach you about what the check found — nothing is sent before you press the button.",
      contactPlaceholder: "+62 812 3456 7890",
    },
    primaryActionOptions: {
      call: "Call",
      whatsapp: "Message on WhatsApp",
      book: "Book",
      order: "Order",
      request_quote: "Request a quote",
      schedule_demo: "Schedule a demo",
      apply: "Apply",
      visit: "Visit in person",
      other: "Other",
    },
    whatYouGet: {
      heading: "What you get, on this page, in under a minute",
      items: [
        "What your site already does well for machine readers",
        "What blocks them, ordered by how much it costs you",
        "The one thing to fix first, and exactly how to fix it",
        "What the free check cannot see — stated, not hidden",
      ],
    },
    consentLabel: "I agree to be contacted about this check on the number I left —",
    consentLinkLabel: "how data is handled",
    privacyHref: "/en/privacy",
    submitLabel: "Check my site",
    submittingLabel: "Checking your site...",
    errors: {
      website: "Enter your website address.",
      primaryAction: "Choose the action a customer should complete.",
      contact: "Leave a phone or WhatsApp number.",
      consent: "Consent is required before the check can run.",
    },
    networkError: "The check could not be started. Try again in a minute.",
  },
  liveReport: {
    running: {
      heading: "Reading your site the way a machine does",
      steps: [
        "Fetching the homepage",
        "Looking for a service page, an about page and a sitemap",
        "Reading titles, headings and structured data",
        "Checking whether your primary action can be found and understood",
      ],
    },
    heading: "How AI reads your site",
    checkedLabel: "Checked",
    checkedAtLabel: "Run at",
    pagesLabel: "Pages read",
    remainingLabel: "Free checks left this hour",
    goodHeading: "What already works",
    goodIntro: "Machine readers found these on your site. Keep them.",
    goodEmpty:
      "Nothing in this layer passed. That is unusual and normally means the page could not be read properly rather than that every single signal is missing.",
    problemsHeading: "What gets in the way",
    problemsIntro:
      "Ordered by cost to you, not by how easy they are to fix. Critical items change whether you can be found and understood at all.",
    problemsEmpty: "No blocking issues were found in what the free check can see.",
    fixHeading: "Fix this first",
    fixIntro: "One thing, chosen because it blocks the most downstream.",
    howToFixLabel: "How to fix it",
    doesNotProveLabel: "What fixing it does not prove",
    nextHeading: "Then these",
    nextIntro: "The next items in order, with the concrete change for each.",
    layersHeading: "The four layers in full",
    layersIntro:
      "Three of them are measured here from your public pages. The fourth needs a contracted AI-answer provider, so it is left unmeasured rather than shown as a zero.",
    layerTitles: {
      discoverability: "Discoverability",
      understanding: "Understanding",
      recommendation_evidence: "Recommendation evidence",
      action_readiness: "Action readiness",
    },
    layerQuestions: {
      discoverability: "Can a machine reach and read your pages at all?",
      understanding: "Once read, is it clear who you are and what you sell?",
      recommendation_evidence: "Do AI answers actually mention or cite you?",
      action_readiness: "Can the customer — and a machine — complete your primary action?",
    },
    scoreSuffix: "/ 100",
    notMeasuredLabel: "Not measured",
    layerPassedLabel: "working",
    layerProblemsLabel: "to fix",
    severityLabels: {
      critical: "Critical",
      important: "Important",
      later: "Later",
    },
    unreachable: {
      heading: "Your site could not be reached",
      body:
        "Nothing was measured, so nothing is being reported. This usually means the address is wrong, the server refused the request, or bot protection blocked a well-behaved crawler — the last one is itself worth knowing, because AI crawlers hit the same wall.",
    },
    errors: {
      rateLimited:
        "The free check is limited to five runs per hour from one address. Try again later, or get in touch and we will run it with you.",
      generic:
        "The check failed on our side, not yours. Nothing about your site is implied by this — try again in a minute.",
    },
    restartLabel: "Check another site",
    leadNote:
      "This result was also sent to the Selena Systems team along with the number you left, so we can follow up on what it found.",
    cta: {
      heading: "Want the layer this check cannot measure?",
      body:
        "The free check reads your public pages. Whether AI answers actually name you needs a contracted provider and a dated prompt set — that is what the paid audit adds, along with the work of fixing what is above.",
      primary: { label: "Book an AI Audit", href: visibilityRoutes.en.contact },
      secondary: {
        label: "See what a full report looks like",
        href: visibilityRoutes.en.sampleReport,
      },
    },
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Track it yourself, or have Selena Systems fix it.",
    intro:
      "Monitor is a low-friction, fully automated continuation of the free report — not a substitute for human-reviewed implementation work. Checkout is not yet open.",
    tracks: [
      {
        title: "Track changes automatically",
        intro: "Fully automated. No human review, no onboarding call — that starts with the Audit.",
        plans: [
          {
            name: "Free Visibility Check",
            price: "$0",
            status: "beta",
            statusLabel: "Calibrated sample in this release",
            description:
              "Discoverability, Understanding, Recommendation Evidence and Action Readiness across the four layers.",
          },
          {
            name: "Monitor",
            price: "$9/month · $90/year",
            status: "beta",
            statusLabel: "Checkout not open",
            description:
              "Fully automated. 1 website · 1 market · 1 language · 5 tracked prompts · up to 2 supported AI environments when live · 1 competitor · 1 automated run/month · 12-month history · automated monthly summary. No human analysis or implementation.",
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
