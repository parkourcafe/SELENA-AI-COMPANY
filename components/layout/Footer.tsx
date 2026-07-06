import Link from "next/link";
import { nav } from "@/data/site";
import Container from "@/components/ui/Container";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-ivory">
      <Container className="py-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="text-lg font-semibold tracking-[0.14em] text-ink">KORA</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              AI-внедрение, автоматизация и обучение для русскоязычного бизнеса.
              Сначала задача и процесс — потом инструмент.
            </p>
          </div>

          <nav aria-label="Навигация в подвале">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-ink/75 transition-colors hover:text-copper-deep"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="flex flex-col gap-2.5">
            <li>
              <Link
                href="/privacy"
                className="text-sm text-ink/75 transition-colors hover:text-copper-deep"
              >
                Политика конфиденциальности
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="text-sm text-ink/75 transition-colors hover:text-copper-deep"
              >
                Условия использования
              </Link>
            </li>
          </ul>
        </div>

        <p className="mt-10 border-t border-line pt-6 text-xs text-muted">
          © {new Date().getFullYear()} KORA. Без фейковых обещаний — и без
          автоматизации ради автоматизации.
        </p>
      </Container>
    </footer>
  );
}
