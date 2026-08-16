"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isEnglishPublicPath } from "@/lib/localized-routes";

export function DocumentLanguage() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = isEnglishPublicPath(pathname) ? "en" : "ru";
  }, [pathname]);

  return null;
}
