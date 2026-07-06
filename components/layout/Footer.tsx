import Link from "next/link";
import { nav, footerNote, cta } from "@/lib/site";
import { Container } from "@/components/ui/Container";

/**
 * Dark charcoal footer — the closing contrast moment of every page.
 */
export function Footer() {
  return (
    <footer className="bg-charcoal text-ivory">
      <Container>
        <div className="grid gap-12 py-16 sm:py-20 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <p className="font-serif text-3xl font-semibold tracking-tight">
              KORA<span className="text-copper">.</span>
            </p>
            <p className="mt-4 max-w-sm leading-relaxed text-ivory/60">{footerNote}</p>
          </div>

          {/* Navigation */}
          <nav aria-label="Навигация в подвале">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-ivory/40">
              Разделы
            </p>
            <ul className="mt-4 space-y-2.5">
              {nav.map((item) => (
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
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-ivory/40">
              Следующий шаг
            </p>
            <p className="mt-4 leading-relaxed text-ivory/75">
              Опишите задачу простыми словами — разберём процесс и найдём, где AI поможет.
            </p>
            <Link
              href={cta.brief.href}
              className="mt-4 inline-flex items-center gap-2 font-medium text-copper transition-colors hover:text-ivory"
            >
              {cta.brief.label}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line-dark py-7 text-sm text-ivory/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} KORA. AI-внедрение, автоматизация и обучение.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-ivory/80">
              Политика конфиденциальности
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ivory/80">
              Условия
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
