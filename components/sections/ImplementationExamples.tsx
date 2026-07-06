import { examples } from "@/lib/data/content";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Implementation examples (cinematic brief §4.6) — honest scenarios of
 * possible solutions, NOT client case studies. The disclaimer renders
 * visibly right under the header: it is part of the trust design, never
 * a footnote to hide.
 */
export function ImplementationExamples() {
  return (
    <section className="border-y border-line bg-surface py-20 sm:py-28">
      <Container>
        <SectionHeader eyebrow={examples.eyebrow} headline={examples.headline} />

        {/* Honesty label — deliberately prominent, directly under the header */}
        <Reveal delay={80}>
          <p className="mt-6 flex max-w-2xl items-start gap-3 text-sm leading-relaxed text-muted">
            <span
              className="mt-[0.4rem] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-copper"
              aria-hidden
            />
            {examples.disclaimer}
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6">
          {examples.items.map((e, i) => (
            <Reveal key={e.id} delay={i * 80} className="h-full">
              <Card className="flex h-full flex-col">
                <div>
                  <Badge tone="copper">{e.context}</Badge>
                </div>
                <h3 className="mt-5 text-h3 text-ink">{e.title}</h3>
                <p className="mt-2.5 leading-relaxed text-muted">{e.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
