import { cta } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

/**
 * Cinematic hero (master prompt §6, cinematic brief §3).
 * Left: headline / subheadline / CTAs / trust line.
 * Right: the core visual metaphor — messy business inputs flowing into
 * three structured floating cards (audit map, concierge, content system).
 * All data on the cards is fictional-by-design: statuses and scenarios,
 * never client names, metrics or real-looking records.
 */

const messyInputs = [
  "Сообщения из чатов",
  "Заявки",
  "Идеи контента",
  "CRM-заметки",
  "Повторяющиеся вопросы",
  "Документы",
  "Задачи команды",
];

function HeroCard({
  title,
  children,
  className,
  floatDelay = "0s",
  driftDelay = "0.2s",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  floatDelay?: string;
  driftDelay?: string;
}) {
  return (
    <div
      className={`card-premium animate-drift-in p-5 ${className ?? ""}`}
      style={{ animationDelay: driftDelay }}
    >
      <div className="animate-float-soft" style={{ animationDelay: floatDelay }}>
        <div className="flex items-center justify-between gap-3">
          <p className="font-serif text-[1.05rem] font-semibold text-ink">{title}</p>
          <span className="h-2 w-2 rounded-full bg-copper" aria-hidden />
        </div>
        {children}
      </div>
    </div>
  );
}

export function CinematicHero() {
  return (
    <section className="bg-warm-canvas relative overflow-hidden pt-28 sm:pt-36">
      {/* Faint structural grid behind the visual */}
      <div
        className="grid-texture pointer-events-none absolute -right-32 top-10 hidden h-[42rem] w-[42rem] lg:block"
        aria-hidden
      />

      <Container size="wide" className="relative">
        <div className="grid items-center gap-14 pb-20 sm:pb-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* ---------- Copy ---------- */}
          <div className="max-w-2xl">
            <div className="animate-drift-in" style={{ animationDelay: "0.05s" }}>
              <Badge tone="copper">AI-внедрение · автоматизация · обучение</Badge>
            </div>

            <h1
              className="animate-drift-in mt-6 font-serif text-display font-semibold text-ink"
              style={{ animationDelay: "0.15s" }}
            >
              AI-внедрение и обучение для бизнеса{" "}
              <span className="text-copper-deep">без хаоса</span> и сложного кода
            </h1>

            <p
              className="animate-drift-in mt-6 max-w-xl text-lg leading-relaxed text-muted"
              style={{ animationDelay: "0.3s" }}
            >
              Помогаю русскоязычным предпринимателям, экспертам и небольшим командам
              внедрять AI в контент, клиентские коммуникации, CRM, Telegram/WhatsApp,
              Notion, Make/Zapier и рабочие процессы.
            </p>

            <div
              className="animate-drift-in mt-9 flex flex-wrap items-center gap-4"
              style={{ animationDelay: "0.45s" }}
            >
              <Button href={cta.primary.href} size="lg">
                {cta.primary.label}
              </Button>
              <Button href={cta.secondary.href} size="lg" variant="secondary">
                {cta.secondary.label}
              </Button>
            </div>

            <p
              className="animate-drift-in mt-7 flex items-center gap-3 text-sm font-medium text-ink/70"
              style={{ animationDelay: "0.6s" }}
            >
              <span className="inline-block h-px w-8 bg-copper" aria-hidden />
              Сначала задача и процесс. Потом инструмент, автоматизация и обучение.
            </p>
          </div>

          {/* ---------- Cinematic visual: chaos → system ---------- */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none" aria-hidden>
            <div className="relative grid grid-cols-[0.8fr_1.2fr] gap-4 sm:gap-6">
              {/* Messy inputs column */}
              <div className="relative flex flex-col items-start gap-2.5 py-6">
                {messyInputs.map((tag, i) => (
                  <span
                    key={tag}
                    className="animate-drift-in inline-block rounded-full border border-line bg-surface/80 px-3 py-1.5 text-[0.72rem] font-medium text-muted shadow-sm"
                    style={{
                      animationDelay: `${0.25 + i * 0.09}s`,
                      transform: `rotate(${[-2, 1.5, -1, 2, -1.5, 1, -2][i]}deg)`,
                      marginLeft: `${[0, 14, 4, 20, 8, 16, 2][i]}px`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Flow lines: chaos organizing into structure */}
              <svg
                className="pointer-events-none absolute left-[28%] top-0 h-full w-[24%] text-copper/50"
                viewBox="0 0 100 400"
                fill="none"
                preserveAspectRatio="none"
              >
                {[60, 200, 340].map((y, i) => (
                  <path
                    key={y}
                    d={`M 0 ${y} C 45 ${y}, 55 ${200 + (i - 1) * 90}, 100 ${200 + (i - 1) * 90}`}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="6 6"
                    className="animate-flow-dash"
                    style={{ animationDelay: `${i * 0.4}s` }}
                  />
                ))}
              </svg>

              {/* Structured output cards */}
              <div className="relative flex flex-col gap-4 sm:gap-5">
                <HeroCard title="AI-аудит" driftDelay="0.5s" floatDelay="0s">
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
                    Карта возможностей
                  </p>
                  <ul className="mt-3 space-y-1.5 text-[0.8rem] leading-snug text-ink/80">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                      Контент: высокая нагрузка
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                      Заявки: ручная обработка
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                      Команда: разные AI-сценарии
                    </li>
                  </ul>
                  <p className="mt-3 border-t border-line pt-2.5 text-[0.78rem] font-medium text-copper-deep">
                    → Выбрать 3 быстрых сценария
                  </p>
                </HeroCard>

                <HeroCard
                  title="AI-консьерж"
                  driftDelay="0.7s"
                  floatDelay="1.4s"
                  className="sm:-ml-6 lg:-ml-10"
                >
                  <p className="mt-2 text-[0.82rem] leading-snug text-ink/80">
                    7 типовых вопросов можно вынести в первый сценарий
                  </p>
                  <p className="mt-1.5 text-[0.72rem] text-muted">
                    цены · запись · подготовка · адрес · формат услуги
                  </p>
                  <div className="mt-3 border-t border-line pt-2.5">
                    <Badge tone="sage">Нужен human review перед запуском</Badge>
                  </div>
                </HeroCard>

                <HeroCard title="Контент-система" driftDelay="0.9s" floatDelay="2.8s">
                  <p className="mt-2 text-[0.82rem] leading-snug text-ink/80">
                    1 экспертный материал <span className="text-copper-deep">→</span> 5 форматов
                  </p>
                  <div className="mt-3 border-t border-line pt-2.5">
                    <Badge tone="neutral">Черновики готовы к редактуре</Badge>
                  </div>
                </HeroCard>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
