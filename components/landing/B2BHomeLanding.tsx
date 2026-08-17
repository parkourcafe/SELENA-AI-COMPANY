import { homepage, type HomepageContent } from "@/lib/data/homepage";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { LabEntryTeaser } from "@/components/lab/LabEntryTeaser";
import type { VisibilityLocale } from "@/lib/visibility/types";
import { cn } from "@/lib/cn";

function Eyebrow({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.24em]",
        tone === "light" ? "text-copper" : "text-copper-deep",
      )}
    >
      {children}
    </p>
  );
}

function SectionIntro({
  eyebrow,
  headline,
  intro,
  tone = "dark",
}: {
  eyebrow: string;
  headline: string;
  intro?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div className="max-w-3xl">
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2 className={cn("mt-5 text-h1", tone === "light" ? "text-ivory" : "text-ink")}>
        {headline}
      </h2>
      {intro ? (
        <p className={cn("mt-5 text-lg leading-relaxed", tone === "light" ? "text-ivory/68" : "text-muted")}>
          {intro}
        </p>
      ) : null}
    </div>
  );
}

function DirectionMapVisual({ content }: { content: HomepageContent }) {
  return (
    <div className="relative overflow-hidden rounded-[1rem] border border-ivory/12 bg-[#0f0e0d] p-3 shadow-[0_32px_90px_-42px_rgba(0,0,0,0.85)] sm:p-4">
      <div className="grid gap-3 border-b border-ivory/10 pb-3 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-ivory/46 sm:grid-cols-3">
        {content.visual.stages.map((stage) => (
          <span key={stage}>{stage}</span>
        ))}
      </div>

      <div className="relative mt-4 overflow-hidden rounded-[0.75rem] border border-ivory/10 bg-ivory p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex min-h-44 flex-col justify-between border border-line bg-ivory p-5 text-ink">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-copper-deep">
              {content.visual.visibilityLabel}
            </p>
            <div>
              <p className="font-serif text-2xl font-semibold leading-tight sm:text-3xl">{content.visual.visibilityFlow}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{content.visual.visibilityNote}</p>
            </div>
          </div>
          <div className="flex min-h-44 flex-col justify-between bg-charcoal p-5 text-ivory">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-copper">
              {content.visual.systemsLabel}
            </p>
            <div>
              <p className="font-serif text-2xl font-semibold leading-tight sm:text-3xl">{content.visual.systemsFlow}</p>
              <p className="mt-3 text-sm leading-relaxed text-ivory/62">{content.visual.systemsNote}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 border-t border-line pt-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-copper-deep">
          {content.visual.sharedLayer}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {content.visual.layers.map((item) => (
          <div key={item} className="border border-ivory/10 bg-ivory/[0.03] px-4 py-3">
            <p className="text-sm font-semibold text-ivory">{item}</p>
            <p className="mt-1 text-xs text-ivory/48">{content.visual.layerLabel}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroSection({ content }: { content: HomepageContent }) {
  return (
    <section className="relative overflow-hidden bg-charcoal pt-28 text-ivory sm:pt-32 lg:pt-36">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(247,242,234,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(247,242,234,0.6) 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
        }}
        aria-hidden
      />
      <Container size="wide" className="relative">
        <div className="grid gap-12 pb-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-20">
          <Reveal>
            <Eyebrow tone="light">{content.hero.eyebrow}</Eyebrow>
            <h1 className="mt-6 max-w-5xl text-display text-ivory">{content.hero.headline}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ivory/72 sm:text-xl">
              {content.hero.subheadline}
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                href={content.hero.primaryCta.href}
                size="lg"
                variant="onDark"
                className="shrink-0 whitespace-nowrap"
              >
                {content.hero.primaryCta.label}
              </Button>
              <a
                href={content.hero.secondaryCta.href}
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-ivory/25 px-8 py-4 text-base font-medium text-ivory/85 transition-colors duration-300 hover:border-copper hover:text-copper"
              >
                {content.hero.secondaryCta.label}
              </a>
            </div>
            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-ivory/52">{content.hero.primaryNote}</p>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ivory/52">{content.hero.trustLine}</p>
          </Reveal>

          <Reveal delay={120}>
            <DirectionMapVisual content={content} />
          </Reveal>
        </div>

        <Reveal delay={180} className="grid border-t border-ivory/12 py-6 sm:grid-cols-3">
          {content.hero.stats.map((stat) => (
            <div key={stat.value} className="border-b border-ivory/10 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0">
              <p className="font-serif text-4xl font-semibold text-ivory">{stat.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-ivory/52">{stat.label}</p>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}

function VisibilityOverviewSection({ content }: { content: HomepageContent }) {
  const visibility = content.hero.directions.visibility;
  const plan = content.productPaths.visibility;

  return (
    <section id="visibility" className="border-t border-line bg-surface py-20 sm:py-28">
      <Container size="wide">
        <Reveal>
          <div className="grid gap-6 border-b border-line pb-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <Eyebrow>{visibility.eyebrow}</Eyebrow>
              <h2 className="mt-5 text-h1 text-ink">{plan.name}</h2>
            </div>
            <div>
              <p className="text-xl font-semibold leading-relaxed text-ink">{plan.promise}</p>
              <p className="mt-3 max-w-3xl leading-relaxed text-muted">{visibility.description}</p>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-copper-deep">
            {visibility.ladderLabel}
          </p>
        </Reveal>

        {/* The free entry and the four paid steps sit in one row, each showing
            its price and what it includes, so nothing needs a second page. */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-4">
          {plan.items.map((item, index) => {
            const isFree = index === 0;
            return (
              <Reveal key={`${item.price}-${item.name}`} delay={index * 60} className="h-full">
                <article
                  className={cn(
                    "flex h-full flex-col rounded-[1rem] border p-6",
                    isFree ? "border-copper-deep/55 bg-charcoal text-ivory" : "border-line bg-ivory",
                  )}
                >
                  <p
                    className={cn(
                      "font-serif text-4xl font-semibold leading-none",
                      isFree ? "text-copper" : "text-copper-deep",
                    )}
                  >
                    {item.price}
                  </p>
                  <h3 className={cn("mt-4 text-xl font-semibold leading-snug", isFree ? "text-ivory" : "text-ink")}>
                    {item.name}
                  </h3>
                  <p className={cn("mt-3 leading-relaxed", isFree ? "text-ivory/76" : "text-muted")}>
                    {item.summary}
                  </p>
                  <ul className={cn("mt-5 space-y-2.5 border-t pt-5", isFree ? "border-ivory/15" : "border-line")}>
                    {item.includes.map((line) => (
                      <li
                        key={line}
                        className={cn(
                          "flex items-start gap-2.5 leading-relaxed",
                          isFree ? "text-ivory/78" : "text-ink/75",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full",
                            isFree ? "bg-copper" : "bg-copper-deep",
                          )}
                          aria-hidden
                        />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href={plan.primaryCta.href} size="lg" className="w-full sm:w-auto">
            {plan.primaryCta.label}
          </Button>
          <Button href={plan.secondaryCta.href} size="lg" variant="secondary" className="w-full sm:w-auto">
            {plan.secondaryCta.label}
          </Button>
        </Reveal>

        <Reveal delay={100} className="mt-12 border-t border-line pt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-copper-deep">
            {visibility.outcomesLabel}
          </p>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {visibility.proof.map((item, index) => (
              <li key={item} className="border-t-2 border-copper-deep/25 pt-4 text-lg leading-relaxed text-ink/80">
                <span className="mr-2 font-semibold text-copper-deep">0{index + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}

function ProblemSection({ content }: { content: HomepageContent }) {
  return (
    <section id="ai-systems" className="border-t border-line bg-surface py-20 sm:py-28">
      <Container size="wide">
        <Reveal>
          <div className="mb-16 grid gap-6 border-b border-line pb-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <h2 className="text-h1 text-ink">{content.productPaths.systems.name}</h2>
            <div>
              <p className="text-xl font-semibold leading-relaxed text-ink">
                {content.productPaths.systems.promise}
              </p>
              <p className="mt-3 leading-relaxed text-muted">{content.productPaths.systems.description}</p>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <Reveal>
            <SectionIntro
              eyebrow={content.problems.eyebrow}
              headline={content.problems.headline}
              intro={content.problems.intro}
            />
          </Reveal>

          <div className="border-y border-line">
            {content.problems.items.map((item, index) => (
              <Reveal key={item.title} delay={index * 55}>
                <div className="grid gap-4 border-b border-line py-6 last:border-b-0 sm:grid-cols-[7rem_1fr] sm:py-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-deep">
                    0{index + 1}
                  </p>
                  <div>
                    <h3 className="text-h3 text-ink">{item.title}</h3>
                    <p className="mt-2 max-w-2xl leading-relaxed text-muted">{item.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function SolutionSection({ content }: { content: HomepageContent }) {
  return (
    <section id="systems" className="bg-charcoal py-20 text-ivory sm:py-28">
      <Container size="wide">
        <Reveal>
          <SectionIntro
            eyebrow={content.solution.eyebrow}
            headline={content.solution.headline}
            intro={content.solution.intro}
            tone="light"
          />
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden border border-line-dark bg-line-dark lg:grid-cols-5">
          {content.solution.systems.map((system, index) => (
            <Reveal key={system.name} delay={index * 70}>
              <div className="h-full bg-charcoal-2 p-6 transition-colors duration-300 hover:bg-[#29241f] sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                  0{index + 1}
                </p>
                <h3 className="mt-9 text-h3 text-ivory">{system.name}</h3>
                <p className="mt-4 text-sm leading-relaxed text-ivory/62">{system.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function SprintSection({ content }: { content: HomepageContent }) {
  return (
    <section id="sprint" className="bg-surface py-20 sm:py-28">
      <Container size="wide">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <Reveal>
            <SectionIntro
              eyebrow={content.sprint.eyebrow}
              headline={content.sprint.headline}
              intro={content.sprint.intro}
            />
            <Button href={content.cta.href} size="lg" className="mt-8 whitespace-nowrap">
              {content.cta.label}
            </Button>
          </Reveal>

          <Reveal delay={120}>
            <div className="border-y border-line">
              {content.sprint.deliverables.map((deliverable, index) => (
                <div key={deliverable} className="grid grid-cols-[3.5rem_1fr] border-b border-line py-5 last:border-b-0">
                  <span className="font-serif text-2xl font-semibold text-copper-deep">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-lg leading-relaxed text-ink/82">{deliverable}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function ProcessSection({ content }: { content: HomepageContent }) {
  return (
    <section className="bg-ivory py-20 sm:py-28">
      <Container size="wide">
        <Reveal>
          <SectionIntro
            eyebrow={content.processIntro.eyebrow}
            headline={content.processIntro.headline}
          />
        </Reveal>

        <ol className="mt-14 grid gap-4 lg:grid-cols-5">
          {content.process.map((step, index) => (
            <Reveal as="li" key={step.day} delay={index * 70}>
              <div className="relative h-full border border-line bg-surface p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-deep">
                  {step.day}
                </p>
                <h3 className="mt-6 text-h3 text-ink">{step.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function SprintTrackerSection({ content }: { content: HomepageContent }) {
  const doneCount = content.tracker.steps.filter((step) => step.status === "done").length;
  const progressPercent = Math.round((doneCount / content.tracker.steps.length) * 100);

  return (
    <section className="bg-surface pb-20 sm:pb-28">
      <Container size="wide">
        <Reveal>
          <SectionIntro
            eyebrow={content.tracker.eyebrow}
            headline={content.tracker.headline}
            intro={content.tracker.note}
          />
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-12 overflow-hidden border border-line bg-ivory">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4 sm:px-8">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-copper-deep" aria-hidden />
                <p className="text-sm font-semibold text-ink">{content.tracker.dayLabel}</p>
                <p className="text-sm text-muted">— {content.tracker.stageLabel}</p>
              </div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">
                {content.tracker.demoLabel}
              </p>
            </div>

            <div className="px-6 pt-6 sm:px-8">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-copper-deep"
                  style={{ width: `${progressPercent}%` }}
                  aria-hidden
                />
              </div>
            </div>

            <ol className="grid gap-px bg-line p-px pt-6 sm:grid-cols-5 sm:pt-6">
              {content.tracker.steps.map((step, index) => (
                <li
                  key={step.title}
                  className={cn(
                    "bg-ivory p-5",
                    step.status === "active" && "bg-surface",
                  )}
                >
                  <p
                    className={cn(
                      "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]",
                      step.status === "done" && "text-copper-deep",
                      step.status === "active" && "text-ink",
                      step.status === "next" && "text-muted",
                    )}
                  >
                    {step.status === "done" ? (
                      <span aria-hidden>✓</span>
                    ) : (
                      <span aria-hidden>{String(index + 1).padStart(2, "0")}</span>
                    )}
                    {step.title}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export function PackagesSection({ content }: { content: HomepageContent }) {
  return (
    <section id="packages" className="bg-charcoal py-20 text-ivory sm:py-28">
      <Container size="wide">
        <Reveal>
          <SectionIntro
            eyebrow={content.packagesIntro.eyebrow}
            headline={content.packagesIntro.headline}
            intro={content.packagesIntro.intro}
            tone="light"
          />
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 flex flex-col gap-5 border border-line-dark bg-charcoal-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                {content.strategyCall.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ivory/66">
                {content.strategyCall.text}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-5">
              <p className="font-serif text-3xl font-semibold text-ivory">
                {content.strategyCall.price}
              </p>
              <a
                href={content.cta.href}
                className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border border-ivory/25 px-5 py-2.5 text-sm font-medium text-ivory/85 transition-colors duration-300 hover:border-copper hover:text-copper"
              >
                {content.strategyCall.ctaLabel}
              </a>
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {content.packages.map((pkg, index) => (
            <Reveal key={pkg.name} delay={index * 80}>
              <article
                className={cn(
                  "flex h-full flex-col border p-6 sm:p-7",
                  pkg.featured
                    ? "border-copper bg-ivory text-ink"
                    : "border-line-dark bg-charcoal-2 text-ivory",
                )}
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className={cn("text-xs font-semibold uppercase tracking-[0.22em]", pkg.featured ? "text-copper-deep" : "text-copper")}>
                      {pkg.name}
                    </p>
                    <h3 className="mt-4 font-serif text-4xl font-semibold">{pkg.price}</h3>
                  </div>
                  {pkg.featured ? (
                    <span className="rounded-full bg-copper-deep px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-surface">
                      {content.packagesIntro.featuredLabel}
                    </span>
                  ) : null}
                </div>
                <p className={cn("mt-6 leading-relaxed", pkg.featured ? "text-muted" : "text-ivory/62")}>
                  {pkg.description}
                </p>
                <ul className="mt-8 space-y-3 pb-8">
                  {pkg.included.map((item) => (
                    <li key={item} className={cn("border-t pt-3 text-sm", pkg.featured ? "border-line text-ink/75" : "border-line-dark text-ivory/66")}>
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  href={content.cta.href}
                  variant={pkg.featured ? "primary" : "onDark"}
                  className="mt-auto whitespace-nowrap"
                >
                  {content.cta.label}
                </Button>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ProofSection({ content }: { content: HomepageContent }) {
  return (
    <section id="proof" className="bg-surface py-20 sm:py-28">
      <Container size="wide">
        <Reveal>
          <SectionIntro
            eyebrow={content.proof.eyebrow}
            headline={content.proof.headline}
          />
          <p className="mt-5 max-w-2xl leading-relaxed text-muted">{content.proof.founderLine}</p>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2">
          {content.proof.projects.map((project, index) => (
            <Reveal key={project.name} delay={index * 70}>
              <article className="group h-full bg-surface p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-deep">
                  {project.category}
                </p>
                <h3 className="mt-5 text-h2 text-ink">
                  {project.url ? (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-baseline gap-2 transition-colors hover:text-copper-deep focus-visible:text-copper-deep"
                    >
                      {project.name}
                      <span
                        aria-hidden
                        className="text-base transition-transform group-hover:translate-x-1"
                      >
                        ↗
                      </span>
                    </a>
                  ) : (
                    project.name
                  )}
                </h3>
                <p className="mt-4 max-w-xl leading-relaxed text-muted">{project.text}</p>
                {project.metric ? (
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="font-serif text-2xl font-semibold text-ink">
                      {project.metric.value}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">
                      {project.metric.basis}
                    </p>
                  </div>
                ) : null}
                <ul className="mt-6 flex flex-wrap gap-2">
                  {project.layers.map((layer) => (
                    <li
                      key={layer}
                      className="rounded-full border border-line px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-copper-deep"
                    >
                      {layer}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FinalCtaSection({ content }: { content: HomepageContent }) {
  return (
    <section className="bg-charcoal py-20 text-ivory sm:py-28">
      <Container>
        <Reveal>
          <div className="mx-auto max-w-4xl text-center">
            <Eyebrow tone="light">{content.finalCta.eyebrow}</Eyebrow>
            <h2 className="mt-5 text-h1 text-ivory">{content.finalCta.headline}</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ivory/68">
              {content.finalCta.text}
            </p>
            <Button href={content.cta.href} size="lg" variant="onDark" className="mt-9 whitespace-nowrap">
              {content.cta.label}
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export function B2BHomeLanding({
  content = homepage,
  locale = "en",
}: {
  content?: HomepageContent;
  locale?: VisibilityLocale;
}) {
  return (
    <>
      <HeroSection content={content} />
      <VisibilityOverviewSection content={content} />
      <ProblemSection content={content} />
      <SolutionSection content={content} />
      <SprintSection content={content} />
      <ProcessSection content={content} />
      <SprintTrackerSection content={content} />
      <PackagesSection content={content} />
      <ProofSection content={content} />
      <LabEntryTeaser locale={locale} />
      <FinalCtaSection content={content} />
    </>
  );
}
