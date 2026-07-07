import { cta } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

/**
 * Cinematic hero (master prompt §6, cinematic brief §3).
 * Left: headline / subheadline / CTAs / trust line.
 * Right: the core visual metaphor — messy business inputs flowing into
 * structured cards: AI map, concierge and content system.
 * All data on the cards is fictional-by-design: statuses and scenarios,
 * never client names, metrics or real-looking records.
 */

const messyInputs = [
  "Заявки",
  "FAQ",
  "Контент",
  "CRM",
  "Notion",
  "Telegram",
  "WhatsApp",
  "Команда",
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
              <Badge tone="copper">AI-внедрение и обучение для бизнеса</Badge>
            </div>

            <h1
              className="animate-drift-in mt-6 font-serif text-display font-semibold text-ink"
              style={{ animationDelay: "0.15s" }}
            >
              Где бизнес теряет время, а где AI действительно нужен?
            </h1>

            <p
              className="animate-drift-in mt-6 max-w-xl text-lg leading-relaxed text-muted"
              style={{ animationDelay: "0.3s" }}
            >
              Разбираю заявки, ответы, контент, CRM и командную рутину. Затем
              собираю AI-сценарии, автоматизации и правила работы без сложного кода.
            </p>

            <div
              className="animate-drift-in mt-9 flex flex-wrap items-center gap-4"
              style={{ animationDelay: "0.45s" }}
            >
              <Button href={cta.primary.href} size="lg">
                {cta.primary.label}
              </Button>
              <Button href={cta.calculator.href} size="lg" variant="secondary">
                {cta.calculator.label}
              </Button>
            </div>

            <p
              className="animate-drift-in mt-7 flex items-center gap-3 text-sm font-medium text-ink/70"
              style={{ animationDelay: "0.6s" }}
            >
              <span className="inline-block h-px w-8 bg-copper" aria-hidden />
              Сначала процесс. Потом инструмент, автоматизация или человек.
            </p>
          </div>

          {/* ---------- Cinematic visual: chaos → system ---------- */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none" aria-hidden>
            <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-[0.8fr_1.2fr] sm:gap-6">
              {/* Messy inputs: wrapping cloud on mobile, scattered column from sm */}
              <div className="relative flex flex-row flex-wrap items-start gap-2.5 sm:flex-col sm:py-6">
                {messyInputs.map((tag, i) => (
                  // Outer span owns the entrance animation; inner span owns the
                  // static tilt — otherwise drift-in's final transform (fill:both)
                  // would wipe the rotation and every chip would render straight.
                  <span
                    key={tag}
                    className="animate-drift-in inline-block sm:ml-[var(--scatter)]"
                    style={
                      {
                        animationDelay: `${0.25 + i * 0.09}s`,
                        "--scatter": `${[0, 14, 4, 20, 8, 16, 2][i]}px`,
                      } as React.CSSProperties
                    }
                  >
                    <span
                      className="inline-block rounded-full border border-line bg-surface/80 px-3 py-1.5 text-[0.72rem] font-medium text-muted shadow-sm"
                      style={{ transform: `rotate(${[-2, 1.5, -1, 2, -1.5, 1, -2][i]}deg)` }}
                    >
                      {tag}
                    </span>
                  </span>
                ))}
              </div>

              {/* Mobile connector: chaos flows down into the system */}
              <div className="flex items-center justify-center gap-3 py-1 sm:hidden">
                <svg
                  className="h-10 w-4 text-copper/60"
                  viewBox="0 0 16 40"
                  fill="none"
                >
                  <path
                    d="M 8 0 V 32 M 3 27 L 8 33 L 13 27"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="5 5"
                    className="animate-flow-dash"
                  />
                </svg>
              </div>

              {/* Flow lines: chaos organizing into structure (sm+) */}
              <svg
                className="pointer-events-none absolute left-[28%] top-0 hidden h-full w-[24%] text-copper/50 sm:block"
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
                <HeroCard title="AI-карта возможностей" driftDelay="0.5s" floatDelay="0s">
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
                    Предварительная диагностика
                  </p>
                  <ul className="mt-3 space-y-1.5 text-[0.8rem] leading-snug text-ink/80">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                      Заявки: кандидат на сценарий
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                      Контент: нужна система
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                      Команда: нужны единые правила
                    </li>
                  </ul>
                  <p className="mt-3 border-t border-line pt-2.5 text-[0.78rem] font-medium text-copper-deep">
                    → 3 задачи-кандидата для разбора
                  </p>
                </HeroCard>

                <HeroCard
                  title="AI-консьерж"
                  driftDelay="0.7s"
                  floatDelay="1.4s"
                  className="sm:-ml-6 lg:-ml-10"
                >
                  <p className="mt-2 text-[0.82rem] leading-snug text-ink/80">
                    Типовые вопросы можно вынести в первый сценарий
                  </p>
                  <p className="mt-1.5 text-[0.72rem] text-muted">
                    цены · запись · подготовка · формат · передача человеку
                  </p>
                  <div className="mt-3 border-t border-line pt-2.5">
                    <Badge tone="sage">Нужна проверка перед запуском</Badge>
                  </div>
                </HeroCard>

                <HeroCard title="Контент-система" driftDelay="0.9s" floatDelay="2.8s">
                  <p className="mt-2 text-[0.82rem] leading-snug text-ink/80">
                    1 экспертный материал <span className="text-copper-deep">→</span> 5 форматов
                  </p>
                  <div className="mt-3 border-t border-line pt-2.5">
                    <Badge tone="neutral">Оценка без гарантий и фейковых цифр</Badge>
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
