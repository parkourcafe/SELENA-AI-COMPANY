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

export type CheckFormCopy = {
  title: string;
  intro: string;
  fields: {
    website: string;
    brandName: string;
    market: string;
    language: string;
    category: string;
    competitor: string;
  };
  submitLabel: string;
  submittingLabel: string;
  errors: {
    website: string;
    brandName: string;
    market: string;
    language: string;
    category: string;
  };
  calibration: {
    heading: string;
    body: string;
    sampleReportLabel: string;
    auditLabel: string;
  };
  networkError: string;
};

export type ProductPathStep = {
  title: string;
  description: string;
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
