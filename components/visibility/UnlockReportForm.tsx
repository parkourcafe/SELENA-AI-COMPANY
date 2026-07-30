"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

export type UnlockFormCopy = {
  heading: string;
  intro: string;
  emailLabel: string;
  emailError: string;
  consentLabel: string;
  consentError: string;
  marketingLabel: string;
  submitLabel: string;
  submittingLabel: string;
  errorMessage: string;
};

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink placeholder:text-muted transition-colors focus:border-copper";

/**
 * Mock unlock UI (SSOT §5.3, §13.4). Two distinct consent checkboxes —
 * transactional (required) and marketing (optional, off by default) —
 * because delivery consent is never allowed to imply marketing consent.
 */
export function UnlockReportForm({ token, copy }: { token: string; copy: UnlockFormCopy }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const consent = data.get("consent");
    const marketingOptIn = data.get("marketingOptIn") === "on";

    const next: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = copy.emailError;
    if (!consent) next.consent = copy.consentError;

    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reports/${token}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, marketingOptIn, consentVersion: "report-delivery-v1" }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.reportPath) {
        setSubmitError(copy.errorMessage);
        return;
      }
      router.push(body.reportPath);
    } catch {
      setSubmitError(copy.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card-premium p-6 sm:p-8">
      <h3 className="text-h3 text-ink">{copy.heading}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{copy.intro}</p>

      <div className="mt-6">
        <label htmlFor="unlock-email" className="mb-1.5 block text-sm font-medium text-ink">
          {copy.emailLabel}
        </label>
        <input
          id="unlock-email"
          name="email"
          type="email"
          required
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "unlock-email-error" : undefined}
          className={cn(inputCls, errors.email && "border-copper")}
        />
        {errors.email ? (
          <p id="unlock-email-error" className="mt-1.5 text-sm font-medium text-copper-deep">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-start gap-3">
          <input
            id="unlock-consent"
            name="consent"
            type="checkbox"
            required
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "unlock-consent-error" : undefined}
            className="mt-1 h-5 w-5 shrink-0 rounded border-line accent-copper"
          />
          <label htmlFor="unlock-consent" className="text-sm leading-relaxed text-muted">
            {copy.consentLabel}
          </label>
        </div>
        {errors.consent ? (
          <p id="unlock-consent-error" className="text-sm font-medium text-copper-deep">
            {errors.consent}
          </p>
        ) : null}

        <div className="flex items-start gap-3">
          <input
            id="unlock-marketing"
            name="marketingOptIn"
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 rounded border-line accent-copper"
          />
          <label htmlFor="unlock-marketing" className="text-sm leading-relaxed text-muted">
            {copy.marketingLabel}
          </label>
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
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-copper px-8 py-4 text-base font-medium text-surface shadow-[0_10px_24px_-12px_rgba(185,130,91,0.65)] transition-all duration-300 hover:-translate-y-px hover:bg-copper-deep disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {isSubmitting ? copy.submittingLabel : copy.submitLabel}
      </button>
    </form>
  );
}
