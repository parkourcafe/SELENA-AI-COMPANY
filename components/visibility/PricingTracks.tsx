import type { PricingPlan, VisibilityContent } from "@/lib/visibility/types";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { CLIENT_PORTAL_ENABLED } from "@/lib/visibility/routes";

export function PricingDirectory({
  content,
}: {
  content: VisibilityContent["pricing"]["directory"];
}) {
  const destinations = [content.visibility, content.systems];

  return (
    <section className="border-y border-line bg-ivory py-10 sm:py-12">
      <Container size="wide">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <Reveal>
            <h2 className="text-h2 text-ink">{content.heading}</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted">{content.intro}</p>
          </Reveal>

          <div className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2">
            {destinations.map((destination, index) => (
              <Reveal key={destination.title} delay={index * 90} className="h-full">
                <a
                  href={destination.href}
                  className="group flex h-full flex-col bg-surface p-5 transition-colors duration-300 hover:bg-warm-canvas sm:p-6"
                >
                  <h3 className="text-h3 text-ink">{destination.title}</h3>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-copper-deep">
                    {destination.count}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{destination.description}</p>
                  <span className="mt-auto pt-5 text-sm font-semibold text-copper-deep underline decoration-copper/45 underline-offset-4 group-hover:decoration-copper-deep">
                    {destination.ctaLabel}
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

export function PricingTracks({
  content,
  showHeader = true,
}: {
  content: VisibilityContent["pricing"];
  showHeader?: boolean;
}) {
  // The free entry is the first card of the same row as the paid plans, so a
  // visitor can compare what each next step adds without opening a page.
  const freeEntry: ComparedPlan = {
    plan: {
      name: content.freePlan.name,
      price: content.freePlan.price,
      status: "active",
      statusLabel: content.freePlan.statusLabel,
      description: content.freePlan.description,
      systemsLabel: content.freePlan.systemsLabel,
      volumeLabel: content.freePlan.volumeLabel,
      progressionLabel: content.freePlan.progressionLabel,
      features: content.freePlan.features,
      href: content.freePlan.href,
      ctaLabel: content.freePlan.ctaLabel,
    },
    trackTitle: content.freePlan.trackLabel,
    boundary: content.freePlan.boundary,
  };

  const plans: ComparedPlan[] = [
    freeEntry,
    ...content.tracks.flatMap((track) =>
      track.plans.map((plan) => ({ plan, trackTitle: track.title })),
    ),
  ];

  return (
    <section id="plans" className="bg-surface py-16 sm:py-20">
      <Container size="wide">
        {showHeader ? (
          <SectionHeader eyebrow={content.eyebrow} headline={content.title} intro={content.intro} />
        ) : null}

        <Reveal className={cn("max-w-3xl", showHeader && "mt-12")}>
          <h3 className="text-h2 text-ink">{content.paidPlans.heading}</h3>
          <p className="mt-4 leading-relaxed text-muted">{content.paidPlans.intro}</p>
        </Reveal>

        {/* One row of equal cards: the free entry and every paid step show their
            price and what is included without opening another page. */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-4">
          {plans.map(({ plan, trackTitle, boundary }, index) => (
            <Reveal key={plan.name} delay={index * 60} className="h-full">
              <PlanCard
                plan={plan}
                trackTitle={trackTitle}
                boundary={boundary}
                labels={content.paidPlans.comparisonLabels}
              />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 border-t border-line pt-6">
          <p className="max-w-4xl text-sm leading-relaxed text-muted">{content.disclosure}</p>
        </Reveal>

        {CLIENT_PORTAL_ENABLED && (
          <Reveal className="mt-8 flex flex-col gap-5 border-y border-line py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-ink">{content.portal.note}</p>
            <Button href={content.portal.href} variant="secondary" className="w-full shrink-0 sm:w-auto">
              {content.portal.label}
            </Button>
          </Reveal>
        )}
      </Container>
    </section>
  );
}

type ComparedPlan = { plan: PricingPlan; trackTitle: string; boundary?: string };
type ComparisonLabels = VisibilityContent["pricing"]["paidPlans"]["comparisonLabels"];

function PlanCard({
  plan,
  trackTitle,
  boundary,
  labels,
}: {
  plan: PricingPlan;
  trackTitle: string;
  boundary?: string;
  labels: ComparisonLabels;
}) {
  const featured = plan.featured === true;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-[1rem] border p-6 shadow-[0_2px_2px_rgba(24,22,20,0.02),0_18px_44px_-30px_rgba(24,22,20,0.32)]",
        featured ? "border-copper-deep/65 bg-charcoal text-ivory" : "border-line bg-ivory text-ink",
      )}
    >
      {featured ? <div className="absolute inset-x-0 top-0 h-1 bg-copper" aria-hidden /> : null}

      <p className={cn("text-xs font-semibold uppercase tracking-[0.16em]", featured ? "text-copper" : "text-copper-deep")}>
        {trackTitle}
      </p>
      <h4 className={cn("mt-4 text-xl font-semibold leading-snug", featured ? "text-ivory" : "text-ink")}>
        {plan.name}
      </h4>
      <p
        className={cn(
          "mt-4 font-serif text-4xl font-semibold leading-none",
          featured ? "text-copper" : "text-copper-deep",
        )}
      >
        {plan.price}
      </p>

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
      {boundary ? (
        <p className={cn("mt-3 text-sm leading-relaxed", featured ? "text-ivory/58" : "text-muted")}>
          {boundary}
        </p>
      ) : null}

      <dl className={cn("mt-5 border-y", featured ? "border-ivory/12" : "border-line")}>
        {[
          [labels.systems, plan.systemsLabel],
          [labels.scope, plan.volumeLabel],
          [labels.difference, plan.progressionLabel],
        ].map(([label, value]) => (
          <div
            key={label}
            className={cn("border-b py-3 last:border-b-0", featured ? "border-ivory/12" : "border-line")}
          >
            <dt className={cn("text-base font-semibold uppercase tracking-[0.14em]", featured ? "text-copper" : "text-copper-deep")}>
              {label}
            </dt>
            <dd className={cn("mt-1.5 text-sm font-semibold leading-relaxed", featured ? "text-ivory" : "text-ink")}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <p className={cn("mt-5 text-base font-semibold uppercase tracking-[0.14em]", featured ? "text-copper" : "text-copper-deep")}>
        {labels.included}
      </p>
      <ul className="mt-3 space-y-3">
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
        <div className="mt-auto pt-7">
          <Button
            href={plan.href}
            variant={featured ? "onDark" : "secondary"}
            size="md"
            className="w-full"
          >
            {plan.ctaLabel}
          </Button>
        </div>
      ) : null}
    </article>
  );
}
