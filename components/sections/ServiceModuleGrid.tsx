import Link from "next/link";
import { services } from "@/lib/data/services";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

/**
 * The 8 productized service modules (contract §Section components).
 * Editorial premium cards: index numeral, serif name, one-line promise,
 * concrete deliverables with copper dot markers, audience line and an
 * arrow CTA. `withHeader={false}` renders the grid without its own
 * opener — used on /services, which brings its own hero.
 */
export function ServiceModuleGrid({ withHeader = true }: { withHeader?: boolean }) {
  return (
    <section className="bg-ivory py-20 sm:py-28">
      <Container>
        {withHeader ? (
          <SectionHeader
            eyebrow="Услуги"
            headline="Восемь модулей. Одна система."
            intro="От диагностики до сопровождения. Начать можно с одного модуля — состав и формат определяются после брифа, под вашу задачу."
          />
        ) : null}

        <div
          className={cn(
            "grid gap-6 sm:gap-8 lg:grid-cols-2",
            withHeader && "mt-14 sm:mt-16",
          )}
        >
          {services.map((s, i) => (
            <Reveal key={s.id} delay={i * 80}>
              <Card className="flex h-full flex-col">
                {/* Index numeral + quiet copper hairline */}
                <div className="flex items-center justify-between gap-4">
                  <span className="font-serif text-sm font-medium tracking-[0.18em] text-muted">
                    {s.index}
                  </span>
                  <span className="h-px w-10 bg-copper/40" aria-hidden />
                </div>

                <h3 className="mt-4 text-h3 text-ink">{s.name}</h3>

                <p className="mt-3 leading-relaxed text-muted">{s.promise}</p>

                {/* pb keeps a minimum gap above the footer even when mt-auto collapses */}
                <ul className="mt-6 space-y-2.5 pb-7">
                  {s.included.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-copper"
                        aria-hidden
                      />
                      <span className="text-[0.95rem] leading-relaxed text-ink/80">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Audience line pinned to the card footer with the CTA */}
                <p className="mt-auto border-t border-line pt-4 text-sm italic leading-relaxed text-muted">
                  {s.audience}
                </p>

                <Link
                  href={s.href}
                  className="group/link mt-4 inline-flex items-center gap-2 text-sm font-semibold text-copper-deep transition-colors hover:text-copper-deeper"
                >
                  <span
                    className="transition-transform duration-300 group-hover/link:translate-x-1"
                    aria-hidden
                  >
                    →
                  </span>
                  {s.ctaLabel}
                </Link>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
