import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/metadata";
import { decodeMockRun } from "@/lib/diagnostics/mockRun";
import { buildMockVisibilityReport, toFullJson, toSummaryJson } from "@/lib/diagnostics/mockEvidence";
import { isFeatureEnabled } from "@/lib/diagnostics/flags";
import { PageHero } from "@/components/sections/PageHero";
import { MockReportView } from "@/components/visibility/MockReportView";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Your Visibility Report",
    description: "A mocked Selena Visibility report generated from your submitted check.",
    path: "/report",
    locale: "en_US",
  }),
  robots: { index: false, follow: false },
};

export default async function ReportTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!isFeatureEnabled("VISIBILITY_FREE_CHECK_ENABLED")) {
    notFound();
  }

  const payload = decodeMockRun(token);
  if (!payload) {
    notFound();
  }

  const report = buildMockVisibilityReport(payload, payload.createdAt);
  const data = { ...(payload.unlocked ? toFullJson(report) : toSummaryJson(report)), unlocked: Boolean(payload.unlocked) };

  return (
    <div lang="en">
      <PageHero
        eyebrow="Your Visibility Report"
        title={`${payload.brandName} — public readiness and a limited AI sample`}
        intro="This report is generated from a mock evidence provider while live checking is being calibrated (see the methodology page for what that means)."
      />
      <MockReportView
        token={token}
        data={data}
        copy={{
          badge: "Mock evidence — Phase 1 calibration, tied to your submitted domain, not a live scan",
          checkedLabel: "Checked",
          metricLabels: {
            publicReadiness: "Public Readiness",
            entityClarity: "Entity Clarity",
            aiSample: "AI Sample",
            ownedCitation: "Owned-Domain Citation Sample",
            conversionPath: "Conversion Path",
          },
          issuesHeading: "What we found",
          fullIssueLabels: {
            whatWeFound: "What we found",
            whyItMatters: "Why it matters",
            whatThisDoesNotProve: "What this does NOT prove",
            recommendedAction: "Recommended action",
            availablePath: "Available Selena Systems path",
          },
          measurementHeading: "Evidence first.",
          whatWeMeasuredLabel: "What we measured",
          whatWeDidNotMeasureLabel: "What we did not measure",
          unlockForm: {
            heading: "See the full evidence for every issue",
            intro: "Enter your email to unlock all issues, full evidence and the recommended next step for each.",
            emailLabel: "Email",
            emailError: "Enter a valid email address.",
            consentLabel: "I agree to receive this report link — see how data is handled on the Privacy page (/en/privacy).",
            consentError: "Delivery consent is required to unlock the report.",
            marketingLabel: "Send me occasional Selena Systems insights and offers (optional).",
            submitLabel: "Unlock full report",
            submittingLabel: "Unlocking...",
            errorMessage: "Could not unlock the report. Try again in a minute.",
          },
        }}
      />
    </div>
  );
}
