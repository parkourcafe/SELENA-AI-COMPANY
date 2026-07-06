import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";
import Badge from "@/components/ui/Badge";
import { audiences } from "@/data/audiences";

export default function AudiencePathways() {
  return (
    <section className="border-y border-line bg-surface py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="Для кого"
          title="Для тех, кто хочет использовать AI по делу"
          lede="Разные бизнесы — одна и та же логика: убрать рутину, навести порядок, оставить людям то, что действительно требует людей."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {audiences.map((audience, i) => (
            <Reveal key={audience.title} delay={(i % 2) * 100} className="h-full">
              <article className="flex h-full flex-col rounded-2xl border border-line bg-ivory p-6">
                <h3 className="text-xl font-semibold">{audience.title}</h3>
                <div className="mt-4 space-y-3 text-sm leading-relaxed">
                  <div>
                    <Badge tone="neutral">Боль</Badge>
                    <p className="mt-2 text-muted">{audience.pain}</p>
                  </div>
                  <div>
                    <Badge tone="copper">Что собирает KORA</Badge>
                    <p className="mt-2 text-ink/85">{audience.solution}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
