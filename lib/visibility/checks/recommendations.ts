import type { VisibilityLocale } from "../types";
import type { ReadinessEvidence, ReadinessEvidenceKey } from "./actionReadiness";

/**
 * One concrete fix per rule (V1.2: the report must say not only what is
 * wrong, but what to do about it). Every recommendation states an action
 * the owner can actually take — never "improve your AI visibility".
 */

export type Severity = "critical" | "important" | "later";

export interface Recommendation {
  severity: Severity;
  title: string;
  action: string;
  /** The honest limit — what fixing this does and does not achieve. */
  doesNotProve: string;
}

type RuleId = string;

const EN: Record<RuleId, Recommendation> = {
  "access.fetchable": {
    severity: "critical",
    title: "The page could not be fetched cleanly",
    action:
      "Check that the homepage returns HTTP 200 over HTTPS without a redirect chain, and that bot protection is not blocking well-behaved crawlers.",
    doesNotProve: "A clean fetch does not prove the page is indexed or used by any AI system.",
  },
  "access.noindex": {
    severity: "critical",
    title: "The page asks search engines not to index it",
    action:
      "Remove the noindex directive from the meta robots tag and the X-Robots-Tag header on pages you want discovered.",
    doesNotProve: "Removing noindex does not by itself cause indexing or recommendation.",
  },
  "access.canonical": {
    severity: "important",
    title: "No canonical URL is declared",
    action:
      "Add a self-referencing canonical link on the homepage so machines know which URL is authoritative.",
    doesNotProve: "A canonical tag is a hint, not a guarantee of which URL gets used.",
  },
  "access.viewport": {
    severity: "important",
    title: "No mobile viewport is declared",
    action: "Add a viewport meta tag so the page renders correctly on phones.",
    doesNotProve: "A viewport tag does not make the layout itself usable — check it on a real phone.",
  },
  "access.sitemap_discovered": {
    severity: "later",
    title: "No sitemap.xml was found",
    action:
      "Publish a sitemap.xml listing your canonical URLs and reference it from robots.txt.",
    doesNotProve: "A sitemap does not force indexing; it only makes discovery easier.",
  },
  "identity.jsonld_valid": {
    severity: "important",
    title: "Structured data is missing or does not parse",
    action:
      "Add valid JSON-LD, or fix the syntax error in the existing block so it can be read at all.",
    doesNotProve: "Valid schema is machine-readable corroboration — it is not a ranking or citation factor.",
  },
  "identity.jsonld_entity_present": {
    severity: "important",
    title: "No Organization or LocalBusiness entity is declared",
    action:
      "Add an Organization (or LocalBusiness) JSON-LD block with name, url, logo and sameAs links to your real profiles.",
    doesNotProve: "Declaring an entity does not prove any system will use it to describe you.",
  },
  "identity.brand_name_consistent": {
    severity: "critical",
    title: "The brand name is inconsistent across surfaces",
    action:
      "Pick one canonical brand name and use it identically in the page title, the H1 and the structured data.",
    doesNotProve: "Consistency does not prove an AI engine will name the brand correctly.",
  },
  "offer.title_present": {
    severity: "critical",
    title: "The page has no usable title",
    action: "Write a title that names the business and what it actually sells, in under 60 characters.",
    doesNotProve: "A good title does not by itself change how any AI system answers.",
  },
  "offer.single_h1": {
    severity: "important",
    title: "The page does not have exactly one H1",
    action:
      "Use a single H1 that states the primary offer. Demote the rest to H2 so the hierarchy is unambiguous.",
    doesNotProve: "Heading structure is a clarity signal, not a guarantee of comprehension.",
  },
  "offer.service_page_discovered": {
    severity: "critical",
    title: "No dedicated service or product page was discoverable",
    action:
      "Publish a page describing the primary offer and link it directly from the homepage navigation.",
    doesNotProve: "Its existence does not prove it will be found or cited.",
  },
  "conversion.contact_path_present": {
    severity: "critical",
    title: "No clear contact path was found",
    action:
      "Put a direct contact method — phone, WhatsApp, email or a form — in the header or above the fold.",
    doesNotProve: "A visible contact path proves human readiness only, not agent execution.",
  },
  "conversion.about_page_discovered": {
    severity: "later",
    title: "No About page was discoverable",
    action: "Publish an About page describing who runs the business, and link it from the homepage.",
    doesNotProve: "An About page supports trust signals; it does not establish authority by itself.",
  },
  "action.human_ready": {
    severity: "critical",
    title: "A customer cannot easily complete the primary action",
    action:
      "Make the chosen primary action reachable in one step from the homepage, with the required inputs stated before the flow starts.",
    doesNotProve: "Human readiness says nothing about whether a machine or agent can complete the same action.",
  },
  "action.machine_readable": {
    severity: "important",
    title: "The primary action is not exposed in structured form",
    action:
      "Describe the action in JSON-LD — for a booking, a ReserveAction or Reservation with the parameters it needs.",
    doesNotProve: "Structured markup does not prove the action can actually be completed programmatically.",
  },
  "action.agent_executable": {
    severity: "later",
    title: "An agent cannot complete the action end to end",
    action:
      "If agent traffic matters to you, expose a documented endpoint with a schema.org potentialAction / EntryPoint and return a machine-verifiable confirmation.",
    doesNotProve:
      "Most sites fail this today. It is a forward-looking capability, not a current ranking factor — treat it as optional unless agent traffic is part of your strategy.",
  },
};

const RU: Record<RuleId, Recommendation> = {
  "access.fetchable": {
    severity: "critical",
    title: "Страницу не удалось корректно загрузить",
    action:
      "Проверьте, что главная отдаёт HTTP 200 по HTTPS без цепочки редиректов и что защита от ботов не блокирует добросовестные краулеры.",
    doesNotProve: "Успешная загрузка не доказывает, что страница проиндексирована или используется AI.",
  },
  "access.noindex": {
    severity: "critical",
    title: "Страница просит поисковые системы её не индексировать",
    action:
      "Уберите директиву noindex из meta robots и заголовка X-Robots-Tag на страницах, которые должны находиться.",
    doesNotProve: "Снятие noindex само по себе не вызывает индексацию или рекомендацию.",
  },
  "access.canonical": {
    severity: "important",
    title: "Не объявлен canonical URL",
    action:
      "Добавьте самоссылающийся canonical на главной, чтобы машинам был понятен основной адрес страницы.",
    doesNotProve: "Canonical — это подсказка, а не гарантия того, какой URL будет использован.",
  },
  "access.viewport": {
    severity: "important",
    title: "Не объявлен мобильный viewport",
    action: "Добавьте meta viewport, чтобы страница корректно отображалась на телефонах.",
    doesNotProve: "Тег viewport не делает саму вёрстку удобной — проверьте на реальном телефоне.",
  },
  "access.sitemap_discovered": {
    severity: "later",
    title: "Не найден sitemap.xml",
    action: "Опубликуйте sitemap.xml с каноническими URL и сошлитесь на него из robots.txt.",
    doesNotProve: "Sitemap не заставляет индексировать — он только облегчает обнаружение.",
  },
  "identity.jsonld_valid": {
    severity: "important",
    title: "Структурированные данные отсутствуют или не разбираются",
    action: "Добавьте валидный JSON-LD или исправьте синтаксическую ошибку в существующем блоке.",
    doesNotProve:
      "Валидная schema — машиночитаемое подтверждение, а не фактор ранжирования или цитирования.",
  },
  "identity.jsonld_entity_present": {
    severity: "important",
    title: "Не объявлена сущность Organization или LocalBusiness",
    action:
      "Добавьте блок JSON-LD Organization (или LocalBusiness) с name, url, logo и sameAs на ваши реальные профили.",
    doesNotProve: "Объявление сущности не доказывает, что её используют для описания вас.",
  },
  "identity.brand_name_consistent": {
    severity: "critical",
    title: "Название бренда несогласовано между поверхностями",
    action:
      "Выберите одно каноничное название и используйте его одинаково в title, H1 и структурированных данных.",
    doesNotProve: "Согласованность не доказывает, что AI-система назовёт бренд правильно.",
  },
  "offer.title_present": {
    severity: "critical",
    title: "У страницы нет пригодного title",
    action: "Напишите title, который называет бизнес и то, что он продаёт, в пределах 60 символов.",
    doesNotProve: "Хороший title сам по себе не меняет то, как отвечает AI-система.",
  },
  "offer.single_h1": {
    severity: "important",
    title: "На странице не ровно один H1",
    action:
      "Оставьте один H1 с основным предложением, остальные заголовки понизьте до H2 — иерархия станет однозначной.",
    doesNotProve: "Структура заголовков — сигнал ясности, а не гарантия понимания.",
  },
  "offer.service_page_discovered": {
    severity: "critical",
    title: "Не найдена отдельная страница услуги или продукта",
    action:
      "Опубликуйте страницу с описанием основного предложения и дайте на неё прямую ссылку из навигации на главной.",
    doesNotProve: "Её существование не доказывает, что её найдут или процитируют.",
  },
  "conversion.contact_path_present": {
    severity: "critical",
    title: "Не найден понятный путь к контакту",
    action:
      "Разместите прямой способ связи — телефон, WhatsApp, email или форму — в шапке или в первом экране.",
    doesNotProve: "Видимый контакт доказывает только готовность для человека, но не выполнение агентом.",
  },
  "conversion.about_page_discovered": {
    severity: "later",
    title: "Не найдена страница «О нас»",
    action: "Опубликуйте страницу о том, кто стоит за бизнесом, и сошлитесь на неё с главной.",
    doesNotProve: "Страница «О нас» поддерживает доверие, но сама по себе не создаёт экспертность.",
  },
  "action.human_ready": {
    severity: "critical",
    title: "Клиенту сложно выполнить основное действие",
    action:
      "Сделайте выбранное основное действие доступным в один шаг с главной и укажите нужные данные до начала оформления.",
    doesNotProve: "Готовность для человека ничего не говорит о том, справится ли машина или агент.",
  },
  "action.machine_readable": {
    severity: "important",
    title: "Основное действие не представлено в структурированном виде",
    action:
      "Опишите действие в JSON-LD — для бронирования это ReserveAction или Reservation с нужными параметрами.",
    doesNotProve: "Разметка не доказывает, что действие реально выполнимо программно.",
  },
  "action.agent_executable": {
    severity: "later",
    title: "Агент не может выполнить действие от начала до конца",
    action:
      "Если агентский трафик для вас важен — откройте документированный endpoint с schema.org potentialAction / EntryPoint и возвращайте машинопроверяемое подтверждение.",
    doesNotProve:
      "Сегодня это не проходят почти все сайты. Это задел на будущее, а не текущий фактор ранжирования — считайте опциональным, если агенты не входят в вашу стратегию.",
  },
};

export function getRecommendation(ruleId: string, locale: VisibilityLocale): Recommendation | null {
  const table = locale === "ru" ? RU : EN;
  return table[ruleId] ?? null;
}

/**
 * What to show when a check PASSES. The recommendation titles above are
 * phrased as problems, so reusing them for a pass would read as
 * "OK: No canonical URL is declared" — the opposite of the truth.
 */
const PASSED_EN: Record<RuleId, string> = {
  "access.fetchable": "The page loads cleanly",
  "access.noindex": "Indexing is not blocked",
  "access.canonical": "A canonical URL is declared",
  "access.viewport": "A mobile viewport is declared",
  "access.sitemap_discovered": "sitemap.xml was found",
  "identity.jsonld_valid": "Structured data is present and parses",
  "identity.jsonld_entity_present": "An Organization or LocalBusiness entity is declared",
  "identity.brand_name_consistent": "The brand name is consistent",
  "offer.title_present": "The page has a title",
  "offer.single_h1": "The page has exactly one H1",
  "offer.service_page_discovered": "A service or product page was found",
  "conversion.contact_path_present": "A contact path was found",
  "conversion.about_page_discovered": "An About page was found",
  "action.human_ready": "A customer can complete the primary action",
  "action.machine_readable": "The action is exposed in structured form",
  "action.agent_executable": "An agent could complete the action end to end",
};

const PASSED_RU: Record<RuleId, string> = {
  "access.fetchable": "Страница загружается корректно",
  "access.noindex": "Индексация не заблокирована",
  "access.canonical": "Canonical URL объявлен",
  "access.viewport": "Мобильный viewport объявлен",
  "access.sitemap_discovered": "sitemap.xml найден",
  "identity.jsonld_valid": "Структурированные данные есть и разбираются",
  "identity.jsonld_entity_present": "Сущность Organization или LocalBusiness объявлена",
  "identity.brand_name_consistent": "Название бренда согласовано",
  "offer.title_present": "У страницы есть title",
  "offer.single_h1": "На странице ровно один H1",
  "offer.service_page_discovered": "Страница услуги или продукта найдена",
  "conversion.contact_path_present": "Путь к контакту найден",
  "conversion.about_page_discovered": "Страница «О нас» найдена",
  "action.human_ready": "Клиент может выполнить основное действие",
  "action.machine_readable": "Действие представлено в структурированном виде",
  "action.agent_executable": "Агент смог бы выполнить действие целиком",
};

export function getPassedTitle(ruleId: string, locale: VisibilityLocale): string | null {
  const table = locale === "ru" ? PASSED_RU : PASSED_EN;
  return table[ruleId] ?? null;
}

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, important: 1, later: 2 };

export function sortBySeverity<T extends { severity: Severity }>(items: T[]): T[] {
  return [...items].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/**
 * Localized phrasing for the Action Readiness evidence keys. The detector
 * returns keys so the same result can be rendered in either language;
 * this is where they become sentences.
 */
const READINESS_EVIDENCE: Record<VisibilityLocale, Record<ReadinessEvidenceKey, string>> = {
  en: {
    direct_action_link: "A direct path for the chosen action was found",
    generic_contact_only: "Only a generic contact path was found, not the chosen action",
    form_present: "A form is present on the page",
    action_schema_present: "Action-related structured data",
    schema_without_action: "Structured data is present, but it does not describe the action",
    no_schema: "No structured data was found on the page",
    potential_action: "schema.org potentialAction is declared",
    entry_point: "EntryPoint / urlTemplate describes how to invoke the action",
    api_description: "A machine-readable API description is referenced",
    no_agent_signal:
      "No documented endpoint, action entry point or machine-verifiable confirmation was found",
  },
  ru: {
    direct_action_link: "Найден прямой путь к выбранному действию",
    generic_contact_only: "Найден только общий контакт, а не выбранное действие",
    form_present: "На странице есть форма",
    action_schema_present: "Структурированные данные, связанные с действием",
    schema_without_action: "Структурированные данные есть, но действие в них не описано",
    no_schema: "Структурированные данные на странице не найдены",
    potential_action: "Объявлен schema.org potentialAction",
    entry_point: "EntryPoint / urlTemplate описывает, как вызвать действие",
    api_description: "Есть ссылка на машиночитаемое описание API",
    no_agent_signal:
      "Не найдено ни документированного endpoint, ни точки входа действия, ни машинопроверяемого подтверждения",
  },
};

export function describeReadinessEvidence(
  evidence: ReadinessEvidence[],
  locale: VisibilityLocale,
): string {
  const table = READINESS_EVIDENCE[locale];
  return evidence
    .map(({ key, count, detail }) => {
      const base = table[key];
      if (detail) return `${base}: ${detail}`;
      if (typeof count === "number") return `${base} (${count})`;
      return base;
    })
    .join(" · ");
}
