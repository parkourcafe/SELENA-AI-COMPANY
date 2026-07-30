import { visibilityContentEn } from "@/lib/visibility/content.en";
import { visibilityContentRu } from "@/lib/visibility/content.ru";
import type { VisibilityLocale } from "@/lib/visibility/types";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Homepage diagnostic entry (SSOT §6.5, §6.6, §29.3.5). Sits directly
 * under the existing hero without rewriting the main positioning —
 * it is an additional module, not a replacement for it.
 */
export function VisibilityEntryTeaser({ locale }: { locale: VisibilityLocale }) {
  const content = locale === "ru" ? visibilityContentRu : visibilityContentEn;
  const { homeTeaser } = content;

  return (
    <section className="bg-ivory py-16 sm:py-20">
      <Container>
        <Reveal>
          <div className="card-premium flex flex-col gap-8 p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-2xl">
              <Eyebrow>{homeTeaser.eyebrow}</Eyebrow>
              <h2 className="text-h2 text-ink">{homeTeaser.headline}</h2>
              <p className="mt-4 leading-relaxed text-muted">{homeTeaser.intro}</p>
              <p className="mt-3 text-sm font-medium text-copper-deep">{homeTeaser.formNote}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Button href={homeTeaser.primaryCta.href} size="lg" className="whitespace-nowrap">
                {homeTeaser.primaryCta.label}
              </Button>
              <Button href={homeTeaser.secondaryCta.href} variant="secondary" size="lg" className="whitespace-nowrap">
                {homeTeaser.secondaryCta.label}
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
