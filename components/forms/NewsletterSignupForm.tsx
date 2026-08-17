"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createIdempotencyKey,
  formatLeadFallbackMessage,
  getLeadSubmitErrorMessage,
  submitLead,
} from "@/lib/leads";
import { createWhatsappHref } from "@/lib/site";
import { trackPublicEvent } from "@/lib/diagnostics/analytics";

export function NewsletterSignupForm() {
  const [error, setError] = useState("");
  const [consentError, setConsentError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [fallbackHref, setFallbackHref] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    trackPublicEvent("form_view", { form_id: "newsletter_signup" });
  }, []);

  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackPublicEvent("form_start", { form_id: "newsletter_signup" });
    const form = event.currentTarget;
    const data = new FormData(form);
    const contact = String(data.get("newsletterContact") ?? "").trim();
    const consent = Boolean(data.get("newsletterConsent"));

    setError(contact ? "" : "Оставьте email или Telegram, чтобы получить разборы.");
    setConsentError(consent ? "" : "Нужно согласие на обработку данных для подписки.");
    if (!contact || !consent) {
      trackPublicEvent("form_error", {
        form_id: "newsletter_signup",
        field: !contact ? "contact" : "consent",
        error_type: "validation",
      });
    }
    setSubmitError("");
    setFallbackHref(null);

    if (!contact || !consent) {
      const field = form.elements.namedItem(!contact ? "newsletterContact" : "newsletterConsent");
      if (field instanceof HTMLElement) field.focus();
      return;
    }

    const fallbackMessage = formatLeadFallbackMessage("Подписка на AI без хаоса", {
      Контакт: contact,
    });

    setIsSubmitting(true);
    try {
      const idempotencyKey =
        idempotencyKeyRef.current ??
        (idempotencyKeyRef.current = createIdempotencyKey());
      await submitLead({
        type: "newsletter_signup",
        consent: true,
        idempotencyKey,
        honeypot: String(data.get("website") ?? "").trim(),
        fields: { contact },
      });
      trackPublicEvent("form_submit_success", {
        form_id: "newsletter_signup",
        product_line: "selena-lab",
      }, "marketing");
      setSubmitted(true);
    } catch (submitError) {
      trackPublicEvent("form_submit_error", {
        form_id: "newsletter_signup",
        error_type: submitError instanceof Error ? submitError.name : "unknown",
      }, "marketing");
      setSubmitError(getLeadSubmitErrorMessage(submitError));
      setFallbackHref(createWhatsappHref(fallbackMessage));
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
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />
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
        <div
          role="alert"
          className="mt-3 rounded-xl border border-copper/35 bg-copper/10 p-3 text-sm text-copper"
        >
          <p className="font-medium">{submitError}</p>
          {fallbackHref ? (
            <a
              href={fallbackHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackPublicEvent("whatsapp_click", {
              placement: "newsletter_fallback",
              product_line: "selena-lab",
              locale: "ru",
            }, "marketing")}
            className="mt-2 inline-flex rounded-full bg-ivory px-4 py-2 font-medium text-ink transition-colors hover:bg-surface"
            >
              Отправить в WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
