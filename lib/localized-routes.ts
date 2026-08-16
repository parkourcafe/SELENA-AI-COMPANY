import { isBareEnglishVisibilityPath } from "@/lib/visibility/routes";

export function isBareEnglishLabPath(pathname: string) {
  return pathname === "/lab" || pathname.startsWith("/lab/");
}

export function isEnglishPublicPath(pathname: string) {
  return pathname === "/" || pathname.startsWith("/en") || isBareEnglishVisibilityPath(pathname) || isBareEnglishLabPath(pathname);
}

/** Locale switch that preserves the current product, Lab section or article. */
export function alternateLocalePath(pathname: string) {
  if (pathname === "/") return "/ru";
  if (pathname === "/ru") return "/";
  if (isBareEnglishLabPath(pathname) || isBareEnglishVisibilityPath(pathname)) return `/ru${pathname}`;
  if (pathname === "/ru/lab" || pathname.startsWith("/ru/lab/")) return pathname.slice(3);
  if (
    pathname === "/ru/visibility" ||
    pathname.startsWith("/ru/visibility/") ||
    pathname === "/ru/check" ||
    pathname.startsWith("/ru/check/") ||
    pathname === "/ru/methodology" ||
    pathname.startsWith("/ru/methodology/") ||
    pathname === "/ru/pricing" ||
    pathname.startsWith("/ru/pricing/") ||
    pathname === "/ru/report/sample" ||
    pathname.startsWith("/ru/report/sample/")
  ) return pathname.slice(3);

  const explicit: Record<string, string> = {
    "/en/contact": "/contact",
    "/en/privacy": "/privacy",
    "/en/terms": "/terms",
    "/contact": "/en/contact",
    "/privacy": "/en/privacy",
    "/terms": "/en/terms",
  };
  return explicit[pathname] ?? (isEnglishPublicPath(pathname) ? "/ru" : "/");
}
