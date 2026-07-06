import { cta } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Final CTA (contract §Section components, brief §4.10).
 * Dark closing moment: charcoal band, centered copy, a single soft
 * radial copper glow (pointer-events-none) and one clear next step —
 * the AI-map brief. No urgency, no promises: just a low-friction diagnostic.
 */
export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-charcoal py-24 sm:py-32">
      {/* Subtle radial copper glow behind the copy */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(52rem 30rem at 50% -4%, color-mix(in srgb, var(--color-copper) 17%, transparent), transparent 65%)",
        }}
        aria-hidden
      />

      <Container size="narrow" className="relative text-center">
        <SectionHeader
          eyebrow="Следующий шаг"
          headline="Получите AI-карту возможностей для вашего бизнеса"
          intro="Опишите, где сейчас уходит время. Я помогу определить 3 задачи, с которых можно начать: без технической паники и без обещаний «автоматизировать всё»."
          onDark
          align="center"
        />

        <Reveal delay={160} className="mt-10 flex flex-wrap justify-center gap-4">
          <Button href={cta.brief.href} variant="onDark" size="lg">
            {cta.brief.label}
          </Button>
          <Button
            href={cta.secondary.href}
            variant="ghost"
            size="lg"
            className="text-ivory hover:text-ivory/75"
          >
            {cta.secondary.label}
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
