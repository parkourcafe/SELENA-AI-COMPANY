import { buildMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/sections/PageHero";
import { Container } from "@/components/ui/Container";

export const metadata = buildMetadata({
  title: "Условия использования",
  description:
    "Условия использования сайта KORA: сайт носит информационный характер, услуги оказываются по договорённости после брифа и обсуждения задачи.",
  path: "/terms",
});

const sections = [
  {
    title: "О сайте",
    text: "Этот сайт носит информационный характер: он описывает подход и услуги KORA по внедрению AI, автоматизации и обучению. Материалы сайта не являются публичной офертой.",
  },
  {
    title: "Как оказываются услуги",
    text: "Услуги оказываются по индивидуальной договорённости после брифа и обсуждения задачи. Состав работ, формат и стоимость фиксируются до начала сотрудничества.",
  },
  {
    title: "Об ожиданиях",
    text: "Материалы сайта описывают возможные сценарии применения AI и не являются гарантией конкретного результата: реальный эффект зависит от процессов, данных и вовлечённости команды. Границы и ограничения проговариваются до начала работы.",
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Документы"
        title="Условия использования"
        intro="Честные базовые условия — без мелкого шрифта и скрытых пунктов."
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
              запуска.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
