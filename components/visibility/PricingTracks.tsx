import type { VisibilityContent } from "@/lib/visibility/types";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

export function PricingTracks({ content }: { content: VisibilityContent["pricing"] }) {
  return (
    <section className="bg-surface py-20 sm:py-28">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} headline={content.title} intro={content.intro} />

        <div className="mt-12 grid gap-10 sm:mt-14 lg:grid-cols-2 lg:gap-8">
          {content.tracks.map((track, trackIndex) => (
            <Reveal key={track.title} delay={trackIndex * 100}>
              <div>
                <h3 className="text-h3 text-ink">{track.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{track.intro}</p>

                <div className="mt-6 space-y-5">
                  {track.plans.map((plan) => (
                    <Card key={plan.name} hover={false} className="flex flex-col gap-3">
                      <div className="flex items-baseline justify-between gap-4">
                        <h4 className="text-lg font-semibold text-ink">{plan.name}</h4>
                        <span className="font-serif text-xl font-semibold text-copper-deep">
                          {plan.price}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
                          plan.status === "active" && "border-sage/40 bg-sage/15 text-[#5f6b52]",
                          plan.status === "beta" && "border-copper/30 bg-copper/10 text-copper-deep",
                          plan.status === "founding_soon" && "border-line bg-surface text-muted",
                        )}
                      >
                        {plan.statusLabel}
                      </span>
                      <p className="text-sm leading-relaxed text-muted">{plan.description}</p>
                      {plan.href && plan.ctaLabel ? (
                        <Button href={plan.href} variant="secondary" size="md" className="mt-2 w-fit">
                          {plan.ctaLabel}
                        </Button>
                      ) : null}
                    </Card>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
