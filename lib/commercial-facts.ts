/**
 * One versioned source of public commercial facts for Selena Systems.
 *
 * Customer-facing copy, structured data and illustrative routing import
 * values from here. Historical paid orders remain governed by the immutable
 * catalog snapshot stored in the client application.
 */
export const COMMERCIAL_FACTS_VERSION = "selena-commercial-facts-2026-08-16-v1" as const;

type FixedOffer = {
  amount: number;
  currency: "USD";
  en: string;
  ru: string;
};

type FromOffer = FixedOffer & { qualifier: "from" };

export const commercialFacts = {
  version: COMMERCIAL_FACTS_VERSION,
  seller: {
    legalName: "PT Izi Jiza Bali",
    country: "Indonesia",
  },
  aiSystems: {
    miniAudit: { amount: 100, currency: "USD", en: "$100", ru: "$100" },
    audit: { amount: 500, currency: "USD", en: "$500", ru: "$500" },
    sprint: { amount: 4_500, currency: "USD", en: "$4,500", ru: "$4,500" },
    businessOs: {
      amount: 10_000,
      currency: "USD",
      qualifier: "from",
      en: "from $10,000",
      ru: "от $10,000",
    } as FromOffer,
  },
  aiVisibility: {
    snapshot: { amount: 49, currency: "USD", en: "$49/month", ru: "$49/месяц" },
    landscape: { amount: 79, currency: "USD", en: "$79/month", ru: "$79/месяц" },
    expertVerified: { amount: 399, currency: "USD", en: "$399 one-time", ru: "$399 разово" },
    implementation90Days: { amount: 2_490, currency: "USD", en: "$2,490", ru: "$2 490" },
  },
} as const satisfies {
  version: typeof COMMERCIAL_FACTS_VERSION;
  seller: { legalName: string; country: string };
  aiSystems: {
    miniAudit: FixedOffer;
    audit: FixedOffer;
    sprint: FixedOffer;
    businessOs: FromOffer;
  };
  aiVisibility: Record<string, FixedOffer>;
};

export function amountForStructuredData(offer: FixedOffer): string {
  return String(offer.amount);
}
