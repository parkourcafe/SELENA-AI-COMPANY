"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function DocumentLanguage() {
  const pathname = usePathname();

  useEffect(() => {
    const isEnglish = pathname === "/" || pathname.startsWith("/en");
    document.documentElement.lang = isEnglish ? "en" : "ru";
  }, [pathname]);

  return null;
}
