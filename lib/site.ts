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

function cleanPublicEnv(value: string | undefined) {
  const next = value?.trim();
  return next ? next : null;
}

function toTelegramHref(value: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.replace(/^@/, "").trim();
  return handle ? `https://t.me/${handle}` : null;
}

function toWhatsappHref(value: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const phone = value.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return phone ? `https://wa.me/${phone}` : null;
}

function toEmailHref(value: string | null) {
  if (!value) return null;
  if (value.startsWith("mailto:")) return value;
  return value.includes("@") ? `mailto:${value}` : null;
}

const defaultPublicContact = {
  whatsapp: "89219331113",
} as const;

/** Public contact channels. Set these with NEXT_PUBLIC_CONTACT_* env vars. */
export const contact = {
  telegram: cleanPublicEnv(process.env.NEXT_PUBLIC_CONTACT_TELEGRAM),
  whatsapp:
    cleanPublicEnv(process.env.NEXT_PUBLIC_CONTACT_WHATSAPP) ??
    defaultPublicContact.whatsapp,
  email: cleanPublicEnv(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
} as const;

export const contactLinks = {
  telegram: toTelegramHref(contact.telegram),
  whatsapp: toWhatsappHref(contact.whatsapp),
  email: toEmailHref(contact.email),
} as const;

export type ContactChannel = {
  key: "telegram" | "whatsapp" | "email";
  label: string;
  value: string;
  href: string;
};

export const contactChannels = [
  {
    key: "telegram",
    label: "Telegram",
    value: contact.telegram,
    href: contactLinks.telegram,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    value: contact.whatsapp,
    href: contactLinks.whatsapp,
  },
  {
    key: "email",
    label: "Email",
    value: contact.email,
    href: contactLinks.email,
  },
].filter((channel): channel is ContactChannel => Boolean(channel.value && channel.href));

export const footerNote =
  "KORA AI — практическое внедрение AI в бизнес-процессы. Сначала задача и процесс, потом инструмент.";
