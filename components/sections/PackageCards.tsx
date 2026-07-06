import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import { startingPoints } from "@/data/packages";
import { cta } from "@/data/site";

export default function PackageCards() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="С чего начать"
          title="Пять стартовых точек"
          lede="Формат и стоимость оцениваются после брифа — объём работ зависит от задачи и того, что у вас уже есть."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {startingPoints.map((pkg, i) => (
            <Reveal key={pkg.name} delay={(i % 3) * 80} className="h-full">
              <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card">
                <h3 className="text-xl font-semibold">{pkg.name}</h3>
                <p className="mt-2 leading-relaxed text-muted">{pkg.description}</p>
                <p className="mt-4 border-t border-line pt-4 text-sm text-ink/75">
                  {pkg.fit}
                </p>
              </article>
            </Reveal>
          ))}
          <Reveal delay={240} className="h-full">
            <div className="flex h-full flex-col items-start justify-between gap-5 rounded-2xl border border-copper/30 bg-copper/[0.07] p-6">
              <div>
                <h3 className="text-xl font-semibold">Не уверены, что выбрать?</h3>
                <p className="mt-2 leading-relaxed text-muted">
                  Опишите задачу в брифе — я предложу стартовую точку под ваш
                  процесс. Иногда правильный ответ — начать с малого.
                </p>
              </div>
              <Button href="/contact">{cta.primary}</Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
