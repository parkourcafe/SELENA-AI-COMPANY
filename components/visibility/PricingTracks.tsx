import type { PricingPlan, VisibilityContent } from "@/lib/visibility/types";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

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
  const plans = content.tracks.flatMap((track) =>
    track.plans.map((plan) => ({ plan, trackTitle: track.title })),
  );

  return (
    <section id="plans" className="bg-surface py-16 sm:py-20">
      <Container size="wide">
        {showHeader ? (
          <SectionHeader eyebrow={content.eyebrow} headline={content.title} intro={content.intro} />
        ) : null}

        <Reveal className={cn("overflow-hidden rounded-[1rem] bg-charcoal text-ivory", showHeader && "mt-10")}>
          <article className="grid lg:grid-cols-[0.88fr_1.12fr] lg:items-stretch">
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h3 className="text-h2 text-ivory">{content.freePlan.name}</h3>
                <p className="font-serif text-4xl font-semibold text-copper">{content.freePlan.price}</p>
              </div>
              <p className="mt-4 max-w-xl leading-relaxed text-ivory/76">
                {content.freePlan.description}
              </p>
              <p className="mt-4 border-t border-ivory/12 pt-4 text-sm leading-relaxed text-ivory/58">
                {content.freePlan.boundary}
              </p>
              <Button href={content.freePlan.href} variant="onDark" className="mt-6 w-full sm:w-auto">
                {content.freePlan.ctaLabel}
              </Button>
            </div>

            <ul className="grid gap-px border-t border-ivory/12 bg-ivory/12 sm:grid-cols-2 lg:border-l lg:border-t-0">
              {content.freePlan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 bg-charcoal-2 p-4 text-sm leading-relaxed text-ivory/72 sm:p-5">
                  <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-copper" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>
        </Reveal>

        <Reveal className="mt-12 max-w-3xl">
          <h3 className="text-h2 text-ink">{content.paidPlans.heading}</h3>
          <p className="mt-4 leading-relaxed text-muted">{content.paidPlans.intro}</p>
        </Reveal>

        <DesktopPlanComparison
          plans={plans}
          labels={content.paidPlans.comparisonLabels}
        />

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:hidden">
          {plans.map(({ plan, trackTitle }, index) => (
            <Reveal key={plan.name} delay={index * 70} className="h-full">
              <PlanCard
                plan={plan}
                trackTitle={trackTitle}
                labels={content.paidPlans.comparisonLabels}
              />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 border-t border-line pt-6">
          <p className="max-w-4xl text-sm leading-relaxed text-muted">{content.disclosure}</p>
        </Reveal>

        <Reveal className="mt-8 flex flex-col gap-5 border-y border-line py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-ink">{content.portal.note}</p>
          <Button href={content.portal.href} variant="secondary" className="w-full shrink-0 sm:w-auto">
            {content.portal.label}
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}

type ComparedPlan = { plan: PricingPlan; trackTitle: string };
type ComparisonLabels = VisibilityContent["pricing"]["paidPlans"]["comparisonLabels"];

function DesktopPlanComparison({
  plans,
  labels,
}: {
  plans: ComparedPlan[];
  labels: ComparisonLabels;
}) {
  return (
    <Reveal className="mt-8 hidden overflow-hidden border border-line xl:block">
      <div className="grid grid-cols-[9rem_repeat(4,minmax(0,1fr))] gap-px bg-line">
        <div className="bg-warm-canvas p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep">
            {labels.offer}
          </p>
        </div>
        {plans.map(({ plan, trackTitle }) => (
          <div
            key={plan.name}
            className={cn("p-5", plan.featured ? "bg-charcoal text-ivory" : "bg-ivory text-ink")}
          >
            <p className={cn("text-[0.68rem] font-semibold uppercase tracking-[0.14em]", plan.featured ? "text-copper" : "text-copper-deep")}>
              {trackTitle}
            </p>
            <h4 className={cn("mt-3 text-lg font-semibold leading-snug", plan.featured ? "text-ivory" : "text-ink")}>
              {plan.name}
            </h4>
            <p className={cn("mt-4 font-serif text-3xl font-semibold", plan.featured ? "text-copper" : "text-copper-deep")}>
              {plan.price}
            </p>
            <p className={cn("mt-3 text-xs leading-relaxed", plan.featured ? "text-ivory/66" : "text-muted")}>
              {plan.statusLabel}
            </p>
          </div>
        ))}
      </div>

      <ComparisonRow label={labels.bestFor} plans={plans}>
        {(plan) => plan.description}
      </ComparisonRow>
      <ComparisonRow label={labels.systems} plans={plans} emphasis>
        {(plan) => plan.systemsLabel}
      </ComparisonRow>
      <ComparisonRow label={labels.scope} plans={plans} emphasis>
        {(plan) => plan.volumeLabel}
      </ComparisonRow>
      <ComparisonRow label={labels.difference} plans={plans}>
        {(plan) => plan.progressionLabel}
      </ComparisonRow>
      <ComparisonRow label={labels.included} plans={plans} alignTop>
        {(plan) => (
          <ul className="space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "mt-[0.48rem] h-1.5 w-1.5 shrink-0 rounded-full",
                    plan.featured ? "bg-copper" : "bg-copper-deep",
                  )}
                  aria-hidden
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </ComparisonRow>

      <div className="grid grid-cols-[9rem_repeat(4,minmax(0,1fr))] gap-px border-t border-line bg-line">
        <div className="bg-warm-canvas" aria-hidden />
        {plans.map(({ plan }) => (
          <div key={plan.name} className={cn("p-4", plan.featured ? "bg-charcoal" : "bg-ivory")}>
            {plan.href && plan.ctaLabel ? (
              <Button
                href={plan.href}
                variant={plan.featured ? "onDark" : "secondary"}
                size="md"
                className="w-full"
              >
                {plan.ctaLabel}
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </Reveal>
  );
}

function ComparisonRow({
  label,
  plans,
  children,
  emphasis = false,
  alignTop = false,
}: {
  label: string;
  plans: ComparedPlan[];
  children: (plan: PricingPlan) => React.ReactNode;
  emphasis?: boolean;
  alignTop?: boolean;
}) {
  return (
    <div className="grid grid-cols-[9rem_repeat(4,minmax(0,1fr))] gap-px border-t border-line bg-line">
      <div className="bg-warm-canvas p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      </div>
      {plans.map(({ plan }) => (
        <div
          key={plan.name}
          className={cn(
            "p-4 text-sm leading-relaxed",
            !alignTop && "flex items-center",
            plan.featured ? "bg-charcoal text-ivory/74" : "bg-ivory text-muted",
            emphasis && (plan.featured ? "font-semibold text-ivory" : "font-semibold text-ink"),
          )}
        >
          {children(plan)}
        </div>
      ))}
    </div>
  );
}

function PlanCard({
  plan,
  trackTitle,
  labels,
}: {
  plan: PricingPlan;
  trackTitle: string;
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
      <h4 className={cn("mt-4 text-xl font-semibold", featured ? "text-ivory" : "text-ink")}>
        {plan.name}
      </h4>
      <p
        className={cn(
          "mt-5 font-serif text-3xl font-semibold",
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
            <dt className={cn("text-[0.68rem] font-semibold uppercase tracking-[0.14em]", featured ? "text-copper" : "text-copper-deep")}>
              {label}
            </dt>
            <dd className={cn("mt-1.5 text-sm font-semibold leading-relaxed", featured ? "text-ivory" : "text-ink")}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <p className={cn("mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.14em]", featured ? "text-copper" : "text-copper-deep")}>
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
