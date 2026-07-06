import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";

// Копирайт — docs/00 §9 (приоритетнее docs/10 §4.7 при конфликте).
const boundaries = [
  {
    title: "Без фейковых обещаний",
    description:
      "Никакого «гарантированного роста выручки» и «AI заменит всех сотрудников». Только то, что реально можно собрать и проверить.",
  },
  {
    title: "Human review там, где он нужен",
    description:
      "Клиентские коммуникации, публичный контент и чувствительные решения проходят через человека — это часть сценария, а не опция.",
  },
  {
    title: "Ваши данные — не демо-игрушка",
    description:
      "Лишние данные не собираются. В примерах и демонстрациях — только вымышленные плейсхолдеры.",
  },
  {
    title: "Сначала процесс, потом инструмент",
    description:
      "KORA не ставит инструменты ради инструментов. Если задача решается проще — так и делаем.",
  },
  {
    title: "Ограничения проговариваются заранее",
    description:
      "Если что-то невозможно или не стоит автоматизировать — вы услышите это до начала работы, а не после.",
  },
];

export default function TrustBoundarySection() {
  return (
    <section className="bg-charcoal py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="Границы и честность"
          title="AI полезен только там, где есть понятный процесс"
          lede="Без магии. Без фейковых обещаний. Без автоматизации ради автоматизации."
          onDark
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {boundaries.map((item, i) => (
            <Reveal as="li" key={item.title} delay={(i % 3) * 80} className="h-full">
              <div className="h-full rounded-2xl border border-surface/10 bg-surface/[0.04] p-6">
                <h3 className="text-lg font-semibold text-surface">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-surface/65">
                  {item.description}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
