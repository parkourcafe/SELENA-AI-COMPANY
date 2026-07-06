import { audiences } from "@/lib/data/content";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Audience pathways (cinematic brief §4.5): four segments, each told as
 * pain → what KORA builds. The downward copper arrow + hairline is the
 * transition marker; equal-height cards keep the "build" lines aligned.
 */
export function AudiencePathways() {
  return (
    <section className="bg-ivory py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow={audiences.eyebrow}
          headline={audiences.headline}
          intro={audiences.intro}
        />

        <div className="mt-14 grid gap-5 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {audiences.items.map((a, i) => (
            <Reveal key={a.id} delay={i * 80}>
              <Card className="flex h-full flex-col">
                <h3 className="text-[1.2rem] font-semibold leading-snug text-ink">
                  {a.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-muted">{a.pain}</p>

                {/* Transition marker: pain resolves downward into what we build */}
                <div className="mt-auto flex items-center gap-3 pt-6" aria-hidden>
                  <svg
                    width="12"
                    height="14"
                    viewBox="0 0 12 14"
                    fill="none"
                    className="shrink-0 text-copper"
                  >
                    <path
                      d="M6 1v11m0 0 4.2-4.2M6 12 1.8 7.8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="h-px flex-1 bg-line" />
                </div>

                <p className="mt-4 text-[0.95rem] font-medium leading-relaxed text-ink">
                  {a.build}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
