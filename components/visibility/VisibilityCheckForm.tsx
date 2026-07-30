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
import { getLeadSubmitErrorMessage, submitLead } from "@/lib/leads";
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
 * Free Visibility Check intake.
 *
 * No automated scan runs here — the crawler and AI providers are not wired
 * to the public path. What the form actually does is capture a qualified
 * brief and deliver it through the site's existing lead channel
 * (`/api/leads` → Telegram/webhook), because the promise made to the
 * visitor is a review done by hand, not a machine result.
 *
 * Honesty constraints kept from the V1.2 contract: no fake scanning
 * progress, no claim that an automated check ran, and consent is an
 * explicit opt-in that is never implied (architecture §5.3).
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [businessModel, setBusinessModel] = useState<BusinessModel | "">("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    const next: Record<string, string> = {};

    for (const name of REQUIRED_FIELDS) {
      if (!field(name)) next[name] = copy.errors[name];
    }
    if (!field("contact")) next.contact = copy.lead.contactError;
    if (!data.get("consent")) next.consent = copy.lead.consentError;

    setErrors(next);
    setSubmitError("");

    const order = [...REQUIRED_FIELDS, "contact", "consent"];
    const firstInvalid = order.find((key) => next[key]);
    if (firstInvalid) {
      const element = form.elements.namedItem(firstInvalid);
      if (element instanceof HTMLElement) element.focus();
      return;
    }

    const selectedModel = field("businessModel") as BusinessModel;
    setIsSubmitting(true);
    try {
      await submitLead({
        type: "visibility_check",
        consent: true,
        fields: {
          contact: field("contact"),
          website: field("website"),
          brandName: field("brandName"),
          market: field("market"),
          language: field("language"),
          businessModel: copy.businessModelOptions[selectedModel] ?? selectedModel,
          category: field("category"),
          primaryAction:
            copy.primaryActionOptions[field("primaryAction")] ?? field("primaryAction"),
          competitor: field("competitor"),
          localBusinessMode: inferLocalBusinessMode(selectedModel) ? "yes" : "no",
        },
      });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(getLeadSubmitErrorMessage(error) || copy.networkError);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="card-premium p-8 sm:p-10" role="status">
        <p className="font-serif text-h3 text-ink">{copy.success.heading}</p>
        <p className="mt-4 leading-relaxed text-muted">{copy.success.body}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={sampleReportHref}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-copper-deep px-6 py-3 text-[0.95rem] font-medium text-surface transition-all duration-300 hover:-translate-y-px hover:bg-copper-deeper"
          >
            {copy.success.sampleReportLabel}
          </Link>
          <Link
            href={auditHref}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-[0.95rem] font-medium text-ink transition-all duration-300 hover:border-copper-deep/60 hover:text-copper-deep"
          >
            {copy.success.auditLabel}
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

      <div className="mt-8 border-t border-line pt-7">
        <h3 className="font-serif text-lg font-semibold text-ink">{copy.lead.heading}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{copy.lead.promise}</p>

        <div className="mt-5">
          <label htmlFor="check-contact" className={labelCls}>
            {copy.lead.contactLabel} <span aria-hidden="true" className="text-copper-deep">*</span>
          </label>
          <input
            id="check-contact"
            name="contact"
            type="text"
            placeholder={copy.lead.contactPlaceholder}
            required
            aria-invalid={errors.contact ? true : undefined}
            aria-describedby={errors.contact ? "check-contact-error" : undefined}
            className={cn(inputCls, errors.contact && "border-copper")}
          />
          <FieldError id="check-contact-error" message={errors.contact} />
        </div>

        <div className="mt-5">
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
              {copy.lead.consentLabel}{" "}
              <Link
                href={copy.lead.privacyHref}
                className="font-medium text-copper-deep underline decoration-copper/40 underline-offset-2 hover:decoration-copper"
              >
                {copy.lead.consentLinkLabel}
              </Link>
              .
            </label>
          </div>
          <FieldError id="check-consent-error" message={errors.consent} />
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
