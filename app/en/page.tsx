import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { contactLinks, enCta, site } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { EnglishContactForm } from "@/components/forms/EnglishContactForm";

const title = "AI implementation and automation for practical business operations";
const description =
  "KORA AI helps service businesses map routine work, choose useful AI scenarios, and implement automations, AI concierge flows, playbooks and training without heavy code.";

export const metadata: Metadata = {
  title: { absolute: `KORA AI — ${title}` },
  description,
  alternates: {
    canonical: `${site.url}/en`,
    languages: {
      ru: site.url,
      en: `${site.url}/en`,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: site.name,
    title: `KORA AI — ${title}`,
    description,
    url: `${site.url}/en`,
  },
  twitter: {
    card: "summary_large_image",
    title: `KORA AI — ${title}`,
    description,
  },
};

const services = [
  {
    title: "AI opportunity map",
    text: "A short diagnostic that shows where AI can help first and what should stay human-led.",
  },
  {
    title: "AI concierge flow",
    text: "Reply scenarios for repeated client questions, intake and handoff to a person.",
  },
  {
    title: "Content engine",
    text: "Turn one expert idea into reusable posts, emails, checklists and short-form assets.",
  },
  {
    title: "Team training",
    text: "Shared prompts, rules and operating habits so AI output becomes predictable.",
  },
];

const process = [
  "Map the real workflow",
  "Choose one useful AI scenario",
  "Build the first version",
  "Add human review and operating rules",
];

export default function EnglishPage() {
  return (
    <div lang="en">
      <section className="bg-warm-canvas relative overflow-hidden pt-28 sm:pt-36">
        <div
          className="grid-texture pointer-events-none absolute -right-32 top-10 hidden h-[42rem] w-[42rem] lg:block"
          aria-hidden
        />
        <Container size="wide" className="relative">
          <div className="grid items-center gap-12 pb-20 sm:pb-28 lg:grid-cols-[0.88fr_1.12fr]">
            <Reveal>
              <Badge tone="copper">AI implementation for business operations</Badge>
              <h1 className="mt-6 font-serif text-display font-semibold text-ink">
                Find where AI actually belongs in your business.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                We map requests, replies, content, CRM and team routines. Then
                we build AI scenarios, automations and working rules without
                heavy code.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Button href={enCta.primary.href} size="lg">
                  {enCta.primary.label}
                </Button>
                <Button href={enCta.secondary.href} size="lg" variant="secondary">
                  {enCta.secondary.label}
                </Button>
              </div>
              <p className="mt-7 flex items-center gap-3 text-sm font-medium text-ink/70">
                <span className="inline-block h-px w-8 bg-copper" aria-hidden />
                Process first. Then the right tool.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative">
                <Image
                  src="/media/kora-process-visual.png"
                  width={1600}
                  height={1100}
                  alt="KORA process visual showing messy business inputs becoming an AI map, automation and playbook."
                  priority
                  className="h-auto w-full rounded-[1.25rem] border border-line shadow-[0_28px_80px_-52px_rgba(24,22,20,0.55)]"
                />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section id="services" className="bg-surface py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr]">
            <Reveal>
              <Badge tone="copper">services</Badge>
              <h2 className="mt-4 text-h2 text-ink">What we can build first</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                The goal is not to install “more AI”. The goal is to remove
                repeated manual work where the process is clear enough.
              </p>
            </Reveal>

            <div className="border-y border-line">
              {services.map((service, index) => (
                <Reveal key={service.title} as="div" delay={index * 80}>
                  <div className="grid gap-4 border-b border-line py-6 last:border-b-0 md:grid-cols-[4rem_1fr]">
                    <span className="font-serif text-3xl text-copper-deep">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-h3 text-ink">{service.title}</h3>
                      <p className="mt-2 max-w-2xl leading-relaxed text-muted">{service.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section id="process" className="bg-charcoal py-20 text-ivory sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <Reveal>
              <Badge tone="onDark">method</Badge>
              <h2 className="mt-4 text-h2 text-ivory">A calm implementation loop</h2>
              <p className="mt-5 text-lg leading-relaxed text-ivory/70">
                No tool catalogue. No magic claims. One business process, one
                useful scenario, one working habit at a time.
              </p>
            </Reveal>

            <ol className="border-y border-line-dark">
              {process.map((item, index) => (
                <Reveal key={item} as="li" delay={index * 80}>
                  <div className="grid gap-4 border-b border-line-dark py-6 last:border-b-0 md:grid-cols-[5rem_1fr]">
                    <span className="font-serif text-3xl text-copper">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-2xl font-medium text-ivory">{item}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section id="library" className="bg-ivory py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <Reveal>
              <Image
                src="/media/kora-library-visual.png"
                width={1500}
                height={1000}
                alt="KORA lead library visual with AI playbooks and diagnostic assets."
                className="h-auto w-full rounded-[1.25rem] border border-line shadow-[0_24px_70px_-48px_rgba(24,22,20,0.45)]"
              />
            </Reveal>
            <Reveal delay={120}>
              <Badge tone="copper">library and waitlist</Badge>
              <h2 className="mt-4 text-h2 text-ink">Lead magnets become an operating library</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                Start with the AI opportunity map. Then build checklists,
                playbooks and content assets that teach the business how to use
                AI without chaos.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button href="#contact" size="lg">
                  Join the waitlist
                </Button>
                <Link
                  href="/"
                  hrefLang="ru"
                  className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-8 py-4 text-base font-medium text-ink transition-colors hover:border-copper-deep/60 hover:text-copper-deep"
                >
                  Russian version
                </Link>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section id="contact" className="bg-surface py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <Reveal>
              <Badge tone="copper">contact</Badge>
              <h2 className="mt-4 text-h2 text-ink">Send one process. We will find the first AI use case.</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                Share where time is leaking: requests, replies, content, CRM,
                documentation or team routines.
              </p>
              {contactLinks.whatsapp ? (
                <a
                  href={contactLinks.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex rounded-full border border-line bg-ivory px-6 py-3 font-medium text-ink transition-colors hover:border-copper hover:text-copper-deep"
                >
                  WhatsApp direct
                </a>
              ) : null}
            </Reveal>
            <Reveal delay={120}>
              <EnglishContactForm />
            </Reveal>
          </div>
        </Container>
      </section>
    </div>
  );
}
