import { NextResponse, type NextRequest } from "next/server";

const russianOnlyPaths = new Set([
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/ai-training",
  "/ai-automation",
  "/ai-content",
]);

function documentLocale(pathname: string) {
  if (pathname === "/ru" || pathname.startsWith("/ru/")) return "ru";
  if (russianOnlyPaths.has(pathname)) return "ru";
  return "en";
}

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "x-selena-document-locale",
    documentLocale(request.nextUrl.pathname),
  );

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
