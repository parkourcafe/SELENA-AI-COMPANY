import aiMap from "@/data/free-ai-map.json";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";

export function AIMapCTASection() {
  return (
    <section className="bg-charcoal py-20 text-ivory sm:py-28">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <Badge tone="onDark">Бесплатный вход</Badge>
            <h2 className="mt-4 text-h2 text-ivory">{aiMap.headline}</h2>
            <p className="mt-5 text-lg leading-relaxed text-ivory/70">
              {aiMap.subheadline}
            </p>
            <Button href="/free-ai-map" variant="onDark" size="lg" className="mt-8">
              Получить AI-карту возможностей
            </Button>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {aiMap.whatUserGets.map((item, i) => (
              <Reveal key={item} delay={i * 90}>
                <div className="rounded-2xl border border-line-dark bg-charcoal-2 p-5">
                  <span className="font-serif text-sm text-copper">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-3 leading-relaxed text-ivory/85">{item}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
