"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CheckFormCopy } from "@/lib/visibility/types";
import { cn } from "@/lib/cn";

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
];

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink placeholder:text-muted transition-colors focus:border-copper";
const labelCls = "mb-1.5 block text-sm font-medium text-ink";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-medium text-copper-deep">
      {message}
    </p>
  );
}

/**
 * Free Visibility Check intake (SSOT §29.4). This PR ships route shells
 * only: no network call, no email collection, no fake scanning animation.
 * A valid submit reveals an explicitly labelled calibration state instead
 * of pretending a scan ran (SSOT §29.4: "Нельзя имитировать scanning
 * animation, если никакой scan не выполняется").
 */
export function VisibilityCheckForm({
  copy,
  sampleReportHref,
  auditHref,
  mockFlowEnabled = false,
}: {
  copy: CheckFormCopy;
  sampleReportHref: string;
  auditHref: string;
  /**
   * Server-checked VISIBILITY_FREE_CHECK_ENABLED flag (SSOT §27.7: "flags
   * проверяются server-side"). When false (the default in every
   * environment today), this form behaves exactly as it did in PR-01:
   * client-side validation only, no network call, honest calibration
   * message. When true, it posts to the Phase 1 mocked pipeline
   * (/api/checks) and navigates to the resulting mock report.
   */
  mockFlowEnabled?: boolean;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    const next: Record<string, string> = {};

    if (!field("website")) next.website = copy.errors.website;
    if (!field("brandName")) next.brandName = copy.errors.brandName;
    if (!field("market")) next.market = copy.errors.market;
    if (!field("language")) next.language = copy.errors.language;
    if (!field("category")) next.category = copy.errors.category;

    setErrors(next);
    setSubmitError("");
    const firstInvalid = ["website", "brandName", "market", "language", "category"].find(
      (key) => next[key],
    );
    if (firstInvalid) {
      const element = form.elements.namedItem(firstInvalid);
      if (element instanceof HTMLElement) element.focus();
      return;
    }

    if (!mockFlowEnabled) {
      // No fetch, no submitLead: this run does not send data anywhere.
      setSubmitted(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosticType: "visibility",
          website: field("website"),
          brandName: field("brandName"),
          market: field("market"),
          language: field("language"),
          category: field("category"),
          competitor: field("competitor") || undefined,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.reportPath) {
        setSubmitError(copy.networkError);
        return;
      }
      router.push(body.reportPath);
    } catch {
      setSubmitError(copy.networkError);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="card-premium p-8 sm:p-10" role="status">
        <p className="font-serif text-h3 text-ink">{copy.calibration.heading}</p>
        <p className="mt-4 leading-relaxed text-muted">{copy.calibration.body}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={sampleReportHref}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-copper-deep px-6 py-3 text-[0.95rem] font-medium text-surface transition-all duration-300 hover:-translate-y-px hover:bg-copper-deeper"
          >
            {copy.calibration.sampleReportLabel}
          </Link>
          <Link
            href={auditHref}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-[0.95rem] font-medium text-ink transition-all duration-300 hover:border-copper-deep/60 hover:text-copper-deep"
          >
            {copy.calibration.auditLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card-premium p-6 sm:p-8">
      <h2 className="text-h3 text-ink">{copy.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{copy.intro}</p>

      <div className="mt-7 space-y-5">
        <div>
          <label htmlFor="check-website" className={labelCls}>
            {copy.fields.website} <span aria-hidden="true" className="text-copper-deep">*</span>
          </label>
          <input
            id="check-website"
            name="website"
            type="text"
            inputMode="url"
            placeholder="https://example.com"
            required
            aria-invalid={errors.website ? true : undefined}
            aria-describedby={errors.website ? "check-website-error" : undefined}
            className={cn(inputCls, errors.website && "border-copper")}
          />
          <FieldError id="check-website-error" message={errors.website} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="check-brand" className={labelCls}>
              {copy.fields.brandName} <span aria-hidden="true" className="text-copper-deep">*</span>
            </label>
            <input
              id="check-brand"
              name="brandName"
              type="text"
              required
              aria-invalid={errors.brandName ? true : undefined}
              aria-describedby={errors.brandName ? "check-brand-error" : undefined}
              className={cn(inputCls, errors.brandName && "border-copper")}
            />
            <FieldError id="check-brand-error" message={errors.brandName} />
          </div>

          <div>
            <label htmlFor="check-market" className={labelCls}>
              {copy.fields.market} <span aria-hidden="true" className="text-copper-deep">*</span>
            </label>
            <input
              id="check-market"
              name="market"
              type="text"
              required
              aria-invalid={errors.market ? true : undefined}
              aria-describedby={errors.market ? "check-market-error" : undefined}
              className={cn(inputCls, errors.market && "border-copper")}
            />
            <FieldError id="check-market-error" message={errors.market} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="check-language" className={labelCls}>
              {copy.fields.language} <span aria-hidden="true" className="text-copper-deep">*</span>
            </label>
            <select
              id="check-language"
              name="language"
              defaultValue=""
              required
              aria-invalid={errors.language ? true : undefined}
              aria-describedby={errors.language ? "check-language-error" : undefined}
              className={cn(inputCls, errors.language && "border-copper")}
            >
              <option value="" disabled>
                {copy.fields.language}
              </option>
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError id="check-language-error" message={errors.language} />
          </div>

          <div>
            <label htmlFor="check-category" className={labelCls}>
              {copy.fields.category} <span aria-hidden="true" className="text-copper-deep">*</span>
            </label>
            <input
              id="check-category"
              name="category"
              type="text"
              required
              aria-invalid={errors.category ? true : undefined}
              aria-describedby={errors.category ? "check-category-error" : undefined}
              className={cn(inputCls, errors.category && "border-copper")}
            />
            <FieldError id="check-category-error" message={errors.category} />
          </div>
        </div>

        <div>
          <label htmlFor="check-competitor" className={labelCls}>
            {copy.fields.competitor}
          </label>
          <input id="check-competitor" name="competitor" type="text" className={inputCls} />
        </div>
      </div>

      {submitError ? (
        <p role="alert" className="mt-5 text-sm font-medium text-copper-deep">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-copper px-8 py-4 text-base font-medium text-surface shadow-[0_10px_24px_-12px_rgba(185,130,91,0.65)] transition-all duration-300 hover:-translate-y-px hover:bg-copper-deep disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {isSubmitting ? copy.submittingLabel : copy.submitLabel}
      </button>
    </form>
  );
}
