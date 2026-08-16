export type LabLocale = "en" | "ru";
export type LabSectionId = "research" | "guides" | "experiments" | "articles" | "courses";

export type LabSource = {
  title: string;
  href: string;
  publisher: string;
};

export type LabContentBlock = {
  heading: string;
  paragraphs: string[];
  points?: string[];
};

export type LabItem = {
  section: Extract<LabSectionId, "guides" | "articles">;
  slug: string;
  title: string;
  summary: string;
  label: string;
  readingTime: string;
  updatedAt: string;
  blocks: LabContentBlock[];
  sources: LabSource[];
};

type LabSection = {
  id: LabSectionId;
  title: string;
  description: string;
  emptyState?: string;
};

type LabLocaleContent = {
  eyebrow: string;
  title: string;
  intro: string;
  supportingLine: string;
  browseLabel: string;
  featuredLabel: string;
  sectionEyebrow: string;
  backLabel: string;
  sourcesLabel: string;
  updatedLabel: string;
  checkCta: { title: string; text: string; label: string; href: string };
  systemsCta: { title: string; text: string; label: string; href: string };
  coursesBoundary: string;
  sections: LabSection[];
  items: LabItem[];
};

const officialSources = {
  openAiSearch: {
    title: "Publishers and developers FAQ",
    href: "https://help.openai.com/en/articles/12627856-publishers-and-developers-faq",
    publisher: "OpenAI",
  },
  googleCrawling: {
    title: "Google crawling and indexing documentation",
    href: "https://developers.google.com/search/docs/crawling-indexing",
    publisher: "Google Search Central",
  },
  googleCanonical: {
    title: "How to specify a canonical URL",
    href: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
    publisher: "Google Search Central",
  },
  googleStructuredData: {
    title: "General structured data guidelines",
    href: "https://developers.google.com/search/docs/appearance/structured-data/sd-policies",
    publisher: "Google Search Central",
  },
  schemaOrg: {
    title: "Schema.org documentation",
    href: "https://schema.org/docs/documents.html",
    publisher: "Schema.org",
  },
} satisfies Record<string, LabSource>;

export const labContent: Record<LabLocale, LabLocaleContent> = {
  en: {
    eyebrow: "Selena Lab",
    title: "Research, practical guides, experiments and courses for building with AI.",
    intro:
      "Selena Lab is the research and education layer of Selena Systems. We publish methods, evidence boundaries and practical work that support AI Visibility and our custom AI Systems practice.",
    supportingLine: "Research → useful content → trust → better decisions.",
    browseLabel: "Browse the Lab",
    featuredLabel: "Start here",
    sectionEyebrow: "Selena Lab library",
    backLabel: "Back to Selena Lab",
    sourcesLabel: "Primary references",
    updatedLabel: "Updated",
    checkCta: {
      title: "Check the public readiness of your website",
      text: "Run the free evidence-based audit. It uses public website data only and makes zero paid AI-provider calls.",
      label: "Run Public Readiness",
      href: "/check",
    },
    systemsCta: {
      title: "Need a system, not only a diagnosis?",
      text: "Selena Systems maps the workflow, chooses the safe automation boundary and builds the operating layer with your team.",
      label: "Discuss an AI system",
      href: "/en/contact",
    },
    coursesBoundary:
      "No course is currently offered for sale. Public introductory lessons will stay in Selena Lab; paid enrolment will open only with a published syllabus, access period, price and refund terms. The future learning workspace will live at app.selenasystems.com/app/learn.",
    sections: [
      {
        id: "research",
        title: "Research",
        description: "Versioned studies, datasets and benchmarks with disclosed methodology and provenance.",
        emptyState: "The research register is being prepared. No dataset or benchmark is presented as published yet.",
      },
      {
        id: "guides",
        title: "Guides",
        description: "Concrete, evidence-safe ways to improve websites, workflows and AI systems.",
      },
      {
        id: "experiments",
        title: "Experiments",
        description: "Reproducible tests of methods and tools, including what failed and what remains unknown.",
        emptyState: "Experiment notes will appear only after the setup, inputs and observed outcome can be reproduced.",
      },
      {
        id: "articles",
        title: "Articles",
        description: "Clear explanations of AI visibility, evidence and practical AI implementation.",
      },
      {
        id: "courses",
        title: "Courses",
        description: "Free foundations and, later, separately purchased practical courses with one Selena account.",
      },
    ],
    items: [
      {
        section: "articles",
        slug: "what-is-ai-visibility",
        title: "What is AI Visibility?",
        summary:
          "A practical definition of AI visibility, how it differs from website readiness, and which claims require a real measurement cycle.",
        label: "Foundation",
        readingTime: "6 min",
        updatedAt: "2026-08-16",
        blocks: [
          {
            heading: "A useful definition",
            paragraphs: [
              "AI Visibility is the observed presence and treatment of a brand in answers produced by defined AI systems for a defined set of scenarios. It is not a permanent property of a company and it is not one universal score.",
              "A defensible result names the system or surface, exact model where applicable, language, region, prompt family, repeat count, date and whether web search was available. Without that configuration, a percentage is difficult to interpret or reproduce.",
            ],
          },
          {
            heading: "Readiness and visibility answer different questions",
            paragraphs: [
              "Public Readiness asks whether machines can reach, parse and reuse information on a website. It can inspect HTTP access, robots rules, canonical URLs, structured data, entity clarity, content structure, contact consistency and block-level citability heuristics.",
              "Real AI Visibility asks what selected AI systems actually answered. That requires a separate measurement cycle and an Evidence Ledger. Improving readiness may make a site clearer, but it does not prove that ChatGPT, Gemini or Perplexity mentioned or recommended the brand.",
            ],
            points: [
              "Readiness evidence comes from the website and deterministic rules.",
              "Visibility evidence comes from dated AI answers collected under a Configuration Lock.",
              "The two can be compared side by side, but should never be merged into an opaque composite score.",
            ],
          },
          {
            heading: "Visitor View and API View are not interchangeable",
            paragraphs: [
              "A consumer-facing answer surface with search available is a different channel from a direct API response produced by a fixed model with web search off. Selena reports Visitor View and API View separately, then calculates divergence only between results that are genuinely comparable.",
              "This prevents a common mistake: presenting one API model response as everything a product or company 'knows'. It is only one response under one configuration.",
            ],
          },
          {
            heading: "What a sound measurement should preserve",
            paragraphs: [
              "The evidence needs both the answer and its context: prompt, system, model or surface, search status, language, region, repeat index, timestamps, citations and validation state. Cardinality must be planned before a run so missing or extra answers are visible rather than silently averaged away.",
              "The result is decision support. It can show where a brand appears, which competitors appear instead, which sources are cited and what should be investigated next. It cannot guarantee future rankings or recommendations.",
            ],
          },
        ],
        sources: [officialSources.openAiSearch],
      },
      {
        section: "guides",
        slug: "prepare-site-for-ai-systems",
        title: "How to prepare a website for AI systems",
        summary:
          "A safe checklist for access, indexability, entity clarity, structured data, answer-first content and verification.",
        label: "Practical guide",
        readingTime: "9 min",
        updatedAt: "2026-08-16",
        blocks: [
          {
            heading: "1. Make key pages reachable without a human session",
            paragraphs: [
              "Start with ordinary web access. Important public pages should return a successful HTTP response without login, CAPTCHA or a browser-only challenge. Review robots.txt and the CDN or WAF separately: an allowed robots rule does not help if infrastructure still returns 403.",
              "Crawler controls are not one switch. For example, OpenAI documents OAI-SearchBot for search discovery separately from GPTBot controls. Decide deliberately which public paths each named crawler may request, and keep private paths protected.",
            ],
          },
          {
            heading: "2. Establish one clear URL for each important page",
            paragraphs: [
              "Use stable HTTPS URLs, a self-referential canonical where appropriate and a sitemap containing the canonical pages you want discovered. Keep redirects, canonical declarations and sitemap URLs consistent.",
              "Do not use robots.txt as a substitute for noindex or authentication. Crawling, indexing and access control solve different problems.",
            ],
          },
          {
            heading: "3. State the business entity in visible content",
            paragraphs: [
              "The page should say who the business is, what it offers, for whom, where it operates and how a customer takes the next step. Keep the public name, location, contact paths and core offer consistent across the homepage, contact page and relevant service pages.",
              "Add truthful structured data that represents the visible page. JSON-LD can make entities and relationships more explicit, but valid markup does not guarantee a rich result, recommendation or ranking.",
            ],
          },
          {
            heading: "4. Write blocks that can stand on their own",
            paragraphs: [
              "Use descriptive headings followed by a direct answer. Add concrete scope, conditions, location, prices or dates when they are verified and relevant. A machine should not need decorative layout or three previous sections to understand the claim.",
              "Treat citability checks as versioned heuristics, not proven ranking factors. They help identify ambiguous blocks; only later measurements can show whether observed visibility changed.",
            ],
          },
          {
            heading: "5. Verify the exact fix",
            paragraphs: [
              "Record the URL, observed fragment and rule before editing. Preview the proposed change, publish it through the site's normal owner-controlled workflow, then run a new readiness check. Preserve the old result as the baseline.",
              "A readiness increase means the site meets more of the disclosed technical and content criteria. It does not by itself mean AI systems now mention the brand more often. That conclusion requires a separate measurement cycle with the same Configuration Lock.",
            ],
            points: [
              "Check up to five key pages rather than only the homepage.",
              "Keep llms.txt diagnostic-only; Selena gives it zero scoring weight.",
              "Do not expose private accounts or add paid provider calls to a free readiness check.",
            ],
          },
        ],
        sources: [
          officialSources.openAiSearch,
          officialSources.googleCrawling,
          officialSources.googleCanonical,
          officialSources.googleStructuredData,
          officialSources.schemaOrg,
        ],
      },
      {
        section: "guides",
        slug: "read-ai-visibility-report-evidence",
        title: "How to read an AI Visibility Report and verify the evidence",
        summary:
          "A field guide to Configuration Lock, denominators, citations, provenance, invalid runs and actionable recommendations.",
        label: "Evidence guide",
        readingTime: "8 min",
        updatedAt: "2026-08-16",
        blocks: [
          {
            heading: "Begin with the Configuration Lock",
            paragraphs: [
              "Before reading a headline metric, confirm what was measured: channel, system, exact API model or visitor surface, web-search status, language, region, prompt families, language scenarios, repeats and date. These fields define the result.",
              "If a later cycle changes those inputs, it is a new baseline version. A before/after chart is meaningful only when the relevant method stays fixed and the changed variables are disclosed.",
            ],
          },
          {
            heading: "Check the denominator, not only the percentage",
            paragraphs: [
              "A mention rate of 40% means different things at 2 of 5 answers and 80 of 200 answers. Look for planned answers, valid answers, technical invalids, retries and missing rows. One unexpected extra row should stop the cycle rather than disappear inside an average.",
              "Retries should belong to one specific technical invalid. Re-running a whole prompt family or system can create hidden fan-out and bias the sample.",
            ],
          },
          {
            heading: "Trace every claim back to evidence",
            paragraphs: [
              "For an AI-answer finding, open the prompt, raw answer snapshot, system, model or surface, timestamp, citation URLs and validation state. For a website-readiness finding, open the page URL, text or HTML fragment, selector, rule ID and rule version.",
              "A citation URL proves that the answer referenced that URL in the captured run. It does not automatically prove that every sentence in the answer is correct or that the cited page supports the exact claim. That needs semantic citation review.",
            ],
          },
          {
            heading: "Separate observation, interpretation and action",
            paragraphs: [
              "Observation states what the captured evidence contains. Interpretation explains why it may matter. Recommendation proposes a change. A strong report keeps those layers visible instead of presenting an inferred cause as a measured fact.",
              "Automated recommendations should be labelled as automated. An Expert Verified status requires an actual QC record covering semantic mentions, citations, factual errors and the approved priority actions.",
            ],
          },
          {
            heading: "Use the report as a controlled loop",
            paragraphs: [
              "Choose the highest-priority evidence-backed fix, preview it, implement it through an owner-controlled process and verify the exact page. Keep readiness before/after separate from AI visibility before/after.",
              "When the change is ready for a real re-measurement, use the same Configuration Lock. Report the observed delta with its denominator and date, then monitor only while the baseline remains comparable.",
            ],
          },
        ],
        sources: [officialSources.googleStructuredData],
      },
    ],
  },
  ru: {
    eyebrow: "Selena Lab",
    title: "Исследования, практические руководства, эксперименты и курсы о создании AI-систем.",
    intro:
      "Selena Lab — исследовательский и образовательный слой Selena Systems. Здесь мы публикуем методы, границы доказательности и практические материалы для AI Visibility и индивидуальных AI Systems.",
    supportingLine: "Research → полезный контент → доверие → лучшие решения.",
    browseLabel: "Разделы Lab",
    featuredLabel: "С чего начать",
    sectionEyebrow: "Библиотека Selena Lab",
    backLabel: "Вернуться в Selena Lab",
    sourcesLabel: "Первичные источники",
    updatedLabel: "Обновлено",
    checkCta: {
      title: "Проверьте Public Readiness сайта",
      text: "Запустите бесплатный evidence-based аудит. Он использует только публичные данные сайта и делает 0 платных AI provider calls.",
      label: "Запустить Public Readiness",
      href: "/ru/check",
    },
    systemsCta: {
      title: "Нужна система, а не только диагностика?",
      text: "Selena Systems разбирает процесс, определяет безопасную границу автоматизации и строит рабочий контур вместе с вашей командой.",
      label: "Обсудить AI-систему",
      href: "/contact",
    },
    coursesBoundary:
      "Сейчас ни один курс не выставлен на продажу. Бесплатные вводные материалы останутся в Selena Lab; платная запись откроется только с опубликованной программой, сроком доступа, ценой и условиями возврата. Будущий учебный кабинет будет находиться на app.selenasystems.com/app/learn.",
    sections: [
      {
        id: "research",
        title: "Исследования",
        description: "Версионированные исследования, datasets и benchmarks с раскрытой методологией и provenance.",
        emptyState: "Реестр исследований готовится. Пока ни один dataset или benchmark не обозначен как опубликованный.",
      },
      {
        id: "guides",
        title: "Руководства",
        description: "Конкретные и evidence-safe способы улучшать сайты, процессы и AI-системы.",
      },
      {
        id: "experiments",
        title: "Эксперименты",
        description: "Воспроизводимые тесты методов и инструментов — включая неудачи и неизвестные результаты.",
        emptyState: "Эксперимент появится здесь только вместе с воспроизводимыми настройками, входными данными и наблюдаемым результатом.",
      },
      {
        id: "articles",
        title: "Статьи",
        description: "Понятные объяснения AI Visibility, evidence и практического внедрения AI.",
      },
      {
        id: "courses",
        title: "Курсы",
        description: "Бесплатная база и, позднее, отдельные платные практические курсы с единым аккаунтом Selena.",
      },
    ],
    items: [
      {
        section: "articles",
        slug: "what-is-ai-visibility",
        title: "Что такое AI Visibility",
        summary:
          "Практическое определение AI-видимости, её отличие от readiness сайта и требования к реальному циклу измерений.",
        label: "База",
        readingTime: "6 минут",
        updatedAt: "2026-08-16",
        blocks: [
          {
            heading: "Рабочее определение",
            paragraphs: [
              "AI Visibility — это наблюдаемое присутствие бренда и то, как его описывают выбранные AI-системы в ответах на зафиксированный набор сценариев. Это не постоянное свойство компании и не один универсальный балл.",
              "Проверяемый результат указывает канал, систему или поверхность, точную API-модель, если она используется, язык, регион, prompt family, число повторов, дату и статус web search. Без этой конфигурации процент трудно интерпретировать и воспроизвести.",
            ],
          },
          {
            heading: "Readiness и visibility отвечают на разные вопросы",
            paragraphs: [
              "Public Readiness проверяет, могут ли машины получить, разобрать и повторно использовать информацию сайта. Сюда относятся HTTP-доступ, robots, canonical, structured data, ясность сущности, структура контента, согласованность контактов и block-level эвристики citability.",
              "Real AI Visibility проверяет, что выбранные AI-системы действительно ответили. Для этого нужен отдельный measurement cycle и Evidence Ledger. Улучшение readiness делает сайт понятнее, но не доказывает, что ChatGPT, Gemini или Perplexity начали чаще упоминать или рекомендовать бренд.",
            ],
            points: [
              "Readiness evidence приходит с сайта и из детерминированных правил.",
              "Visibility evidence приходит из датированных AI-ответов с Configuration Lock.",
              "Метрики можно сравнивать рядом, но нельзя смешивать в непрозрачный composite score.",
            ],
          },
          {
            heading: "Visitor View и API View нельзя считать одним каналом",
            paragraphs: [
              "Пользовательская AI-поверхность с доступным поиском отличается от прямого API-ответа фиксированной модели с выключенным web search. Selena показывает Visitor View и API View отдельно, а divergence считает только между действительно сопоставимыми результатами.",
              "Так мы не выдаём один API-ответ за всё, что модель якобы «знает». Это лишь один ответ при одной конфигурации.",
            ],
          },
          {
            heading: "Что должно сохраняться в корректном измерении",
            paragraphs: [
              "В Evidence Ledger остаются ответ и его контекст: prompt, система, модель или поверхность, search status, язык, регион, repeat index, timestamps, citations и validation state. Cardinality планируется до запуска, чтобы пропущенные или лишние ответы не исчезали внутри среднего значения.",
              "Результат помогает принимать решения: показывает, где бренд появляется, кого называют вместо него, какие источники цитируют и что исследовать дальше. Он не гарантирует будущие rankings или рекомендации.",
            ],
          },
        ],
        sources: [officialSources.openAiSearch],
      },
      {
        section: "guides",
        slug: "prepare-site-for-ai-systems",
        title: "Как подготовить сайт для AI-систем",
        summary:
          "Безопасный чек-лист: доступ, indexability, entity clarity, structured data, answer-first контент и verification.",
        label: "Практическое руководство",
        readingTime: "9 минут",
        updatedAt: "2026-08-16",
        blocks: [
          {
            heading: "1. Сделайте ключевые страницы доступными без пользовательской сессии",
            paragraphs: [
              "Начните с обычного web access. Важные публичные страницы должны возвращать успешный HTTP-ответ без логина, CAPTCHA или browser-only challenge. Проверьте robots.txt и CDN/WAF отдельно: разрешение в robots не поможет, если инфраструктура всё равно возвращает 403.",
              "Crawler controls — не один переключатель. Например, OpenAI отдельно документирует OAI-SearchBot для search discovery и GPTBot controls. Осознанно решите, какие публичные пути доступны каждому именованному crawler, а приватные пути оставьте защищёнными.",
            ],
          },
          {
            heading: "2. Зафиксируйте один понятный URL для каждой важной страницы",
            paragraphs: [
              "Используйте стабильные HTTPS URL, self-referential canonical там, где он уместен, и sitemap с каноническими страницами, которые должны находить поисковые системы. Redirects, canonical и sitemap не должны противоречить друг другу.",
              "Не используйте robots.txt вместо noindex или авторизации. Crawling, indexing и access control решают разные задачи.",
            ],
          },
          {
            heading: "3. Опишите бизнес-сущность в видимом контенте",
            paragraphs: [
              "Страница должна прямо отвечать: кто вы, что предлагаете, для кого, где работаете и какое действие сделать дальше. Согласуйте публичное имя, локацию, контакты и основной оффер на главной, контактной и страницах услуг.",
              "Добавьте правдивые structured data, соответствующие видимому содержанию страницы. JSON-LD может яснее описать сущности и связи, но валидная разметка не гарантирует rich result, рекомендацию или ranking.",
            ],
          },
          {
            heading: "4. Пишите блоки, понятные без окружающего дизайна",
            paragraphs: [
              "После описательного заголовка дайте прямой ответ. Добавляйте конкретный scope, условия, локацию, цены или даты, только когда они подтверждены и уместны. Машине не должно требоваться декоративное расположение и три предыдущих раздела, чтобы понять утверждение.",
              "Citability checks — версионированные эвристики, а не доказанные ranking factors. Они находят неоднозначные блоки; только последующие measurements могут показать изменение наблюдаемой AI-видимости.",
            ],
          },
          {
            heading: "5. Перепроверьте конкретное исправление",
            paragraphs: [
              "До изменения сохраните URL, наблюдаемый фрагмент и правило. Посмотрите preview, опубликуйте правку через обычный контролируемый владельцем процесс сайта, затем создайте новый readiness scan. Старый результат остаётся baseline.",
              "Рост readiness означает, что сайт лучше соответствует раскрытым техническим и контентным критериям. Он не означает автоматически, что AI-системы чаще упоминают бренд. Для такого вывода нужен отдельный measurement cycle с тем же Configuration Lock.",
            ],
            points: [
              "Проверяйте до пяти ключевых страниц, а не только главную.",
              "Сохраняйте llms.txt диагностическим сигналом с нулевым весом.",
              "Не подключайте приватные аккаунты и платные provider calls к бесплатному readiness check.",
            ],
          },
        ],
        sources: [
          officialSources.openAiSearch,
          officialSources.googleCrawling,
          officialSources.googleCanonical,
          officialSources.googleStructuredData,
          officialSources.schemaOrg,
        ],
      },
      {
        section: "guides",
        slug: "read-ai-visibility-report-evidence",
        title: "Как читать AI Visibility Report и проверять evidence",
        summary:
          "Практика чтения Configuration Lock, знаменателей, citations, provenance, invalid runs и рекомендаций.",
        label: "Руководство по evidence",
        readingTime: "8 минут",
        updatedAt: "2026-08-16",
        blocks: [
          {
            heading: "Начните с Configuration Lock",
            paragraphs: [
              "До headline metric проверьте, что измерялось: канал, система, точная API-модель или visitor surface, web-search status, язык, регион, prompt families, language scenarios, repeats и дата. Эти поля определяют результат.",
              "Если в следующем цикле входные параметры изменились, это новая baseline version. Before/after имеет смысл только при сохранении релевантной методики и раскрытии изменённых переменных.",
            ],
          },
          {
            heading: "Проверяйте знаменатель, а не только процент",
            paragraphs: [
              "Mention rate 40% означает разное при 2 из 5 и при 80 из 200 ответов. Смотрите planned answers, valid answers, technical invalids, retries и отсутствующие строки. Одна неожиданная лишняя строка должна остановить цикл, а не раствориться в среднем.",
              "Retry относится только к одному конкретному technical invalid. Повтор всего prompt family или системы создаёт скрытый fan-out и может исказить выборку.",
            ],
          },
          {
            heading: "Проводите каждое утверждение к evidence",
            paragraphs: [
              "Для AI-answer finding откройте prompt, raw answer snapshot, систему, модель или поверхность, timestamp, citation URLs и validation state. Для website-readiness finding — page URL, text или HTML fragment, selector, rule ID и rule version.",
              "Citation URL доказывает, что ответ сослался на этот URL в сохранённом запуске. Это не доказывает автоматически корректность каждой фразы или поддержку конкретного утверждения источником — для этого нужен semantic citation review.",
            ],
          },
          {
            heading: "Разделяйте наблюдение, интерпретацию и действие",
            paragraphs: [
              "Observation описывает сохранённое evidence. Interpretation объясняет возможное значение. Recommendation предлагает изменение. Сильный отчёт показывает эти слои отдельно и не выдаёт предполагаемую причину за измеренный факт.",
              "Автоматические рекомендации должны быть так и обозначены. Статус Expert Verified требует реального QC record: semantic mentions, citations, factual errors и утверждённые priority actions.",
            ],
          },
          {
            heading: "Используйте отчёт как контролируемый loop",
            paragraphs: [
              "Выберите самое приоритетное evidence-backed исправление, посмотрите preview, внедрите его через owner-controlled процесс и перепроверьте точную страницу. Readiness before/after хранится отдельно от AI visibility before/after.",
              "Для real re-measurement сохраните тот же Configuration Lock. Покажите наблюдаемый delta со знаменателем и датой, а monitoring продолжайте только пока baseline остаётся сопоставимым.",
            ],
          },
        ],
        sources: [officialSources.googleStructuredData],
      },
    ],
  },
};

export const labSectionIds: LabSectionId[] = ["research", "guides", "experiments", "articles", "courses"];

export function labPath(locale: LabLocale, section?: LabSectionId, slug?: string) {
  const prefix = locale === "ru" ? "/ru/lab" : "/lab";
  return [prefix, section, slug].filter(Boolean).join("/");
}

export function labLanguages(section?: LabSectionId, slug?: string) {
  return {
    "x-default": labPath("en", section, slug),
    en: labPath("en", section, slug),
    ru: labPath("ru", section, slug),
  };
}

export function getLabSection(locale: LabLocale, section: string) {
  return labContent[locale].sections.find((item) => item.id === section) ?? null;
}

export function getLabItems(locale: LabLocale, section?: string) {
  return section ? labContent[locale].items.filter((item) => item.section === section) : labContent[locale].items;
}

export function getLabItem(locale: LabLocale, section: string, slug: string) {
  return labContent[locale].items.find((item) => item.section === section && item.slug === slug) ?? null;
}
