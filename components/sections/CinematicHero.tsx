import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { cta } from "@/data/site";

// Хаотичные входы бизнеса — из docs/00 §6. Только обезличенные категории,
// никаких «реальных» имён, телефонов и CRM-записей.
const chaosTags = [
  "сообщения",
  "заявки",
  "идеи контента",
  "CRM-заметки",
  "повторяющиеся вопросы",
  "документы",
  "задачи команды",
];

export default function CinematicHero() {
  return (
    <section className="bg-hero bg-grain overflow-hidden border-b border-line">
      <Container className="relative grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:py-28">
        <div className="relative z-10 max-w-xl">
          <Reveal>
            <Badge tone="copper">AI-внедрение · автоматизация · обучение</Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
              AI-внедрение и обучение для бизнеса{" "}
              <em className="font-serif italic text-copper-deep">без хаоса</em> и
              сложного кода
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Помогаю русскоязычным предпринимателям, экспертам и небольшим
              командам внедрять AI в контент, клиентские коммуникации, CRM,
              Telegram/WhatsApp, Notion, Make/Zapier и рабочие процессы.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/contact">{cta.primary}</Button>
              <Button href="/services" variant="secondary">
                {cta.secondary}
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted">
              Сначала задача и процесс. Потом инструмент, автоматизация и
              обучение.
            </p>
          </Reveal>
        </div>

        {/* Визуальная метафора «хаос → система»: рассыпанные входы слева
            собираются в структурированные рабочие карточки. Только CSS/SVG,
            только вымышленные плейсхолдеры. */}
        <Reveal delay={200} className="relative">
          <div aria-hidden="true" className="pointer-events-none absolute -left-4 top-0 hidden h-full w-40 lg:block">
            <svg
              className="absolute inset-0 h-full w-full text-copper/30"
              viewBox="0 0 160 600"
              fill="none"
              preserveAspectRatio="none"
            >
              <path d="M8 60 C 90 90, 100 180, 152 210" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 5" />
              <path d="M4 300 C 80 300, 90 320, 152 330" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 5" />
              <path d="M10 540 C 90 520, 100 440, 152 420" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 5" />
            </svg>
          </div>

          <ul aria-label="Хаотичные входы: что обычно накапливается в бизнесе" className="mb-6 flex flex-wrap gap-2 lg:absolute lg:-left-24 lg:top-1/2 lg:mb-0 lg:w-44 lg:-translate-y-1/2 lg:flex-col lg:items-start">
            {chaosTags.map((tag, i) => (
              <li
                key={tag}
                className="rounded-full border border-line bg-surface/80 px-3 py-1 text-xs text-muted shadow-card"
                style={{ transform: `rotate(${((i % 3) - 1) * 2.5}deg)` }}
              >
                {tag}
              </li>
            ))}
          </ul>

          <div className="relative flex flex-col gap-4 lg:pl-24">
            <div
              className="animate-float rounded-2xl border border-line bg-surface p-5 shadow-card-lg"
              style={{ "--float-delay": "0s" } as React.CSSProperties}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">AI-аудит</p>
                <Badge tone="copper">Карта возможностей</Badge>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-copper" />
                  Контент: высокая нагрузка
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-copper" />
                  Заявки: ручная обработка
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-copper" />
                  Команда: разные AI-сценарии
                </li>
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
                <span className="text-muted">Выбрать 3 быстрых сценария</span>
                <span className="font-medium text-copper-deep">Открыть карту</span>
              </div>
            </div>

            <div
              className="animate-float rounded-2xl border border-line bg-surface p-5 shadow-card-lg lg:-ml-10 lg:mr-10"
              style={{ "--float-delay": "1.4s" } as React.CSSProperties}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">AI-консьерж</p>
                <Badge tone="sage">Нужен human review перед запуском</Badge>
              </div>
              <p className="mt-3 text-sm text-ink/85">
                7 типовых вопросов можно вынести в первый сценарий
              </p>
              <p className="mt-1.5 text-sm text-muted">
                цены, запись, подготовка, адрес, формат услуги
              </p>
              <div className="mt-4 border-t border-line pt-3 text-sm">
                <span className="font-medium text-copper-deep">Собрать FAQ</span>
              </div>
            </div>

            <div
              className="animate-float rounded-2xl border border-line bg-surface p-5 shadow-card-lg lg:ml-14"
              style={{ "--float-delay": "2.8s" } as React.CSSProperties}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">Контент-система</p>
                <Badge tone="neutral">Черновики готовы к редактуре</Badge>
              </div>
              <p className="mt-3 text-sm text-ink/85">
                1 экспертный материал → 5 форматов
              </p>
              <div className="mt-4 border-t border-line pt-3 text-sm">
                <span className="font-medium text-copper-deep">
                  Собрать контент-план
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
