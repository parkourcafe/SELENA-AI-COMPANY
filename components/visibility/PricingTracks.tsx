import type { PricingPlan, VisibilityContent } from "@/lib/visibility/types";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

export function PricingTracks({
  content,
  showHeader = true,
}: {
  content: VisibilityContent["pricing"];
  showHeader?: boolean;
}) {
  return (
    <section id="plans" className="bg-surface py-20 sm:py-28">
      <Container>
        {showHeader ? (
          <SectionHeader eyebrow={content.eyebrow} headline={content.title} intro={content.intro} />
        ) : null}

        <Reveal
          className={cn(
            "flex flex-col gap-5 border-y border-line py-6 sm:flex-row sm:items-center sm:justify-between",
            showHeader && "mt-10",
          )}
        >
          <div>
            <p className="font-semibold text-ink">{content.portal.note}</p>
          </div>
          <Button href={content.portal.href} variant="secondary" className="w-full shrink-0 sm:w-auto">
            {content.portal.label}
          </Button>
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-8">
          {content.tracks.map((track, trackIndex) => (
            <Reveal key={track.title} delay={trackIndex * 100}>
              <section aria-labelledby={`pricing-track-${trackIndex}`}>
                <h3 id={`pricing-track-${trackIndex}`} className="text-h3 text-ink">
                  {track.title}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{track.intro}</p>

                <div className="mt-6 grid gap-5">
                  {track.plans.map((plan) => (
                    <PlanCard key={plan.name} plan={plan} />
                  ))}
                </div>
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 border-t border-line pt-6">
          <p className="max-w-4xl text-sm leading-relaxed text-muted">{content.disclosure}</p>
        </Reveal>
      </Container>
    </section>
  );
}

function PlanCard({ plan }: { plan: PricingPlan }) {
  const featured = plan.featured === true;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-[1rem] border p-6 shadow-[0_2px_2px_rgba(24,22,20,0.02),0_18px_44px_-30px_rgba(24,22,20,0.32)] sm:p-7",
        featured ? "border-copper-deep/65 bg-charcoal text-ivory" : "border-line bg-ivory text-ink",
      )}
    >
      {featured ? <div className="absolute inset-x-0 top-0 h-1 bg-copper" aria-hidden /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className={cn("text-xl font-semibold", featured ? "text-ivory" : "text-ink")}>
            {plan.name}
          </h4>
          <p className={cn("mt-2 text-sm", featured ? "text-ivory/64" : "text-muted")}>
            {plan.systemsLabel}
          </p>
        </div>
        <p
          className={cn(
            "shrink-0 font-serif text-2xl font-semibold",
            featured ? "text-copper" : "text-copper-deep",
          )}
        >
          {plan.price}
        </p>
      </div>

      <span
        className={cn(
          "mt-5 inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
          featured && "border-ivory/18 bg-ivory/7 text-ivory/82",
          !featured && plan.status === "active" && "border-sage/40 bg-sage/15 text-[#5f6b52]",
          !featured && plan.status === "beta" && "border-copper/30 bg-copper/10 text-copper-deep",
          !featured && plan.status === "founding_soon" && "border-line bg-surface text-muted",
        )}
      >
        {plan.statusLabel}
      </span>

      <p className={cn("mt-5 leading-relaxed", featured ? "text-ivory/76" : "text-muted")}>
        {plan.description}
      </p>

      <p
        className={cn(
          "mt-5 border-y py-3 text-sm font-semibold",
          featured ? "border-ivory/12 text-ivory" : "border-line text-ink",
        )}
      >
        {plan.volumeLabel}
      </p>

      <ul className="mt-5 space-y-3">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className={cn(
              "flex items-start gap-3 text-sm leading-relaxed",
              featured ? "text-ivory/72" : "text-muted",
            )}
          >
            <span
              className={cn(
                "mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full",
                featured ? "bg-copper" : "bg-copper-deep",
              )}
              aria-hidden
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {plan.href && plan.ctaLabel ? (
        <Button
          href={plan.href}
          variant={featured ? "onDark" : "secondary"}
          size="md"
          className="mt-7 w-full sm:w-fit"
        >
          {plan.ctaLabel}
        </Button>
      ) : null}
    </article>
  );
}
