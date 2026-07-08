import type { Metadata } from "next";
import { site } from "@/lib/site";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy — KORA AI" },
  description: "Privacy policy for the English version of KORA AI.",
  alternates: { canonical: `${site.url}/en/privacy` },
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
              This page explains how KORA AI handles information submitted
              through the English contact form. It is an operational draft and
              should be reviewed by a qualified legal professional before a full
              public launch.
            </p>
            <p>
              We collect only the information needed to answer a request:
              name, contact details, business context and the process or
              challenge described in the form.
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
              To request correction or deletion of submitted information, use
              the direct contact channel shown on the site.
            </p>
          </div>
        </article>
      </Container>
    </div>
  );
}
