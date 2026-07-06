import { trust } from "@/lib/data/content";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Trust / scope control (cinematic brief §4.7) — the boundaries section.
 * Quiet and confident by design: no icons, no hover theatrics; five cards
 * with alternating copper/sage hairline top accents. The five items flow
 * as 2 + 3 on lg (six-column grid) so the last row never looks ragged.
 */

/** 2 wide + 3 regular on lg; the 5th card pairs up on sm so no row is left ragged. */
const cardSpans = [
  "lg:col-span-3",
  "lg:col-span-3",
  "lg:col-span-2",
  "lg:col-span-2",
  "sm:col-span-2 lg:col-span-2",
] as const;

export function TrustBoundarySection() {
  return (
    <section className="bg-warm-canvas py-20 sm:py-28">
      <Container>
        <SectionHeader eyebrow={trust.eyebrow} headline={trust.headline} />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-14 sm:grid-cols-2 lg:grid-cols-6">
          {trust.cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 80} className={cn("h-full", cardSpans[i])}>
              <Card
                hover={false}
                className={cn(
                  "h-full border-t-2",
                  i % 2 === 0 ? "border-t-copper/45" : "border-t-sage/60",
                )}
              >
                <h3 className="text-h3 text-ink">{card.title}</h3>
                <p className="mt-2.5 leading-relaxed text-muted">{card.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
