import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";
import Badge from "@/components/ui/Badge";
import { examples } from "@/data/examples";

export default function ImplementationExamples() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="Примеры возможных решений"
          title="Как это выглядит в реальных процессах"
          lede="Это сценарии, которые можно собрать под ваш процесс, — не кейсы клиентов и не обещания результатов."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {examples.map((example, i) => (
            <Reveal key={example.title} delay={(i % 2) * 100} className="h-full">
              <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card">
                <div>
                  <Badge tone="sage">{example.label}</Badge>
                </div>
                <h3 className="mt-3 text-xl font-semibold">{example.title}</h3>
                <dl className="mt-4 space-y-3 text-sm leading-relaxed">
                  <div>
                    <dt className="font-medium uppercase tracking-[0.14em] text-xs text-muted">
                      Было
                    </dt>
                    <dd className="mt-1 text-muted">{example.before}</dd>
                  </div>
                  <div>
                    <dt className="font-medium uppercase tracking-[0.14em] text-xs text-copper-deep">
                      Стало
                    </dt>
                    <dd className="mt-1 text-ink/85">{example.after}</dd>
                  </div>
                </dl>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
