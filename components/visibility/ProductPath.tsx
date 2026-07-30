import type { ProductPathStep } from "@/lib/visibility/types";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";

export function ProductPath({
  eyebrow,
  headline,
  intro,
  steps,
}: {
  eyebrow: string;
  headline: string;
  intro: string;
  steps: ProductPathStep[];
}) {
  return (
    <section className="bg-surface py-20 sm:py-28">
      <Container>
        <SectionHeader eyebrow={eyebrow} headline={headline} intro={intro} />
        <ol className="mt-12 space-y-5 sm:mt-14">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 80} as="li">
              <div className="card-premium flex flex-col gap-2 p-6 sm:flex-row sm:items-start sm:gap-6 sm:p-7">
                <span className="font-serif text-2xl font-semibold text-copper-deep sm:w-10 sm:shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-h3 text-ink">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{step.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
