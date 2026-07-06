import contentEngine from "@/data/content-engine.json";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { NewsletterSignupForm } from "@/components/forms/NewsletterSignupForm";

export function NewsletterCTASection() {
  return (
    <section className="bg-charcoal py-20 text-ivory sm:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <Reveal>
            <Badge tone="onDark">{contentEngine.name}</Badge>
            <h2 className="mt-4 text-h2 text-ivory">AI без хаоса: одна бизнес-задача в неделю</h2>
            <p className="mt-5 text-lg leading-relaxed text-ivory/70">
              Короткие разборы для предпринимателей и команд: где AI может помочь,
              какой сценарий собрать, какой инструмент выбрать и какой ошибки избежать.
            </p>
            <div className="mt-8">
              <NewsletterSignupForm />
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {contentEngine.rubrics.map((rubric, i) => (
              <Reveal key={rubric.title} delay={i * 70}>
                <div className="rounded-2xl border border-line-dark bg-charcoal-2 p-5">
                  <h3 className="font-serif text-xl font-semibold text-ivory">{rubric.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ivory/65">{rubric.goal}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
