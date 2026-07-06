"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, cta } from "@/data/site";
import Container from "@/components/ui/Container";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-[0.14em] text-ink"
          aria-label="KORA — на главную"
        >
          KORA
        </Link>

        <nav aria-label="Основная навигация" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`text-sm transition-colors hover:text-copper-deep ${
                    pathname === item.href ? "text-copper-deep" : "text-ink/80"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="hidden rounded-full bg-copper px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-copper-deep sm:inline-flex"
          >
            {cta.primaryShort}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Закрыть меню" : "Открыть меню"}</span>
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              {open ? (
                <>
                  <path d="M3 3l12 12" />
                  <path d="M15 3L3 15" />
                </>
              ) : (
                <>
                  <path d="M2 4.5h14" />
                  <path d="M2 9h14" />
                  <path d="M2 13.5h14" />
                </>
              )}
            </svg>
          </button>
        </div>
      </Container>

      <div
        id="mobile-menu"
        hidden={!open}
        className="border-t border-line bg-ivory lg:hidden"
      >
        <Container className="py-4">
          <nav aria-label="Мобильная навигация">
            <ul className="flex flex-col gap-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={`block rounded-lg px-3 py-2.5 text-base ${
                      pathname === item.href
                        ? "bg-surface text-copper-deep"
                        : "text-ink/85 hover:bg-surface"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            href="/contact"
            onClick={closeMenu}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-copper px-5 py-3 text-base font-medium text-surface transition-colors hover:bg-copper-deep"
          >
            {cta.primaryShort}
          </Link>
        </Container>
      </div>
    </header>
  );
}
