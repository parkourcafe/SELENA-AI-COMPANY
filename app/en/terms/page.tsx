import type { Metadata } from "next";
import { site } from "@/lib/site";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: { absolute: "Terms — Selena Systems" },
  description: "Terms for the English version of Selena Systems.",
  alternates: {
    canonical: `${site.url}/en/terms`,
    languages: {
      "x-default": `${site.url}/en/terms`,
      en: `${site.url}/en/terms`,
      ru: `${site.url}/terms`,
    },
  },
};

export default function EnglishTermsPage() {
  return (
    <div lang="en" className="bg-ivory py-32 sm:py-40">
      <Container>
        <article className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-copper-deep">
            Terms
          </p>
          <h1 className="mt-4 text-h1 text-ink">Terms of Use</h1>
          <div className="mt-8 space-y-6 leading-relaxed text-muted">
            <p>
              These terms govern the public website and early-access requests for
              Selena Systems. They do not open online checkout or create a paid
              order by themselves.
            </p>
            <p>
              The website describes consulting, training and implementation
              services related to AI workflows, automation, content systems and
              operating playbooks.
            </p>
            <p>
              Selena AI Visibility is a Selena Systems product line operated by
              PT Izi Jiza Bali, Indonesia. Online checkout and live recurring
              billing are not currently open. A displayed price or early-access
              request does not create an order until scope, total amount and
              activation conditions are confirmed.
            </p>
            <p>
              Any examples on the site are illustrative. Selena Systems does not
              promise revenue growth, guaranteed savings or replacement of human
              judgment.
            </p>
            <p>
              A submitted brief does not create a service agreement. Scope,
              timing, deliverables and fees are agreed separately after the
              request is reviewed.
            </p>
            <p>
              AI systems can make mistakes. Production use should include
              appropriate review, testing and clear human responsibility.
            </p>
            <p className="border-t border-line pt-6 text-sm">
              Last updated: 15 August 2026. Separate payment, refund and commercial
              terms will be published and legally reviewed before live online
              payments are enabled.
            </p>
          </div>
        </article>
      </Container>
    </div>
  );
}
