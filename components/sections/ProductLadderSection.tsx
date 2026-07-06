import ladder from "@/data/offer-ladder-v3.json";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

const deliverables: Record<string, string[]> = {
  free: ["3 задачи-кандидата", "1 быстрый сценарий", "заметки по human review"],
  entry: ["карта процессов", "приоритеты", "что не автоматизировать"],
  education: ["практическая сессия", "промпты под задачи", "правила проверки"],
  core: ["дизайн workflow", "no-code связки", "тестирование и передача"],
  recurring: ["ежемесячные доработки", "новые сценарии", "поддержка команды"],
};

const hrefs: Record<string, string> = {
  free: "/free-ai-map",
  entry: "/free-ai-map",
  education: "/ai-training",
  core: "/ai-automation",
  recurring: "/contact",
};

export function ProductLadderSection() {
  return (
    <section className="bg-surface py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="Продуктовая лестница"
          headline="Можно начать с малого и не строить космический корабль из формы заявки"
          intro="Сначала бесплатная AI-карта, затем диагностика, обучение или внедрение. Без выдуманных пакетов и цен."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {ladder.levels.map((item, i) => (
            <Reveal key={item.level} delay={i * 80} className="h-full">
              <Card className="flex h-full flex-col p-5">
                <Badge tone={item.level === "free" ? "copper" : "neutral"}>
                  {item.level === "free" ? "free" : `0${i}`}
                </Badge>
                <h3 className="mt-4 text-h3 text-ink">{item.name}</h3>
                <ul className="mt-5 space-y-2 pb-6">
                  {(deliverables[item.level] ?? item.deliverable).slice(0, 3).map((point) => (
                    <li key={point} className="flex gap-2 text-sm leading-relaxed text-muted">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Button
                  href={hrefs[item.level] ?? "/free-ai-map"}
                  variant="ghost"
                  className="mt-auto justify-start px-0 text-copper-deep"
                >
                  {item.cta} →
                </Button>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
