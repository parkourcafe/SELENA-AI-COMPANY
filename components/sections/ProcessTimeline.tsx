import { process } from "@/lib/data/content";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Engagement process — vertical editorial timeline. A single hairline
 * spine carries six copper-numbered nodes; one calm column, mobile-first.
 * On lg the content column breathes wider but the spine stays put, so the
 * eye follows one continuous line from brief to ongoing support.
 */
export function ProcessTimeline() {
  return (
    <section className="bg-ivory py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow={process.eyebrow}
          headline={process.headline}
          intro={process.intro}
        />

        <ol className="relative mt-14 max-w-3xl sm:mt-16">
          {/* Hairline spine behind the numbered nodes */}
          <span
            className="absolute bottom-6 left-5 top-6 w-px border-l border-line sm:left-6"
            aria-hidden
          />

          {process.steps.map((step, i) => (
            <Reveal
              as="li"
              key={step.n}
              delay={i * 80}
              className="relative pb-12 pl-16 last:pb-0 sm:pb-14 sm:pl-20"
            >
              {/* Copper numbered node — ivory fill masks the spine */}
              <span
                className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-copper/40 bg-ivory font-serif text-sm font-semibold text-copper-deep shadow-sm sm:h-12 sm:w-12 sm:text-base"
                aria-hidden
              >
                {step.n}
              </span>

              <h3 className="pt-1.5 text-h3 text-ink sm:pt-2.5">{step.title}</h3>
              <p className="mt-2 max-w-xl leading-relaxed text-muted">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
