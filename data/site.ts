export const site = {
  name: "KORA",
  title: "KORA — AI-внедрение и обучение для бизнеса без хаоса",
  description:
    "KORA помогает русскоязычным предпринимателям, экспертам и небольшим командам внедрять AI в контент, клиентские коммуникации, CRM, Telegram/WhatsApp, Notion, Make/Zapier и рабочие процессы. Сначала задача и процесс — потом инструмент.",
  locale: "ru_RU",
  // TODO: заменить на реальный production-домен перед запуском.
  url: "https://kora-ai.example",
} as const;

export const nav = [
  { label: "Услуги", href: "/services" },
  { label: "Обучение", href: "/ai-training" },
  { label: "Автоматизация", href: "/ai-automation" },
  { label: "Контент", href: "/ai-content" },
  { label: "Обо мне", href: "/about" },
  { label: "Связаться", href: "/contact" },
] as const;

export const cta = {
  primary: "Разобрать мою задачу",
  primaryShort: "Разобрать задачу",
  secondary: "Посмотреть услуги",
  brief: "Заполнить бриф",
} as const;
