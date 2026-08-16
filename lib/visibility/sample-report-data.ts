import type {
  ActionPathStep,
  ActionReadinessState,
  EvidenceRatio,
  EvidenceRow,
  SourceStatus,
} from "./measurement";
import type { VisibilityLocale } from "./types";
import { commercialFacts } from "@/lib/commercial-facts";

/**
 * Static sample-report content (Codex Execution TZ V1.2, section E).
 *
 * Every value here is illustrative. `sourceStatus` is `"sample"` on every
 * row without exception — nothing in this file is, or may be presented
 * as, an observed measurement of any real website. PR-01 performs no
 * live scan, so a sample is the only honest thing to render.
 */

export interface SampleReportIdentity {
  badge: string;
  businessName: string;
  domain: string;
  market: string;
  language: string;
  status: string;
  methodologyVersion: string;
  sourceStatus: SourceStatus;
}

export interface SampleLayerSection {
  title: string;
  question: string;
  rows: EvidenceRow[];
}

export interface SampleRecommendationSection {
  title: string;
  question: string;
  ratios: EvidenceRatio[];
  citationExamples: { url: string; note: string }[];
  disclosure: string;
}

export interface SampleActionReadinessSection {
  title: string;
  question: string;
  states: ActionReadinessState[];
  timelineTitle: string;
  timeline: ActionPathStep[];
  agentCaveat: string;
}

export interface SampleTopBlocker {
  title: string;
  evidence: string;
  whyItMatters: string;
  doesNotProve: string;
}

export interface SampleNextAction {
  title: string;
  detail: string;
}

export interface SampleBoundaries {
  heading: string;
  measured: string[];
  notMeasured: string[];
}

export interface SampleRoutingOption {
  name: string;
  price: string;
  status: string;
  description: string;
  href?: string;
  ctaLabel?: string;
}

export interface SampleReportContentV2 {
  identity: SampleReportIdentity;
  discoverability: SampleLayerSection;
  understanding: SampleLayerSection;
  recommendationEvidence: SampleRecommendationSection;
  actionReadiness: SampleActionReadinessSection;
  topBlocker: { heading: string; item: SampleTopBlocker };
  nextActions: { heading: string; items: SampleNextAction[] };
  boundaries: SampleBoundaries;
  routing: { heading: string; intro: string; options: SampleRoutingOption[] };
  sampleDisclaimer: string;
}

const EN: SampleReportContentV2 = {
  identity: {
    badge: "SAMPLE REPORT",
    businessName: "Sample Villa Co (illustrative business)",
    domain: "sample-villa-co.example",
    market: "Indonesia / Bali",
    language: "English",
    status: "Sample — not a live scan",
    methodologyVersion: "Methodology v1.2 · sample data set",
    sourceStatus: "sample",
  },
  discoverability: {
    title: "1. Discoverability",
    question: "Can public search and AI systems reach and find this business?",
    rows: [
      {
        label: "Public page reachable",
        value: "Homepage returned 200 over HTTPS",
        state: "pass",
        sourceStatus: "sample",
        limitation: "Reachability at one moment in time, from one location.",
      },
      {
        label: "Crawler access (robots.txt)",
        value: "Crawler access is not visibly blocked",
        state: "pass",
        sourceStatus: "sample",
        limitation: "Not blocked is not the same as read, indexed, or recommended.",
      },
      {
        label: "Sitemap",
        value: "sitemap.xml found and parseable",
        state: "pass",
        sourceStatus: "sample",
        limitation: "Presence of a sitemap does not prove any URL was indexed.",
      },
      {
        label: "Canonical",
        value: "Self-referencing canonical present on the homepage",
        state: "pass",
        sourceStatus: "sample",
      },
      {
        label: "Indexability signals",
        value: "No noindex in meta robots or X-Robots-Tag",
        state: "pass",
        sourceStatus: "sample",
        limitation: "Index status itself can only be confirmed in Search Console.",
      },
      {
        label: "llms.txt",
        value: "Not present — informational only, zero weight",
        state: "info",
        sourceStatus: "sample",
        limitation: "llms.txt is a proposed convention, not a ranking or citation factor.",
      },
    ],
  },
  understanding: {
    title: "2. Understanding",
    question: "Can they understand who this is, what it offers, for whom and where?",
    rows: [
      {
        label: "Brand identity consistency",
        value: "Brand name consistent across title, H1 and Organization schema",
        state: "pass",
        sourceStatus: "sample",
      },
      {
        label: "Primary service clarity",
        value: "Homepage and metadata describe the service in two materially different ways",
        state: "warn",
        sourceStatus: "sample",
        limitation: "Inconsistency is observable; its effect on any AI answer is not.",
      },
      {
        label: "Market / location clarity",
        value: "Service area stated in copy and in structured data",
        state: "pass",
        sourceStatus: "sample",
      },
      {
        label: "Entity / schema evidence",
        value: "LocalBusiness schema valid; missing sameAs and opening hours",
        state: "warn",
        sourceStatus: "sample",
        limitation: "Structured data is machine-readable corroboration, not a guarantee of citation.",
      },
      {
        label: "Direct-answer coverage",
        value: "No page directly answers common pre-purchase questions",
        state: "fail",
        sourceStatus: "sample",
      },
    ],
  },
  recommendationEvidence: {
    title: "3. Recommendation Evidence",
    question: "Is the brand mentioned or cited in a limited, disclosed sample of AI answers?",
    ratios: [
      { label: "Mentioned in sampled answers", matched: 2, total: 6, sourceStatus: "sample" },
      { label: "Cited (owned domain) in sampled answers", matched: 1, total: 6, sourceStatus: "sample" },
      { label: "Primary competitor mentioned", matched: 4, total: 6, sourceStatus: "sample" },
      { label: "Entity consistency across checked pages", matched: 3, total: 5, sourceStatus: "sample" },
    ],
    citationExamples: [
      { url: "sample-directory.example/bali-villas", note: "Third-party directory listing (sample)" },
      { url: "sample-villa-co.example/services", note: "Owned-domain service page (sample)" },
    ],
    disclosure:
      "Sample figures only. A real run discloses the exact prompt set, the AI environments used, the date, and counts every valid answer in the denominator. Zero valid answers is reported as \"not measured\", never as 0% visibility.",
  },
  actionReadiness: {
    title: "4. Action Readiness",
    question: "Can a customer — or an agent acting for them — actually complete the next action?",
    states: [
      {
        id: "human_ready",
        label: "Human-ready",
        definition: "A person can find and complete the intended action unaided.",
        state: "pass",
        sourceStatus: "sample",
        finding: "Primary action (Book) is visible above the fold and reachable in one tap on mobile.",
        doesNotProve: "Does not prove a machine can parse the action, or that an agent could execute it.",
      },
      {
        id: "machine_readable",
        label: "Machine-readable",
        definition: "The action and its parameters are exposed in structured, parseable form.",
        state: "warn",
        sourceStatus: "sample",
        finding: "Booking link is present but exposes no structured action markup or parameters.",
        doesNotProve: "Machine-readable markup does not prove the action can be completed programmatically.",
      },
      {
        id: "agent_executable",
        label: "Agent-executable",
        definition:
          "An autonomous agent can complete the action end to end and receive a confirmation it can verify.",
        state: "fail",
        sourceStatus: "sample",
        finding: "No documented API, no structured action endpoint, and confirmation is human-only email.",
        doesNotProve:
          "A visible button, a WhatsApp link or JSON-LD is not evidence of agent execution — these are independent states.",
      },
    ],
    timelineTitle: "Action path",
    timeline: [
      { id: "discovery", label: "Discovery", state: "pass", sourceStatus: "sample", note: "Business is findable from a public entry point." },
      { id: "business_understood", label: "Business understood", state: "warn", sourceStatus: "sample", note: "Offer described inconsistently across surfaces." },
      { id: "primary_action_found", label: "Primary action found", state: "pass", sourceStatus: "sample", note: "Booking path is clearly presented." },
      { id: "action_understandable", label: "Action understandable", state: "warn", sourceStatus: "sample", note: "Required inputs are not stated before starting." },
      { id: "action_completable", label: "Action completable", state: "fail", sourceStatus: "sample", note: "Flow requires steps that cannot be completed programmatically." },
      { id: "confirmation_detected", label: "Confirmation detected", state: "fail", sourceStatus: "sample", note: "No machine-verifiable confirmation is returned." },
    ],
    agentCaveat:
      "A visible CTA, a phone number or a WhatsApp link demonstrates human readiness only. Agent-executable is a separate, stricter claim and is measured separately.",
  },
  topBlocker: {
    heading: "5. Top blocker",
    item: {
      title: "The primary action cannot be completed without a human",
      evidence:
        "Sample evidence: booking flow exposes no structured endpoint or parameters, and the only confirmation is a human-readable email.",
      whyItMatters:
        "Customers using an assistant to act on their behalf reach a dead end at the last step, after discovery has already succeeded.",
      doesNotProve:
        "This does not prove lost revenue, and it does not prove any specific AI system attempted the action and failed.",
    },
  },
  nextActions: {
    heading: "6. Next three actions",
    items: [
      { title: "Unify the service definition", detail: "Write one canonical description and reuse it in visible copy, metadata and structured data." },
      { title: "State the action's inputs up front", detail: "List what a booking requires (dates, party size, contact) before the flow starts." },
      { title: "Add direct-answer content", detail: "Publish plain answers to the questions asked before booking, on a page that is linked from the homepage." },
    ],
  },
  boundaries: {
    heading: "7. Measurement boundaries",
    measured: [
      "Publicly available pages",
      "Technical accessibility and indexability signals",
      "Structured identity and service clarity",
      "A limited, dated sample of AI responses",
      "Public links and citations returned by supported providers",
      "Whether the primary action is human-ready, machine-readable and agent-executable",
    ],
    notMeasured: [
      "Every possible prompt",
      "Every user location or personal context",
      "Private analytics",
      "CRM conversions",
      "Revenue impact",
      "Guaranteed future recommendations",
      "Causality between one website change and one AI answer",
    ],
  },
  routing: {
    heading: "8. Where this leads",
    intro: "Routing shown for the sample. A real report routes on its own evidence.",
    options: [
      {
        name: "AI Visibility Snapshot",
        price: commercialFacts.aiVisibility.snapshot.en,
        status: "Early access · checkout closed",
        description: "A locked three-system Visitor View measurement with 300 planned answers.",
        href: "/en/contact",
        ctaLabel: "Request Snapshot access",
      },
      {
        name: "AI Visibility Landscape",
        price: commercialFacts.aiVisibility.landscape.en,
        status: "Early access · checkout closed",
        description: "Eight systems with Visitor View and API View reported separately.",
        href: "/en/contact",
        ctaLabel: "Request Landscape access",
      },
      {
        name: "Expert Verified",
        price: commercialFacts.aiVisibility.expertVerified.en,
        status: "Manual review required",
        description: "An 800-answer baseline with semantic, citation and factual QC by an analyst.",
        href: "/en/contact",
        ctaLabel: "Request Expert Verified",
      },
      {
        name: "Implementation + 90 days",
        price: commercialFacts.aiVisibility.implementation90Days.en,
        status: "Manual scope approval",
        description: "Implementation and remeasurement against an immutable approved baseline.",
        href: "/en/contact",
        ctaLabel: "Discuss the 90-day scope",
      },
    ],
  },
  sampleDisclaimer:
    "Live checks are being calibrated on Selena Systems projects. This sample shows the report structure and evidence boundaries; it is not a result for any submitted website.",
};

const RU: SampleReportContentV2 = {
  identity: {
    badge: "ПРИМЕР ОТЧЁТА",
    businessName: "Sample Villa Co (иллюстративный бизнес)",
    domain: "sample-villa-co.example",
    market: "Индонезия / Бали",
    language: "Английский",
    status: "Пример — не живое сканирование",
    methodologyVersion: "Методология v1.2 · демонстрационный набор данных",
    sourceStatus: "sample",
  },
  discoverability: {
    title: "1. Discoverability — обнаружимость",
    question: "Могут ли публичный поиск и AI-системы получить доступ к бизнесу и найти его?",
    rows: [
      {
        label: "Публичная страница доступна",
        value: "Главная страница вернула 200 по HTTPS",
        state: "pass",
        sourceStatus: "sample",
        limitation: "Доступность в один момент времени и из одной локации.",
      },
      {
        label: "Доступ краулера (robots.txt)",
        value: "Доступ краулера видимо не заблокирован",
        state: "pass",
        sourceStatus: "sample",
        limitation: "«Не заблокирован» не равно «прочитан», «проиндексирован» или «рекомендован».",
      },
      {
        label: "Sitemap",
        value: "sitemap.xml найден и разбирается",
        state: "pass",
        sourceStatus: "sample",
        limitation: "Наличие sitemap не доказывает индексацию ни одного URL.",
      },
      {
        label: "Canonical",
        value: "Самоссылающийся canonical присутствует на главной",
        state: "pass",
        sourceStatus: "sample",
      },
      {
        label: "Сигналы индексируемости",
        value: "Нет noindex ни в meta robots, ни в X-Robots-Tag",
        state: "pass",
        sourceStatus: "sample",
        limitation: "Сам факт индексации подтверждается только в Search Console.",
      },
      {
        label: "llms.txt",
        value: "Отсутствует — только информационно, вес ноль",
        state: "info",
        sourceStatus: "sample",
        limitation: "llms.txt — предлагаемая конвенция, а не фактор ранжирования или цитирования.",
      },
    ],
  },
  understanding: {
    title: "2. Understanding — понимание",
    question: "Могут ли они понять, кто это, что предлагает, кому и где?",
    rows: [
      {
        label: "Согласованность бренда",
        value: "Название бренда согласовано в title, H1 и схеме Organization",
        state: "pass",
        sourceStatus: "sample",
      },
      {
        label: "Ясность основной услуги",
        value: "Главная страница и метаданные описывают услугу двумя существенно разными способами",
        state: "warn",
        sourceStatus: "sample",
        limitation: "Несогласованность наблюдаема; её влияние на конкретный AI-ответ — нет.",
      },
      {
        label: "Ясность рынка / локации",
        value: "Зона обслуживания указана в тексте и в структурированных данных",
        state: "pass",
        sourceStatus: "sample",
      },
      {
        label: "Доказательства сущности / схемы",
        value: "Схема LocalBusiness валидна; отсутствуют sameAs и часы работы",
        state: "warn",
        sourceStatus: "sample",
        limitation: "Структурированные данные — машиночитаемое подтверждение, а не гарантия цитирования.",
      },
      {
        label: "Покрытие прямыми ответами",
        value: "Ни одна страница не отвечает прямо на типичные вопросы до покупки",
        state: "fail",
        sourceStatus: "sample",
      },
    ],
  },
  recommendationEvidence: {
    title: "3. Recommendation Evidence — доказательства рекомендаций",
    question: "Упоминается или цитируется ли бренд в ограниченной, раскрытой выборке AI-ответов?",
    ratios: [
      { label: "Упомянут в выборке ответов", matched: 2, total: 6, sourceStatus: "sample" },
      { label: "Процитирован (собственный домен) в выборке", matched: 1, total: 6, sourceStatus: "sample" },
      { label: "Основной конкурент упомянут", matched: 4, total: 6, sourceStatus: "sample" },
      { label: "Согласованность сущности по проверенным страницам", matched: 3, total: 5, sourceStatus: "sample" },
    ],
    citationExamples: [
      { url: "sample-directory.example/bali-villas", note: "Стороннее отраслевое размещение (пример)" },
      { url: "sample-villa-co.example/services", note: "Страница услуги на собственном домене (пример)" },
    ],
    disclosure:
      "Только демонстрационные цифры. Реальный запуск раскрывает точный набор запросов, использованные AI-среды, дату и учитывает каждый валидный ответ в знаменателе. Ноль валидных ответов сообщается как «не измерено», а не как 0% видимости.",
  },
  actionReadiness: {
    title: "4. Action Readiness — готовность к действию",
    question: "Может ли клиент — или агент, действующий за него — действительно выполнить следующее действие?",
    states: [
      {
        id: "human_ready",
        label: "Human-ready — готово для человека",
        definition: "Человек может найти и выполнить целевое действие самостоятельно.",
        state: "pass",
        sourceStatus: "sample",
        finding: "Основное действие («Забронировать») видно в первом экране и доступно в одно касание на мобильном.",
        doesNotProve: "Не доказывает, что машина разберёт действие или что агент сможет его выполнить.",
      },
      {
        id: "machine_readable",
        label: "Machine-readable — машиночитаемо",
        definition: "Действие и его параметры представлены в структурированном, разбираемом виде.",
        state: "warn",
        sourceStatus: "sample",
        finding: "Ссылка на бронирование есть, но структурированной разметки действия и параметров нет.",
        doesNotProve: "Машиночитаемая разметка не доказывает, что действие можно выполнить программно.",
      },
      {
        id: "agent_executable",
        label: "Agent-executable — выполнимо агентом",
        definition:
          "Автономный агент может выполнить действие от начала до конца и получить проверяемое подтверждение.",
        state: "fail",
        sourceStatus: "sample",
        finding: "Нет документированного API, нет структурированного endpoint действия, подтверждение — только письмо для человека.",
        doesNotProve:
          "Видимая кнопка, ссылка WhatsApp или JSON-LD не являются доказательством выполнения агентом — это независимые состояния.",
      },
    ],
    timelineTitle: "Путь действия",
    timeline: [
      { id: "discovery", label: "Обнаружение", state: "pass", sourceStatus: "sample", note: "Бизнес находится из публичной точки входа." },
      { id: "business_understood", label: "Бизнес понят", state: "warn", sourceStatus: "sample", note: "Предложение описано несогласованно на разных поверхностях." },
      { id: "primary_action_found", label: "Основное действие найдено", state: "pass", sourceStatus: "sample", note: "Путь бронирования ясно представлен." },
      { id: "action_understandable", label: "Действие понятно", state: "warn", sourceStatus: "sample", note: "Необходимые данные не указаны до начала." },
      { id: "action_completable", label: "Действие выполнимо", state: "fail", sourceStatus: "sample", note: "Поток требует шагов, которые нельзя выполнить программно." },
      { id: "confirmation_detected", label: "Подтверждение обнаружено", state: "fail", sourceStatus: "sample", note: "Машинопроверяемое подтверждение не возвращается." },
    ],
    agentCaveat:
      "Видимый CTA, номер телефона или ссылка WhatsApp демонстрируют только готовность для человека. Agent-executable — отдельное, более строгое утверждение, и измеряется отдельно.",
  },
  topBlocker: {
    heading: "5. Главный блокер",
    item: {
      title: "Основное действие невозможно выполнить без участия человека",
      evidence:
        "Демонстрационное доказательство: поток бронирования не предоставляет структурированного endpoint или параметров, а единственное подтверждение — письмо для человека.",
      whyItMatters:
        "Клиенты, использующие ассистента для действий от своего имени, упираются в тупик на последнем шаге — уже после успешного обнаружения.",
      doesNotProve:
        "Это не доказывает потерянную выручку и не доказывает, что какая-либо конкретная AI-система пыталась выполнить действие и не смогла.",
    },
  },
  nextActions: {
    heading: "6. Три следующих действия",
    items: [
      { title: "Унифицировать описание услуги", detail: "Написать одно каноничное описание и использовать его в тексте, метаданных и структурированных данных." },
      { title: "Указать входные данные действия заранее", detail: "Перечислить, что нужно для бронирования (даты, число гостей, контакт), до начала потока." },
      { title: "Добавить контент с прямыми ответами", detail: "Опубликовать понятные ответы на вопросы, которые задают до бронирования, на странице со ссылкой с главной." },
    ],
  },
  boundaries: {
    heading: "7. Границы измерения",
    measured: [
      "Публично доступные страницы",
      "Техническая доступность и сигналы индексируемости",
      "Структурированная идентичность и ясность услуг",
      "Ограниченная, датированная выборка AI-ответов",
      "Публичные ссылки и источники от поддерживаемых провайдеров",
      "Является ли основное действие human-ready, machine-readable и agent-executable",
    ],
    notMeasured: [
      "Все возможные запросы",
      "Каждая локация или личный контекст пользователя",
      "Приватная аналитика",
      "Конверсии в CRM",
      "Влияние на выручку",
      "Гарантированные будущие рекомендации",
      "Причинно-следственная связь между одним изменением сайта и одним AI-ответом",
    ],
  },
  routing: {
    heading: "8. К чему это ведёт",
    intro: "Маршрутизация показана для примера. Реальный отчёт направляет по собственным доказательствам.",
    options: [
      {
        name: "AI Visibility Snapshot",
        price: commercialFacts.aiVisibility.snapshot.ru,
        status: "Ранний доступ · оплата закрыта",
        description: "Зафиксированный Visitor View замер трёх систем на 300 плановых ответов.",
        href: "/contact",
        ctaLabel: "Запросить доступ к Snapshot",
      },
      {
        name: "AI Visibility Landscape",
        price: commercialFacts.aiVisibility.landscape.ru,
        status: "Ранний доступ · оплата закрыта",
        description: "Восемь систем с раздельными Visitor View и API View.",
        href: "/contact",
        ctaLabel: "Запросить доступ к Landscape",
      },
      {
        name: "Expert Verified",
        price: commercialFacts.aiVisibility.expertVerified.ru,
        status: "Нужна ручная проверка",
        description: "Baseline из 800 ответов со смысловым, citation и factual QC аналитика.",
        href: "/contact",
        ctaLabel: "Запросить Expert Verified",
      },
      {
        name: "Implementation + 90 days",
        price: commercialFacts.aiVisibility.implementation90Days.ru,
        status: "Ручное согласование scope",
        description: "Внедрение и повторный замер по неизменяемому утверждённому baseline.",
        href: "/contact",
        ctaLabel: "Обсудить программу на 90 дней",
      },
    ],
  },
  sampleDisclaimer:
    "Живые проверки калибруются на проектах Selena Systems. Этот пример показывает структуру отчёта и границы доказательности; это не результат проверки какого-либо введённого сайта.",
};

export function getSampleReport(locale: VisibilityLocale): SampleReportContentV2 {
  return locale === "ru" ? RU : EN;
}
