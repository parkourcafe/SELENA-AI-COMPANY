"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isBareEnglishVisibilityPath } from "@/lib/visibility/routes";

export function DocumentLanguage() {
  const pathname = usePathname();

  useEffect(() => {
    const isEnglish =
      pathname === "/" || pathname.startsWith("/en") || isBareEnglishVisibilityPath(pathname);
    document.documentElement.lang = isEnglish ? "en" : "ru";
  }, [pathname]);

  return null;
}
