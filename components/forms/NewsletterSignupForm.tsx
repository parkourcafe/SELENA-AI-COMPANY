"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getLeadSubmitErrorMessage, submitLead } from "@/lib/leads";

export function NewsletterSignupForm() {
  const [error, setError] = useState("");
  const [consentError, setConsentError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const contact = String(data.get("newsletterContact") ?? "").trim();
    const consent = Boolean(data.get("newsletterConsent"));

    setError(contact ? "" : "Оставьте email или Telegram, чтобы получить разборы.");
    setConsentError(consent ? "" : "Нужно согласие на обработку данных для подписки.");
    setSubmitError("");

    if (!contact || !consent) {
      const field = form.elements.namedItem(!contact ? "newsletterContact" : "newsletterConsent");
      if (field instanceof HTMLElement) field.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await submitLead({
        type: "newsletter_signup",
        consent: true,
        fields: { contact },
      });
      setSubmitted(true);
    } catch (submitError) {
      setSubmitError(getLeadSubmitErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        className="rounded-2xl border border-line-dark bg-charcoal-2 p-5"
      >
        <p className="font-serif text-h3 text-ivory">Подписка сохранена</p>
        <p className="mt-2 text-sm leading-relaxed text-ivory/70">
          Контакт отправлен. Буду присылать практические разборы без шума и лишней частоты.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-line-dark bg-charcoal-2 p-5">
      <label htmlFor="newsletter-contact" className="block text-sm font-medium text-ivory">
        Email или Telegram
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="newsletter-contact"
          name="newsletterContact"
          type="text"
          placeholder="email или @username"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "newsletter-contact-error" : undefined}
          className="min-h-12 flex-1 rounded-xl border border-line-dark bg-charcoal px-4 text-ivory placeholder:text-ivory/40 focus:border-copper"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-12 rounded-full bg-ivory px-6 font-medium text-ink transition-colors hover:bg-surface disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? "Отправляем..." : "Получать разборы"}
        </button>
      </div>
      {error ? (
        <p id="newsletter-contact-error" className="mt-2 text-sm text-copper">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex items-start gap-3">
        <input
          id="newsletter-consent"
          name="newsletterConsent"
          type="checkbox"
          aria-invalid={consentError ? true : undefined}
          aria-describedby={consentError ? "newsletter-consent-error" : undefined}
          className="mt-1 h-5 w-5 shrink-0 accent-copper"
        />
        <label htmlFor="newsletter-consent" className="text-sm leading-relaxed text-ivory/65">
          Согласен(на) на обработку данных для подписки. Подробности —{" "}
          <Link href="/privacy" className="text-ivory underline decoration-copper underline-offset-2">
            в политике
          </Link>
          .
        </label>
      </div>
      {consentError ? (
        <p id="newsletter-consent-error" className="mt-2 text-sm text-copper">
          {consentError}
        </p>
      ) : null}
      {submitError ? (
        <p role="alert" className="mt-3 text-sm font-medium text-copper">
          {submitError}
        </p>
      ) : null}
    </form>
  );
}
