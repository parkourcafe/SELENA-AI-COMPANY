import type { Metadata } from "next";
import { site } from "@/lib/site";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: { absolute: "Terms — Selena Systems" },
  description: "Terms for the English version of Selena Systems.",
  alternates: { canonical: `${site.url}/en/terms` },
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
              This page is a practical draft for the English version of Selena Systems
              and should be reviewed by a qualified legal professional before a
              full public launch.
            </p>
            <p>
              The website describes consulting, training and implementation
              services related to AI workflows, automation, content systems and
              operating playbooks.
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
          </div>
        </article>
      </Container>
    </div>
  );
}
