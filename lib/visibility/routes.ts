/**
 * Visibility route contract. Single source of truth for hreflang pairing
 * between the EN and RU Visibility pages (SSOT §6.2, §29).
 */
export const visibilityRoutes = {
  en: {
    visibility: "/visibility",
    check: "/check",
    methodology: "/methodology",
    pricing: "/pricing",
    sampleReport: "/report/sample",
    contact: "/en/contact",
  },
  ru: {
    visibility: "/ru/visibility",
    check: "/ru/check",
    methodology: "/ru/methodology",
    pricing: "/ru/pricing",
    sampleReport: "/ru/report/sample",
    contact: "/contact",
  },
} as const;

export function visibilityLanguages(key: keyof typeof visibilityRoutes.en) {
  return {
    "x-default": visibilityRoutes.en[key],
    en: visibilityRoutes.en[key],
    ru: visibilityRoutes.ru[key],
  };
}

/**
 * The site's locale convention treats bare root paths as Russian except
 * for a few explicit exceptions ("/", "/en/*"). These four Visibility
 * routes are new bare-root *English* pages, so Header/DocumentLanguage
 * need to recognize them explicitly instead of falling through to the
 * Russian default (SSOT §6.2 puts English Visibility at bare paths,
 * mirroring "/ru/ai-map" having no bare-root English sibling to clash with).
 */
const bareEnglishVisibilityPaths = [
  visibilityRoutes.en.visibility,
  visibilityRoutes.en.check,
  visibilityRoutes.en.methodology,
  visibilityRoutes.en.pricing,
  visibilityRoutes.en.sampleReport,
];

export function isBareEnglishVisibilityPath(pathname: string) {
  return bareEnglishVisibilityPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
