import { buildMetadata } from "@/lib/metadata";
import { faq } from "@/lib/data/faq";
import aiMap from "@/data/free-ai-map.json";
import { PageHero } from "@/components/sections/PageHero";
import { LeadMagnetTiles } from "@/components/sections/LeadMagnetTiles";
import { FAQSection } from "@/components/sections/FAQSection";
import { AIMapBriefForm } from "@/components/forms/AIMapBriefForm";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Badge } from "@/components/ui/Badge";

export const metadata = buildMetadata({
  title: "Бесплатная AI-карта возможностей для бизнеса",
  description:
    "Ответьте на мини-бриф и получите первичную AI-карту: 3 задачи, с которых можно начать внедрение AI в заявки, контент, клиентские ответы, CRM/Notion, команду или базу знаний.",
  path: "/free-ai-map",
});

const aiMapFaq = [faq[0], faq[1], faq[2], faq[5], faq[6]];

export default function FreeAIMapPage() {
  return (
    <>
      <PageHero
        eyebrow="Бесплатная первичная AI-карта"
        title={aiMap.headline}
        intro={aiMap.subheadline}
      />

      <section className="bg-ivory pb-20 sm:pb-28">
        <Container>
          <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <Reveal>
              <aside className="lg:sticky lg:top-28">
                <Badge tone="copper">Что вы получите</Badge>
                <div className="mt-6 space-y-4">
                  {aiMap.whatUserGets.map((item, i) => (
                    <div key={item} className="rounded-2xl border border-line bg-surface p-5">
                      <span className="font-serif text-sm text-copper-deep">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="mt-2 leading-relaxed text-ink/85">{item}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-6 rounded-2xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
                  AI-карта — это первичный разбор, не полный аудит и не обещание
                  экономии. Реальные возможности зависят от процессов, данных,
                  инструментов и роли человека.
                </p>
              </aside>
            </Reveal>

            <Reveal delay={120}>
              <AIMapBriefForm />
            </Reveal>
          </div>
        </Container>
      </section>

      <LeadMagnetTiles />
      <FAQSection items={aiMapFaq} />
    </>
  );
}
