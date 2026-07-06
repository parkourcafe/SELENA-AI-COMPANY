import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";

const oldWay = [
  "Контент создаётся рывками — когда дошли руки.",
  "Заявки теряются в чатах и личных сообщениях.",
  "Команда задаёт AI разные вопросы и получает разный результат.",
  "Администратор отвечает на одни и те же вопросы.",
  "CRM, Notion, Telegram и таблицы живут отдельно друг от друга.",
];

const transformation = [
  "Разобрать процессы",
  "Найти повторяющиеся задачи",
  "Выбрать AI-сценарии",
  "Настроить систему",
  "Обучить команду",
];

export default function ChaosToSystemSection() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="Проблема"
          title="AI уже есть. Системы часто всё ещё нет."
          lede="Инструменты доступны каждому. Но пока процессы не разобраны, AI добавляет ещё один слой хаоса вместо порядка."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
              Как обычно выглядит «мы уже используем AI»
            </p>
            <ul className="mt-5 space-y-3">
              {oldWay.map((item, i) => (
                <li
                  key={item}
                  className="rounded-xl border border-line bg-surface px-4 py-3 text-ink/85 shadow-card"
                  style={{ transform: `rotate(${((i % 2) * 2 - 1) * 0.6}deg)` }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={150}>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-copper-deep">
              Что с этим делает KORA
            </p>
            <ol className="mt-5 space-y-0">
              {transformation.map((step, i) => (
                <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < transformation.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-[15px] top-9 h-[calc(100%-2rem)] w-px bg-line"
                    />
                  ) : null}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-copper/40 bg-copper/10 text-sm font-semibold text-copper-deep">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-lg font-medium text-ink">{step}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
