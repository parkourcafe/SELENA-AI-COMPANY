import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";

// Как устроена работа со мной — от брифа до передачи системы.
// Не путать с core loop (методика): здесь — организационные шаги.
const steps = [
  {
    name: "Бриф",
    description:
      "Вы описываете задачу простыми словами — что не работает и что хочется изменить.",
  },
  {
    name: "Разбор задачи",
    description:
      "Обсуждаем процессы и контекст. Я говорю честно, где AI поможет, а где не нужен.",
  },
  {
    name: "Формат и план",
    description:
      "Предлагаю формат работы под задачу — от диагностики до системы под ключ — и объём по шагам.",
  },
  {
    name: "Работа по шагам",
    description:
      "Каждый шаг даёт видимый результат: карту, сценарий, работающую связку, обученную команду.",
  },
  {
    name: "Передача и поддержка",
    description:
      "Система остаётся у вас: доступы, инструкции, промпты. Дальше — сопровождение по желанию.",
  },
];

export default function ProcessTimeline() {
  return (
    <section className="border-y border-line bg-surface py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="Как проходит работа"
          title="Понятные шаги — без чёрного ящика"
          lede="На каждом этапе видно, что происходит, зачем и что вы получаете на руки."
        />
        <ol className="mt-12 space-y-0">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.name} className="relative flex gap-5 pb-8 last:pb-0 sm:gap-8">
              {i < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[19px] top-12 h-[calc(100%-2.5rem)] w-px bg-line sm:left-[23px]"
                />
              ) : null}
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-copper/40 bg-copper/10 text-sm font-semibold text-copper-deep sm:h-12 sm:w-12 sm:text-base">
                {i + 1}
              </span>
              <div className="pt-1 sm:pt-2.5">
                <h3 className="text-lg font-semibold sm:text-xl">{step.name}</h3>
                <p className="mt-1.5 max-w-2xl leading-relaxed text-muted">
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
