import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";
import { processSteps } from "@/data/process";

export default function CoreLoopSection() {
  return (
    <section className="border-y border-line bg-surface py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="Подход"
          title="Сначала процесс. Потом AI."
          lede="Один и тот же цикл — от диагностики до итерации. Он одинаково работает для контента, заявок, коммуникаций и внутренней рутины."
        />

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {processSteps.map((step, i) => (
            <Reveal as="li" key={step.name} delay={i * 80}>
              <div className="h-full rounded-2xl border border-line bg-ivory p-6">
                <span className="text-sm font-semibold text-copper-deep">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-xl font-semibold">{step.name}</h3>
                <p className="mt-2 leading-relaxed text-muted">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
