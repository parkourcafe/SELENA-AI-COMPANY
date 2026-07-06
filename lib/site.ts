/**
 * Site-wide configuration: brand, navigation, CTAs, contact channels.
 * Single source of truth for links and labels used across the site.
 */

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://selena-ai-company.vercel.app";

export const site = {
  name: "KORA AI",
  // Public-facing tagline (Russian only, per CLAUDE.md).
  tagline: "AI-внедрение, автоматизация и обучение для бизнеса",
  description:
    "Помогаю русскоязычным предпринимателям, экспертам и небольшим командам находить повторяющиеся задачи, внедрять AI-сценарии, автоматизации, AI-консьержей и контент-системы без сложного кода.",
  // Used for canonical/OG/sitemap. Override with NEXT_PUBLIC_SITE_URL on custom domains.
  url: siteUrl,
  locale: "ru_RU",
} as const;

/** Primary and secondary conversion labels (reused everywhere). */
export const cta = {
  primary: { label: "Получить AI-карту возможностей", href: "/free-ai-map" },
  secondary: { label: "Посмотреть услуги", href: "/services" },
  calculator: { label: "Посчитать рутину", href: "/#calculator" },
  brief: { label: "Заполнить мини-бриф", href: "/free-ai-map" },
  short: { label: "Получить AI-карту", href: "/free-ai-map" },
  contact: { label: "Связаться", href: "/contact" },
} as const;

/** Main navigation (desktop + mobile). */
export const nav: { label: string; href: string }[] = [
  { label: "Услуги", href: "/services" },
  { label: "Обучение", href: "/ai-training" },
  { label: "Автоматизация", href: "/ai-automation" },
  { label: "AI-карта", href: "/free-ai-map" },
  { label: "Обо мне", href: "/about" },
  { label: "Контакты", href: "/contact" },
];

/**
 * Contact channels. Left null on purpose — do NOT invent real handles.
 * The founder fills these in before launch. While null, the UI routes
 * people through the structured brief (/contact) instead of dead links.
 * TODO(launch): set real Telegram / WhatsApp / email values.
 */
export const contact: {
  telegram: string | null;
  whatsapp: string | null;
  email: string | null;
} = {
  telegram: null,
  whatsapp: null,
  email: null,
};

export const footerNote =
  "KORA AI — практическое внедрение AI в бизнес-процессы. Сначала задача и процесс, потом инструмент.";
