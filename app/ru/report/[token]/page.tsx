import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/metadata";
import { decodeMockRun } from "@/lib/diagnostics/mockRun";
import { buildMockVisibilityReport, toFullJson, toSummaryJson } from "@/lib/diagnostics/mockEvidence";
import { isLegacyMockReportEnabled } from "@/lib/diagnostics/flags";
import { PageHero } from "@/components/sections/PageHero";
import { MockReportView } from "@/components/visibility/MockReportView";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Ваш отчёт о видимости",
    description: "Смоделированный отчёт AI Visibility по вашей отправленной проверке.",
    path: "/ru/report",
    locale: "ru_RU",
  }),
  robots: { index: false, follow: false },
};

export default async function RussianReportTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!isLegacyMockReportEnabled()) {
    notFound();
  }

  const payload = decodeMockRun(token);
  if (!payload) {
    notFound();
  }

  const report = buildMockVisibilityReport(payload, payload.createdAt);
  const data = { ...(payload.unlocked ? toFullJson(report) : toSummaryJson(report)), unlocked: Boolean(payload.unlocked) };

  return (
    <>
      <PageHero
        eyebrow="Ваш отчёт о видимости"
        title={`${payload.brandName} — публичная готовность и ограниченная AI-выборка`}
        intro="Этот отчёт построен на моковом провайдере, пока живая проверка калибруется (см. страницу методологии)."
      />
      <MockReportView
        token={token}
        data={data}
        copy={{
          badge: "Моковые данные — калибровка Phase 1, привязана к вашему домену, не живое сканирование",
          checkedLabel: "Проверено",
          metricLabels: {
            publicReadiness: "Public Readiness",
            entityClarity: "Entity Clarity",
            aiSample: "AI Sample",
            ownedCitation: "Owned-Domain Citation Sample",
            conversionPath: "Conversion Path",
          },
          issuesHeading: "Что мы нашли",
          fullIssueLabels: {
            whatWeFound: "Что мы нашли",
            whyItMatters: "Почему это важно",
            whatThisDoesNotProve: "Чего это НЕ доказывает",
            recommendedAction: "Рекомендуемое действие",
            availablePath: "Доступный путь Selena Systems",
          },
          measurementHeading: "Сначала доказательства.",
          whatWeMeasuredLabel: "Что мы измерили",
          whatWeDidNotMeasureLabel: "Чего мы не измерили",
          unlockForm: {
            heading: "Посмотреть полное доказательство по каждому issue",
            intro: "Укажите email, чтобы открыть все issues, полное доказательство и рекомендованный следующий шаг по каждому.",
            emailLabel: "Email",
            emailError: "Укажите корректный email.",
            consentLabel: "Согласен(на) получить ссылку на отчёт — как обрабатываются данные, см. страницу /privacy.",
            consentError: "Согласие на доставку обязательно для разблокировки отчёта.",
            marketingLabel: "Присылайте иногда разборы и предложения Selena Systems (опционально).",
            submitLabel: "Открыть полный отчёт",
            submittingLabel: "Открываем...",
            errorMessage: "Не удалось открыть отчёт. Попробуйте ещё раз через минуту.",
          },
        }}
      />
    </>
  );
}
