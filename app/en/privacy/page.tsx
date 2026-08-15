import type { Metadata } from "next";
import { site } from "@/lib/site";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy — Selena Systems" },
  description: "Privacy policy for the English version of Selena Systems.",
  alternates: {
    canonical: `${site.url}/en/privacy`,
    languages: {
      "x-default": `${site.url}/en/privacy`,
      en: `${site.url}/en/privacy`,
      ru: `${site.url}/privacy`,
    },
  },
};

export default function EnglishPrivacyPage() {
  return (
    <div lang="en" className="bg-ivory py-32 sm:py-40">
      <Container>
        <article className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-copper-deep">
            Privacy
          </p>
          <h1 className="mt-4 text-h1 text-ink">Privacy Policy</h1>
          <div className="mt-8 space-y-6 leading-relaxed text-muted">
            <p>
              This page explains how Selena Systems handles information submitted
              through its public forms and free website check during early access.
            </p>
            <p>
              The disclosed operator for Selena AI Visibility is PT Izi Jiza Bali,
              Indonesia. The official privacy-request channel is the contact form
              linked on this site. Registered business details and payment-specific
              disclosures will be included in the applicable contract or invoice
              before any paid order is accepted.
            </p>
            <p>
              We collect only the information needed to answer a request:
              name, contact details, business context and the process or
              challenge described in the form.
            </p>
            <p>
              The free visibility check form collects the website address,
              the primary customer action, and a phone or WhatsApp number.
              Our server then fetches that site&rsquo;s public pages &mdash; the
              homepage and, if they are linked from it, a service page and an
              about page &mdash; and reads their markup. Only what is already
              available to any visitor is fetched; private areas, forms and
              personal data are not requested. The result is shown to you on
              the page and is passed to the lead channel together with the
              contact you left.
            </p>
            <p>
              Form submissions may be delivered to a configured lead channel,
              such as Telegram or a webhook. If that channel is not configured,
              the site offers a WhatsApp fallback controlled by the visitor.
            </p>
            <p>
              We do not sell submitted data. We use it to review the request,
              prepare questions, suggest a format of work and maintain basic
              communication history.
            </p>
            <p>
              Early-access enquiries are reviewed at least quarterly and removed
              no later than 12 months after the last contact, unless a service
              agreement, dispute or legal obligation requires a longer period.
              Delivery providers such as Telegram or a configured CRM may retain
              their own copies under their published policies.
            </p>
            <p>
              To request correction or deletion of submitted information, use
              the contact form shown on the site and identify the contact detail
              used in the original request.
            </p>
            <p className="border-t border-line pt-6 text-sm">
              Last updated: 15 August 2026.
            </p>
          </div>
        </article>
      </Container>
    </div>
  );
}
