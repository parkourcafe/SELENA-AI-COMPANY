import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

const tiles = [
  {
    title: "AI-карта возможностей",
    text: "Мини-бриф, после которого выбираем 3 задачи-кандидата для AI-внедрения.",
    status: "доступно",
    href: "/free-ai-map",
  },
  {
    title: "Чеклист «7 мест, где AI убирает рутину»",
    text: "Заявки, FAQ, контент, CRM/таблицы/Notion, инструкции, follow-up и документы.",
    status: "скоро",
    href: "/free-ai-map",
  },
  {
    title: "5-дневный мини-курс «AI без хаоса»",
    text: "Как понять, где AI реально поможет бизнесу и какой процесс выбрать первым.",
    status: "скоро",
    href: "/free-ai-map",
  },
];

export function LeadMagnetTiles() {
  return (
    <section className="bg-surface py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="Бесплатные форматы"
          headline="Можно начать с бесплатного формата"
          intro="Для MVP подключена AI-карта. Чеклист и мини-курс отмечены честно: они появятся после подготовки контента и backend-интеграции."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {tiles.map((tile, i) => (
            <Reveal key={tile.title} delay={i * 90} className="h-full">
              <Card className="flex h-full flex-col">
                <Badge tone={tile.status === "доступно" ? "copper" : "neutral"}>
                  {tile.status}
                </Badge>
                <h3 className="mt-4 text-h3 text-ink">{tile.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{tile.text}</p>
                <Button
                  href={tile.href}
                  variant={tile.status === "доступно" ? "primary" : "secondary"}
                  className="mt-auto pt-6"
                >
                  {tile.status === "доступно" ? "Заполнить мини-бриф" : "Узнать первым"}
                </Button>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
