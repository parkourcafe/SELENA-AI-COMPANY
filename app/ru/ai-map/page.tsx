import { buildMetadata } from "@/lib/metadata";
import { RussianHomeLanding } from "@/components/landing/RussianHomeLanding";

export const metadata = buildMetadata({
  title: "AI-карта возможностей для бизнеса",
  description:
    "Диагностический путь Selena Systems: оцените ручную рутину, выберите приоритет и получите карту процессов-кандидатов для AI и автоматизации.",
  path: "/ru/ai-map",
  locale: "ru_RU",
  languages: {
    en: "/en",
    ru: "/ru/ai-map",
  },
});

export default function RussianAIMapPage() {
  return <RussianHomeLanding />;
}
