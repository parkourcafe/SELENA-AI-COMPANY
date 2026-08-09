"use client";

import { useState } from "react";
import Link from "next/link";
import type { CheckFormCopy, LiveReportCopy, VisibilityLocale } from "@/lib/visibility/types";
import type { LiveReport } from "@/lib/visibility/liveReport";
import { PRIMARY_ACTIONS } from "@/lib/visibility/measurement";
import { submitLead } from "@/lib/leads";
import { LiveReportView } from "./LiveReportView";
import { cn } from "@/lib/cn";

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink placeholder:text-muted transition-colors focus:border-copper";
const labelCls = "mb-1.5 block text-sm font-medium text-ink";
const hintCls = "mt-1.5 text-sm leading-relaxed text-muted";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-medium text-copper-deep">
      {message}
    </p>
  );
}

type CheckResponse = {
  ok?: boolean;
  error?: string;
  remainingChecks?: number;
  report?: LiveReport;
};

/**
 * Free Visibility Check — the visitor gets a real result on this page.
 *
 * Submitting runs an actual check against the submitted site: our server
 * fetches its public pages and measures three of the four layers from what
 * is really there. The fourth needs a contracted AI-answer provider and is
 * returned unmeasured with the reason, never as a zero.
 *
 * The contact is the price of the result, not a substitute for it — it is
 * required to run the check, and the finished report is rendered here
 * regardless of whether the lead channel happens to be configured.
 *
 * Honesty constraints from the V1.2 contract: no fabricated progress, no
 * claim about anything that was not measured, and consent is an explicit
 * opt-in that is never implied (architecture §5.3).
 */
export function VisibilityCheckForm({
  copy,
  reportCopy,
  locale,
}: {
  copy: CheckFormCopy;
  reportCopy: LiveReportCopy;
  locale: VisibilityLocale;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [report, setReport] = useState<LiveReport | null>(null);
  const [remainingChecks, setRemainingChecks] = useState<number | undefined>(undefined);
  const [leadDelivered, setLeadDelivered] = useState(false);

  function restart() {
    setReport(null);
    setSubmitError("");
    setErrors({});
    setLeadDelivered(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    const next: Record<string, string> = {};

    if (!field("website")) next.website = copy.errors.website;
    if (!field("primaryAction")) next.primaryAction = copy.errors.primaryAction;
    if (!field("contact")) next.contact = copy.errors.contact;
    if (!data.get("consent")) next.consent = copy.errors.consent;

    setErrors(next);
    setSubmitError("");

    const firstInvalid = ["website", "primaryAction", "contact", "consent"].find((key) => next[key]);
    if (firstInvalid) {
      const element = form.elements.namedItem(firstInvalid);
      if (element instanceof HTMLElement) element.focus();
      return;
    }

    const website = field("website");
    const primaryAction = field("primaryAction");
    const contact = field("contact");

    setIsRunning(true);
    let liveReport: LiveReport | null = null;

    try {
      const response = await fetch("/api/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website, primaryAction, locale }),
      });
      const body = (await response.json().catch(() => null)) as CheckResponse | null;

      if (response.status === 429) {
        setSubmitError(reportCopy.errors.rateLimited);
      } else if (!response.ok || body?.ok !== true || !body.report) {
        setSubmitError(reportCopy.errors.generic);
      } else {
        liveReport = body.report;
        setReport(body.report);
        setRemainingChecks(body.remainingChecks);
      }
    } catch {
      setSubmitError(copy.networkError);
    }

    // The lead goes out whether or not the check succeeded — the visitor
    // asked to be contacted, and a failed check is itself worth following
    // up on. A missing lead channel must never hide the result they earned,
    // so a delivery failure only flips the note off.
    try {
      await submitLead({
        type: "visibility_check",
        consent: true,
        fields: {
          contact,
          website,
          primaryAction: copy.primaryActionOptions[primaryAction] ?? primaryAction,
          resultSummary: summarize(liveReport, locale),
        },
      });
      setLeadDelivered(true);
    } catch {
      setLeadDelivered(false);
    }

    setIsRunning(false);
  }

  if (report) {
    return (
      <LiveReportView
        report={report}
        copy={reportCopy}
        remainingChecks={remainingChecks}
        leadDelivered={leadDelivered}
        onRestart={restart}
      />
    );
  }

  if (isRunning) {
    return (
      <div className="card-premium p-8 sm:p-10" role="status" aria-live="polite">
        <p className="font-serif text-h3 text-ink">{reportCopy.running.heading}</p>
        <ul className="mt-6 grid gap-2.5">
          {reportCopy.running.steps.map((step) => (
            <li key={step} className="flex items-start gap-3 leading-relaxed text-muted">
              <span aria-hidden="true" className="mt-1 text-copper">
                ·
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
        <div className="mt-7 h-1 overflow-hidden rounded-full bg-line">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-copper" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card-premium p-6 sm:p-8">
      <h2 className="text-h3 text-ink">{copy.title}</h2>
      <p className="mt-2 leading-relaxed text-muted">{copy.intro}</p>

      <div className="mt-7 space-y-6">
        <div>
          <label htmlFor="check-website" className={labelCls}>
            {copy.fields.website} <span aria-hidden="true" className="text-copper-deep">*</span>
          </label>
          <input
            id="check-website"
            name="website"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com"
            required
            aria-invalid={errors.website ? true : undefined}
            aria-describedby={errors.website ? "check-website-error" : "check-website-hint"}
            className={cn(inputCls, errors.website && "border-copper")}
          />
          <p id="check-website-hint" className={hintCls}>
            {copy.fields.websiteHint}
          </p>
          <FieldError id="check-website-error" message={errors.website} />
        </div>

        <div>
          <label htmlFor="check-primary-action" className={labelCls}>
            {copy.fields.primaryAction}{" "}
            <span aria-hidden="true" className="text-copper-deep">*</span>
          </label>
          <select
            id="check-primary-action"
            name="primaryAction"
            defaultValue=""
            required
            aria-invalid={errors.primaryAction ? true : undefined}
            aria-describedby={
              errors.primaryAction ? "check-primary-action-error" : "check-primary-action-hint"
            }
            className={cn(inputCls, errors.primaryAction && "border-copper")}
          >
            <option value="" disabled>
              {copy.fields.primaryAction}
            </option>
            {PRIMARY_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {copy.primaryActionOptions[action]}
              </option>
            ))}
          </select>
          <p id="check-primary-action-hint" className={hintCls}>
            {copy.fields.primaryActionHint}
          </p>
          <FieldError id="check-primary-action-error" message={errors.primaryAction} />
        </div>

        <div>
          <label htmlFor="check-contact" className={labelCls}>
            {copy.fields.contact} <span aria-hidden="true" className="text-copper-deep">*</span>
          </label>
          <input
            id="check-contact"
            name="contact"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={copy.fields.contactPlaceholder}
            required
            aria-invalid={errors.contact ? true : undefined}
            aria-describedby={errors.contact ? "check-contact-error" : "check-contact-hint"}
            className={cn(inputCls, errors.contact && "border-copper")}
          />
          <p id="check-contact-hint" className={hintCls}>
            {copy.fields.contactHint}
          </p>
          <FieldError id="check-contact-error" message={errors.contact} />
        </div>

        <div>
          <div className="flex items-start gap-3">
            <input
              id="check-consent"
              name="consent"
              type="checkbox"
              required
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? "check-consent-error" : undefined}
              className="mt-1 h-5 w-5 shrink-0 rounded border-line accent-copper"
            />
            <label htmlFor="check-consent" className="text-sm leading-relaxed text-muted">
              {copy.consentLabel}{" "}
              <Link
                href={copy.privacyHref}
                className="font-medium text-copper-deep underline decoration-copper/40 underline-offset-2 hover:decoration-copper"
              >
                {copy.consentLinkLabel}
              </Link>
              .
            </label>
          </div>
          <FieldError id="check-consent-error" message={errors.consent} />
        </div>
      </div>

      {submitError ? (
        <p role="alert" className="mt-6 leading-relaxed font-medium text-copper-deep">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-copper px-8 py-4 text-base font-medium text-surface shadow-[0_10px_24px_-12px_rgba(185,130,91,0.65)] transition-all duration-300 hover:-translate-y-px hover:bg-copper-deep sm:w-auto"
      >
        {copy.submitLabel}
      </button>

      <div className="mt-8 border-t border-line pt-6">
        <h3 className="font-serif text-lg font-semibold text-ink">{copy.whatYouGet.heading}</h3>
        <ul className="mt-4 grid gap-2.5">
          {copy.whatYouGet.items.map((item) => (
            <li key={item} className="flex items-start gap-3 leading-relaxed text-muted">
              <span aria-hidden="true" className="mt-1 text-copper">
                →
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}

/** A one-line summary so the operator sees the result, not just the contact. */
const LAYER_NAMES: Record<string, { ru: string; en: string }> = {
  discoverability: { ru: "Находимость", en: "Discoverability" },
  understanding: { ru: "Понятность", en: "Understanding" },
  recommendation_evidence: { ru: "Упоминания в AI-ответах", en: "AI-answer evidence" },
  action_readiness: { ru: "Готовность к действию", en: "Action readiness" },
};

/** Traffic-light per layer so the owner reads the message at a glance. */
function trafficLight(score: number): string {
  return score >= 80 ? "🟢" : score >= 50 ? "🟡" : "🔴";
}

function summarize(report: LiveReport | null, locale: VisibilityLocale): string {
  if (!report) {
    return locale === "ru" ? "Проверка не завершилась" : "Check did not complete";
  }
  if (!report.reachable) {
    return locale === "ru"
      ? `🔴 Сайт недоступен (${report.fetchError ?? "нет ответа"})`
      : `🔴 Site unreachable (${report.fetchError ?? "no response"})`;
  }
  const lines = report.layers.map((layer) => {
    const name = LAYER_NAMES[layer.id]?.[locale] ?? layer.id;
    if (!layer.measured || layer.score === null) {
      return `⚪️ ${name} — ${locale === "ru" ? "не измерялось" : "not measured"}`;
    }
    return `${trafficLight(layer.score)} ${name} — ${layer.score}/100`;
  });
  const blocker = report.topBlocker?.title;
  if (blocker) {
    lines.push("", `⚠️ ${locale === "ru" ? "Исправить первым" : "Fix first"}: ${blocker}`);
  } else {
    lines.push("", `✅ ${locale === "ru" ? "Блокеров не найдено" : "No blockers found"}`);
  }
  return lines.join("\n");
}
