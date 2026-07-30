import type { MeasurementLayersContent } from "@/lib/visibility/types";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";

export function MeasurementLayers({
  content,
  background = "ivory",
}: {
  content: MeasurementLayersContent;
  background?: "ivory" | "surface";
}) {
  return (
    <section className={background === "ivory" ? "bg-ivory py-20 sm:py-28" : "bg-surface py-20 sm:py-28"}>
      <Container>
        <SectionHeader eyebrow={content.eyebrow} headline={content.headline} intro={content.intro} />
        <div className="mt-12 grid gap-6 sm:mt-14 sm:grid-cols-2">
          {content.layers.map((layer, i) => (
            <Reveal key={layer.id} delay={i * 80}>
              <Card className="h-full">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper-deep">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-h3 text-ink">{layer.title}</h3>
                <p className="mt-2 font-medium leading-relaxed text-ink/80">{layer.question}</p>
                <p className="mt-3 leading-relaxed text-muted">{layer.description}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
