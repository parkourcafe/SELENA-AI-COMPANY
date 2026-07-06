import Link from "next/link";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";
import { services, type Service } from "@/data/services";

function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card transition-shadow duration-200 hover:shadow-card-lg">
      <h3 className="text-xl font-semibold">{service.name}</h3>
      <p className="mt-2 leading-relaxed text-ink/85">{service.promise}</p>
      <ul className="mt-4 space-y-2 text-sm text-muted">
        {service.includes.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">{service.audience}</p>
      <Link
        href={service.href}
        className="mt-auto pt-5 text-sm font-medium text-copper-deep transition-colors group-hover:text-copper"
      >
        {service.ctaLabel} →
      </Link>
    </article>
  );
}

export default function ServiceModuleGrid({
  title = "Модули, из которых собирается ваша AI-система",
  lede = "Можно начать с одного модуля и расширяться по мере того, как система приживается. Не нужно внедрять всё сразу.",
}: {
  title?: string;
  lede?: string;
}) {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeader eyebrow="Услуги" title={title} lede={lede} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service, i) => (
            <Reveal key={service.id} delay={(i % 4) * 80} className="h-full">
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
