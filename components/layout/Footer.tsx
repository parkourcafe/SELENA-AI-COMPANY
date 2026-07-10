"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  nav,
  footerNote,
  cta,
  contactChannels,
  enCta,
  enFooterNote,
  enNav,
} from "@/lib/site";
import { homepage } from "@/lib/data/homepage";
import { Container } from "@/components/ui/Container";
import { BrandWordmark } from "@/components/ui/BrandWordmark";

/**
 * Dark charcoal footer — the closing contrast moment of every page.
 */
export function Footer() {
  const pathname = usePathname();
  const isLandingHome = pathname === "/";
  const isLegacyEnglishHome = pathname === "/en";
  const isEnglish = isLandingHome || pathname.startsWith("/en");
  const currentNav = isLegacyEnglishHome ? enNav : isEnglish ? homepage.nav : nav;
  const currentNote = isLandingHome ? homepage.footerNote : isEnglish ? enFooterNote : footerNote;
  const currentCta = isLegacyEnglishHome ? enCta.primary : isEnglish ? homepage.cta : cta.brief;
  const legalLinks = isEnglish
    ? [
        { href: "/en/privacy", label: "Privacy" },
        { href: "/en/terms", label: "Terms" },
      ]
    : [
        { href: "/privacy", label: "Политика конфиденциальности" },
        { href: "/terms", label: "Условия" },
      ];

  return (
    <footer className="bg-charcoal text-ivory">
      <Container>
        <div className="grid gap-12 py-16 sm:py-20 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <BrandWordmark tone="light" size="lg" />
            <p className="mt-4 max-w-sm leading-relaxed text-ivory/60">{currentNote}</p>
          </div>

          {/* Navigation */}
          <nav aria-label={isEnglish ? "Footer navigation" : "Навигация в подвале"}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-ivory/60">
              {isEnglish ? "Navigation" : "Разделы"}
            </p>
            <ul className="mt-4 space-y-2.5">
              {currentNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-ivory/75 transition-colors hover:text-copper"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Next step */}
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-ivory/60">
              {isEnglish ? "Next step" : "Следующий шаг"}
            </p>
            <p className="mt-4 leading-relaxed text-ivory/75">
              {isLandingHome
                ? "Book an AI Audit. We will map the workflow and show which system should be built first."
                : isEnglish
                  ? "Describe the process in plain language. We will map where AI can help and where it should not."
                  : "Опишите задачу простыми словами — разберём процесс и найдём, где AI поможет."}
            </p>
            <Link
              href={currentCta.href}
              className="mt-4 inline-flex items-center gap-2 font-medium text-copper transition-colors hover:text-ivory"
            >
              {currentCta.label}
              <span aria-hidden>→</span>
            </Link>
            {contactChannels.length > 0 ? (
              <ul className="mt-5 space-y-2">
                {contactChannels.map((channel) => (
                  <li key={channel.key}>
                    <a
                      href={channel.href}
                      className="text-sm text-ivory/65 transition-colors hover:text-copper"
                    >
                      {channel.label}: {channel.value}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line-dark py-7 text-sm text-ivory/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Selena Systems.{" "}
            {isEnglish
              ? "AI implementation, automation and training."
              : "AI-внедрение, автоматизация и обучение."}
          </p>
          <div className="flex gap-6">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-ivory/80">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
