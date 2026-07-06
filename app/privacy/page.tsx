import { buildMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/sections/PageHero";
import { Container } from "@/components/ui/Container";

export const metadata = buildMetadata({
  title: "Политика конфиденциальности",
  description:
    "Как KORA обрабатывает данные из формы брифа: что собирается, зачем, и как запросить удаление. Лишние данные не собираются и никому не передаются.",
  path: "/privacy",
});

const sections = [
  {
    title: "Какие данные собираются",
    text: "Только то, что вы сами указали в форме брифа: имя, контакт для связи (Telegram, WhatsApp или email) и описание вашей задачи. Никакие дополнительные данные о вас не запрашиваются и не собираются.",
  },
  {
    title: "Зачем они нужны",
    text: "Единственная цель — ответить на вашу заявку: разобрать задачу, задать уточняющие вопросы и предложить формат работы. Данные не используются для рассылок без вашего отдельного согласия.",
  },
  {
    title: "Кому передаются",
    text: "Никому. Данные из брифа не продаются, не передаются третьим лицам и не используются в рекламных сетях.",
  },
  {
    title: "Как удалить свои данные",
    text: "Напишите запрос на удаление любым способом, которым вы связывались с KORA, — данные вашей заявки будут удалены.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Документы"
        title="Политика конфиденциальности"
        intro="Коротко и по-человечески: какие данные попадают в KORA через форму брифа и что с ними происходит."
      />

      {/* TODO(legal): review before launch — документ должен быть проверен
          юристом и дополнен реквизитами до публичного запуска. */}
      <section className="pb-20 sm:pb-28">
        <Container size="narrow">
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-h3 text-ink">{section.title}</h2>
                <p className="mt-3 leading-relaxed text-muted">{section.text}</p>
              </div>
            ))}
            <p className="border-t border-line pt-6 text-sm leading-relaxed text-muted">
              Документ будет дополнен реквизитами и юридическими деталями до
              запуска. Если у вас есть вопрос про данные — задайте его прямо в
              форме брифа.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
