import { buildMetadata } from "@/lib/metadata";
import { cta } from "@/lib/site";
import { PageHero } from "@/components/sections/PageHero";
import { ServiceModuleGrid } from "@/components/sections/ServiceModuleGrid";
import { PackageCards } from "@/components/sections/PackageCards";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Button } from "@/components/ui/Button";

export const metadata = buildMetadata({
  title: "Услуги",
  description:
    "Восемь модулей AI-внедрения: аудит, обучение, автоматизация, контент-система, AI-консьерж, база знаний, упаковка и сопровождение. Формат оценивается после брифа.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Услуги"
        title="Восемь модулей — от диагностики до сопровождения"
        intro="Ваша AI-система собирается из понятных модулей: можно начать с одного и расширяться по мере того, как он приживается. Не нужно внедрять всё сразу."
      >
        <div className="flex flex-wrap items-center gap-4">
          <Button href={cta.primary.href} size="lg">
            {cta.primary.label}
          </Button>
          <p className="text-sm font-medium text-ink/70">
            Не знаете, с чего начать, — начните с брифа.
          </p>
        </div>
      </PageHero>

      <ServiceModuleGrid withHeader={false} />
      <PackageCards />
      <FinalCTA />
    </>
  );
}
