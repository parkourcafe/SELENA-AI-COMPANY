/**
 * The 8 productized service modules (developer TZ §10).
 * Copy is Russian, concrete, and honest — no fake metrics or guarantees.
 */

export type Service = {
  id: string;
  /** Short editorial number shown on the card, e.g. "01". */
  index: string;
  name: string;
  /** One-line outcome/promise. */
  promise: string;
  /** 2–4 concrete deliverables the client receives. */
  included: string[];
  /** Who this fits. */
  audience: string;
  /** Where the CTA leads (a dedicated page if one exists, else the brief). */
  href: string;
  ctaLabel: string;
};

export const services: Service[] = [
  {
    id: "audit",
    index: "01",
    name: "AI-аудит",
    promise:
      "Разбираем процессы и находим задачи, где AI реально экономит время, а не добавляет хаоса.",
    included: [
      "Карта повторяющихся задач и узких мест",
      "3–5 приоритетных AI-сценариев с оценкой усилий",
      "Понятный план: с чего начать первым",
    ],
    audience: "Тем, кто чувствует пользу AI, но не знает, с чего начать.",
    href: "/contact",
    ctaLabel: "Хочу AI-аудит",
  },
  {
    id: "training",
    index: "02",
    name: "AI-обучение",
    promise:
      "Учим предпринимателя и команду использовать AI в реальных рабочих задачах, а не в теории.",
    included: [
      "Практические сессии на ваших задачах",
      "Библиотека проверенных промптов под ваши процессы",
      "Инструкции, чтобы команда работала одинаково",
    ],
    audience: "Командам, где каждый использует AI по-своему и с разным результатом.",
    href: "/ai-training",
    ctaLabel: "Хочу обучение",
  },
  {
    id: "automation",
    index: "03",
    name: "AI-автоматизация",
    promise:
      "Собираем no-code сценарии, которые убирают ручную рутину в заявках, коммуникациях и данных.",
    included: [
      "Связки на Make / Zapier и Telegram / WhatsApp",
      "Автоответы и черновики на частые обращения",
      "Передача данных между CRM, Notion и таблицами",
    ],
    audience: "Бизнесу, где заявки и сообщения обрабатываются вручную.",
    href: "/ai-automation",
    ctaLabel: "Хочу автоматизацию",
  },
  {
    id: "content",
    index: "04",
    name: "AI-контент-система",
    promise:
      "Превращаем один экспертный материал в набор форматов без выгорания и хаотичных рывков.",
    included: [
      "Контент-система: один материал → несколько форматов",
      "Шаблоны и промпты под ваш стиль и темы",
      "Процесс с редактурой и human review",
    ],
    audience: "Экспертам и брендам, которые ведут контент рывками.",
    href: "/ai-content",
    ctaLabel: "Собрать контент-систему",
  },
  {
    id: "concierge",
    index: "05",
    name: "AI-консьерж",
    promise:
      "Выносим типовые вопросы клиентов в первый AI-сценарий с обязательным human review перед запуском.",
    included: [
      "Сбор частых вопросов: цены, запись, адрес, формат",
      "Сценарий ответов для Telegram / WhatsApp",
      "Правила, когда подключается человек",
    ],
    audience: "Сервисному бизнесу, где админ отвечает на одно и то же.",
    href: "/contact",
    ctaLabel: "Хочу AI-консьержа",
  },
  {
    id: "knowledge",
    index: "06",
    name: "AI-база знаний",
    promise:
      "Собираем знания команды в одну структуру, чтобы AI и люди отвечали из единого источника.",
    included: [
      "Структура базы в Notion или удобном инструменте",
      "Единые промпты и регламенты для команды",
      "Понятный доступ и порядок обновления",
    ],
    audience: "Командам, где знания разбросаны по чатам и головам.",
    href: "/contact",
    ctaLabel: "Собрать базу знаний",
  },
  {
    id: "packaging",
    index: "07",
    name: "AI-упаковка",
    promise:
      "Помогаем упаковать продукт или личный бренд с помощью AI — от структуры смыслов до материалов.",
    included: [
      "Структура продукта и ключевых смыслов",
      "Черновики страниц, описаний и офферов",
      "Материалы, готовые к финальной редактуре",
    ],
    audience: "Экспертам и личным брендам на этапе упаковки.",
    href: "/ai-content",
    ctaLabel: "Хочу упаковку",
  },
  {
    id: "support",
    index: "08",
    name: "AI-сопровождение",
    promise:
      "Поддерживаем систему после запуска: тестируем, дорабатываем сценарии и обучаем новых людей.",
    included: [
      "Регулярный разбор, что работает и что нет",
      "Доработка сценариев и промптов",
      "Обучение новых сотрудников работе с системой",
    ],
    audience: "Тем, кто уже внедрил AI и хочет, чтобы он не разваливался.",
    href: "/contact",
    ctaLabel: "Хочу сопровождение",
  },
];

export const getService = (id: string) => services.find((s) => s.id === id);
