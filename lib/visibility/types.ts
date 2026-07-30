export type VisibilityLocale = "en" | "ru";

export type MetricDefinition = {
  name: string;
  definition: string;
};

export type MeasurementBoundaryContent = {
  heading: string;
  whatWeMeasure: string[];
  whatWeDontMeasure: string[];
};

/**
 * Intake for the free check. Deliberately short: the visitor gets a real
 * result on this page in exchange for a URL and a contact, so every extra
 * field is friction standing between them and the thing they came for.
 */
export type CheckFormCopy = {
  title: string;
  intro: string;
  fields: {
    website: string;
    websiteHint: string;
    primaryAction: string;
    primaryActionHint: string;
    contact: string;
    contactHint: string;
    contactPlaceholder: string;
  };
  /** Option labels keyed by the PrimaryAction union members. */
  primaryActionOptions: Record<string, string>;
  /** What the visitor gets, stated before they submit. */
  whatYouGet: { heading: string; items: string[] };
  /** Consent is an explicit opt-in and is never implied (SSOT §5.3). */
  consentLabel: string;
  consentLinkLabel: string;
  privacyHref: string;
  submitLabel: string;
  submittingLabel: string;
  errors: {
    website: string;
    primaryAction: string;
    contact: string;
    consent: string;
  };
  networkError: string;
};

/** Copy for the live result rendered on the page right after the check runs. */
export type LiveReportCopy = {
  running: { heading: string; steps: string[] };
  heading: string;
  checkedLabel: string;
  checkedAtLabel: string;
  pagesLabel: string;
  remainingLabel: string;
  goodHeading: string;
  goodIntro: string;
  goodEmpty: string;
  problemsHeading: string;
  problemsIntro: string;
  problemsEmpty: string;
  fixHeading: string;
  fixIntro: string;
  howToFixLabel: string;
  doesNotProveLabel: string;
  nextHeading: string;
  nextIntro: string;
  layersHeading: string;
  layersIntro: string;
  layerTitles: Record<string, string>;
  layerQuestions: Record<string, string>;
  scoreSuffix: string;
  notMeasuredLabel: string;
  layerPassedLabel: string;
  layerProblemsLabel: string;
  severityLabels: { critical: string; important: string; later: string };
  unreachable: { heading: string; body: string };
  errors: { rateLimited: string; generic: string };
  restartLabel: string;
  leadNote: string;
  cta: {
    heading: string;
    body: string;
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
  };
};

export type ProductPathStep = {
  title: string;
  description: string;
};

/** The four measurement layers (Codex Execution TZ V1.2, decision 11). */
export type MeasurementLayersContent = {
  eyebrow: string;
  headline: string;
  intro: string;
  layers: { id: string; title: string; question: string; description: string }[];
};

/** Human-ready / Machine-readable / Agent-executable definitions (decisions 12–13). */
export type ActionReadinessContent = {
  eyebrow: string;
  headline: string;
  intro: string;
  states: { id: string; label: string; definition: string; example: string; doesNotProve: string }[];
  caveat: string;
};

export type LocalBusinessModeContent = {
  eyebrow: string;
  headline: string;
  intro: string;
  mayInclude: string[];
  boundary: string;
};

export type NotClaimedContent = {
  heading: string;
  items: string[];
};

export type PricingPlanStatus = "beta" | "founding_soon" | "active";

export type PricingPlan = {
  name: string;
  price: string;
  statusLabel: string;
  status: PricingPlanStatus;
  description: string;
  href?: string;
  ctaLabel?: string;
};

export type PricingTrackContent = {
  title: string;
  intro: string;
  plans: PricingPlan[];
};

export type SampleReportContent = {
  badge: string;
  domain: string;
  brand: string;
  market: string;
  language: string;
  checkedLabel: string;
  checkedDate: string;
  methodologyLabel: string;
  promptSetLabel: string;
  sampleLabel: string;
  metrics: { label: string; value: string }[];
  disclaimer: string;
};

export type VisibilityFaqItem = { q: string; a: string };

export type VisibilityContent = {
  locale: VisibilityLocale;
  nav: {
    label: string;
  };
  homeTeaser: {
    eyebrow: string;
    headline: string;
    intro: string;
    formNote: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  hero: {
    eyebrow: string;
    title: string;
    intro: string;
  };
  metrics: MetricDefinition[];
  measurementBoundary: MeasurementBoundaryContent;
  measurementLayers: MeasurementLayersContent;
  actionReadiness: ActionReadinessContent;
  localBusinessMode: LocalBusinessModeContent;
  notClaimed: NotClaimedContent;
  productPath: {
    eyebrow: string;
    headline: string;
    intro: string;
    steps: ProductPathStep[];
  };
  methodology: {
    eyebrow: string;
    title: string;
    intro: string;
    evidenceKinds: { name: string; description: string }[];
    versioning: string;
    privacyBoundary: string;
    supported: string[];
    notYetSupported: string[];
  };
  checkForm: CheckFormCopy;
  liveReport: LiveReportCopy;
  pricing: {
    eyebrow: string;
    title: string;
    intro: string;
    tracks: PricingTrackContent[];
  };
  sampleReport: SampleReportContent;
  faq: VisibilityFaqItem[];
  cta: {
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
  };
};
