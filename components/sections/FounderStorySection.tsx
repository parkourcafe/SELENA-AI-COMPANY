import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";

export function FounderStorySection() {
  return (
    <section className="bg-ivory py-20 sm:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <SectionHeader
            eyebrow="Подход"
            headline="Почему я этим занимаюсь"
            intro="AI полезен только тогда, когда встроен в реальную работу: заявки, ответы клиентам, контент, CRM, Notion, Telegram/WhatsApp, документы и командные правила."
          />
          <Reveal delay={120}>
            <div className="card-premium p-6 sm:p-8">
              <p className="text-lg leading-relaxed text-ink/85">
                Я работаю на стыке AI, маркетинга, упаковки, контента и процессов.
                Поэтому смотрю на AI не как на модный курс и не как на игрушку, а
                как на инструмент, который должен снимать повторяющуюся рутину и
                помогать людям работать предсказуемее.
              </p>
              <p className="mt-5 leading-relaxed text-muted">
                Подход простой: сначала понять процесс, потом выбрать инструмент,
                потом собрать сценарий и научить людей пользоваться им без
                технической паники.
              </p>
              <p className="mt-5 rounded-xl border border-line bg-ivory p-4 text-sm leading-relaxed text-muted">
                TODO(launch): добавить финальное имя, реальное фото или знак, а
                также подтверждённые факты бэкграунда без выдуманных регалий.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
