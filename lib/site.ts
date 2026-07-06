/**
 * Site-wide configuration: brand, navigation, CTAs, contact channels.
 * Single source of truth for links and labels used across the site.
 */

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://selena-ai-company.vercel.app";

export const site = {
  name: "KORA",
  // Public-facing tagline (Russian only, per CLAUDE.md).
  tagline: "AI-внедрение и обучение для бизнеса без хаоса и сложного кода",
  description:
    "KORA помогает русскоязычным предпринимателям, экспертам и небольшим командам внедрять AI в контент, коммуникации, CRM и рабочие процессы — через диагностику, обучение, автоматизацию и внедрение.",
  // Used for canonical/OG/sitemap. Override with NEXT_PUBLIC_SITE_URL on custom domains.
  url: siteUrl,
  locale: "ru_RU",
} as const;

/** Primary and secondary conversion labels (reused everywhere). */
export const cta = {
  primary: { label: "Разобрать мою задачу", href: "/contact" },
  secondary: { label: "Посмотреть услуги", href: "/services" },
  brief: { label: "Заполнить бриф", href: "/contact" },
  short: { label: "Разобрать задачу", href: "/contact" },
} as const;

/** Main navigation (desktop + mobile). */
export const nav: { label: string; href: string }[] = [
  { label: "Услуги", href: "/services" },
  { label: "Обучение", href: "/ai-training" },
  { label: "Автоматизация", href: "/ai-automation" },
  { label: "Контент", href: "/ai-content" },
  { label: "Обо мне", href: "/about" },
  { label: "Связаться", href: "/contact" },
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
  "KORA — практическое внедрение AI в бизнес-процессы. Сначала задача и процесс, потом инструмент.";
