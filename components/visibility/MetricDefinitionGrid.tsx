import type { MetricDefinition } from "@/lib/visibility/types";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";

export function MetricDefinitionGrid({
  eyebrow,
  headline,
  metrics,
}: {
  eyebrow: string;
  headline: string;
  metrics: MetricDefinition[];
}) {
  return (
    <section className="bg-ivory py-20 sm:py-28">
      <Container>
        <SectionHeader eyebrow={eyebrow} headline={headline} />
        <div className="mt-12 grid gap-6 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, i) => (
            <Reveal key={metric.name} delay={i * 80}>
              <Card className="h-full">
                <h3 className="text-h3 text-ink">{metric.name}</h3>
                <p className="mt-3 leading-relaxed text-muted">{metric.definition}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
