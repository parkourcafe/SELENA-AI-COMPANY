"use client";

import { useState } from "react";
import Link from "next/link";
import type { CheckFormCopy } from "@/lib/visibility/types";
import {
  BUSINESS_MODELS,
  PRIMARY_ACTIONS,
  inferLocalBusinessMode,
  type BusinessModel,
} from "@/lib/visibility/measurement";
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

const REQUIRED_FIELDS = [
  "website",
  "brandName",
  "market",
  "language",
  "businessModel",
  "category",
  "primaryAction",
] as const;

/**
 * Free Visibility Check intake (Codex Execution TZ V1.2, section D).
 *
 * This is a UI contract only. On submit the form validates locally and
 * opens an explicitly labelled sample state — it makes NO network
 * request, collects NO email, and shows NO scanning progress animation,
 * because no scan exists to report on (decision 18).
 */
export function VisibilityCheckForm({
  copy,
  sampleReportHref,
  auditHref,
}: {
  copy: CheckFormCopy;
  sampleReportHref: string;
  auditHref: string;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [businessModel, setBusinessModel] = useState<BusinessModel | "">("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    const next: Record<string, string> = {};

    for (const name of REQUIRED_FIELDS) {
      if (!field(name)) next[name] = copy.errors[name];
    }

    setErrors(next);
    const firstInvalid = REQUIRED_FIELDS.find((key) => next[key]);
    if (firstInvalid) {
      const element = form.elements.namedItem(firstInvalid);
      if (element instanceof HTMLElement) element.focus();
      return;
    }

    // No fetch, no scan, no email: this run only opens the sample state.
    setSubmitted(true);
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

  const localModeActive = businessModel !== "" && inferLocalBusinessMode(businessModel);

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
            <label htmlFor="check-business-model" className={labelCls}>
              {copy.fields.businessModel} <span aria-hidden="true" className="text-copper-deep">*</span>
            </label>
            <select
              id="check-business-model"
              name="businessModel"
              value={businessModel}
              onChange={(event) => setBusinessModel(event.target.value as BusinessModel | "")}
              required
              aria-invalid={errors.businessModel ? true : undefined}
              aria-describedby={
                errors.businessModel
                  ? "check-business-model-error"
                  : localModeActive
                    ? "check-local-mode-note"
                    : undefined
              }
              className={cn(inputCls, errors.businessModel && "border-copper")}
            >
              <option value="" disabled>
                {copy.fields.businessModel}
              </option>
              {BUSINESS_MODELS.map((model) => (
                <option key={model} value={model}>
                  {copy.businessModelOptions[model]}
                </option>
              ))}
            </select>
            <FieldError id="check-business-model-error" message={errors.businessModel} />
          </div>
        </div>

        {localModeActive ? (
          <p
            id="check-local-mode-note"
            className="rounded-xl border border-copper/30 bg-copper/[0.06] p-4 text-sm leading-relaxed text-ink/80"
          >
            {copy.localBusinessModeNote}
          </p>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
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

          <div>
            <label htmlFor="check-primary-action" className={labelCls}>
              {copy.fields.primaryAction} <span aria-hidden="true" className="text-copper-deep">*</span>
            </label>
            <select
              id="check-primary-action"
              name="primaryAction"
              defaultValue=""
              required
              aria-invalid={errors.primaryAction ? true : undefined}
              aria-describedby={errors.primaryAction ? "check-primary-action-error" : undefined}
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
            <FieldError id="check-primary-action-error" message={errors.primaryAction} />
          </div>
        </div>

        <div>
          <label htmlFor="check-competitor" className={labelCls}>
            {copy.fields.competitor}
          </label>
          <input id="check-competitor" name="competitor" type="text" className={inputCls} />
        </div>
      </div>

      <button
        type="submit"
        className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-copper px-8 py-4 text-base font-medium text-surface shadow-[0_10px_24px_-12px_rgba(185,130,91,0.65)] transition-all duration-300 hover:-translate-y-px hover:bg-copper-deep sm:w-auto"
      >
        {copy.submitLabel}
      </button>
    </form>
  );
}
