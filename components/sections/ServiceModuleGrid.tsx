import Image from "next/image";
import Link from "next/link";
import { services } from "@/lib/data/services";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

/**
 * The 8 productized service modules (contract §Section components).
 * Cinematic service atlas: each module gets its own generated frame so
 * visitors can distinguish the service type before reading the details.
 * `withHeader={false}` renders the section without its own opener — used
 * on /services, which brings its own hero.
 */
export function ServiceModuleGrid({ withHeader = true }: { withHeader?: boolean }) {
  return (
    <section className="bg-ivory py-20 sm:py-28">
      <Container size="wide">
        {withHeader ? (
          <SectionHeader
            eyebrow="Услуги"
            headline="Восемь модулей, которые видно с первого взгляда"
            intro="Каждая услуга отвечает за свой слой AI-системы: диагностику, командную практику, автоматизацию, контент, клиентские ответы, знания, упаковку или сопровождение."
          />
        ) : null}

        <div
          className={cn(
            "grid gap-7 sm:gap-8",
            withHeader && "mt-14 sm:mt-16",
          )}
        >
          {services.map((s, i) => (
            <Reveal key={s.id} delay={i * 80}>
              <article className="group/service overflow-hidden rounded-[1rem] border border-line bg-surface shadow-[0_1px_1px_rgba(24,22,20,0.03),0_18px_44px_-30px_rgba(24,22,20,0.34)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_2px_2px_rgba(24,22,20,0.03),0_28px_70px_-38px_rgba(24,22,20,0.44)]">
                <div className="grid lg:grid-cols-[0.98fr_1.02fr]">
                  <div
                    className={cn(
                      "relative min-h-[18rem] overflow-hidden border-b border-line bg-charcoal sm:min-h-[22rem] lg:min-h-[25rem] lg:border-b-0",
                      i % 2 === 1 ? "lg:order-2 lg:border-l" : "lg:border-r",
                    )}
                  >
                    <Image
                      src={s.visual.src}
                      alt={s.visual.alt}
                      fill
                      sizes="(min-width: 1024px) 44vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover/service:scale-[1.025]"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/34 via-transparent to-transparent"
                      aria-hidden
                    />
                    <p className="absolute bottom-5 left-5 rounded-full border border-ivory/18 bg-charcoal/42 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-ivory/78 backdrop-blur-sm sm:bottom-6 sm:left-6">
                      {s.visual.label}
                    </p>
                  </div>

                  <div className="flex min-h-full flex-col p-6 sm:p-8 lg:p-10">
                    <div className="flex items-start justify-between gap-6 border-b border-line pb-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-deep">
                          {s.index} / {s.name}
                        </p>
                        <h3 className="mt-4 text-h2 text-ink">{s.name}</h3>
                      </div>
                      <span className="mt-1 hidden h-2 w-2 rounded-full bg-copper sm:block" aria-hidden />
                    </div>

                    <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/78">
                      {s.promise}
                    </p>

                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                      {s.included.map((item) => (
                        <div key={item} className="border-t border-line pt-4">
                          <span className="block h-1.5 w-1.5 rounded-full bg-copper" aria-hidden />
                          <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/80">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto flex flex-col gap-4 pt-8 sm:flex-row sm:items-end sm:justify-between">
                      <p className="max-w-md text-sm italic leading-relaxed text-muted">
                        {s.audience}
                      </p>

                      <Link
                        href={s.href}
                        className="group/link inline-flex items-center gap-2 text-sm font-semibold text-copper-deep transition-colors hover:text-copper"
                      >
                        <span
                          className="transition-transform duration-300 group-hover/link:translate-x-1"
                          aria-hidden
                        >
                          →
                        </span>
                        {s.ctaLabel}
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
