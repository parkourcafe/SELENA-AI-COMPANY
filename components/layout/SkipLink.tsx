"use client";

import { usePathname } from "next/navigation";
import { isBareEnglishVisibilityPath } from "@/lib/visibility/routes";

/**
 * Keyboard skip link that speaks the language of the current page
 * instead of showing both languages on every page.
 */
export function SkipLink() {
  const pathname = usePathname() ?? "/";
  const isEnglish =
    pathname === "/" ||
    pathname.startsWith("/en") ||
    isBareEnglishVisibilityPath(pathname);

  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-copper-deep focus:px-5 focus:py-2.5 focus:text-surface"
    >
      {isEnglish ? "Skip to content" : "Перейти к содержанию"}
    </a>
  );
}
