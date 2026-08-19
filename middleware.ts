import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy } from "./lib/security-headers";

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

function createNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function middleware(request: NextRequest) {
  const nonce = createNonce();
  const csp = contentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "x-selena-document-locale",
    documentLocale(request.nextUrl.pathname),
  );
  // Next.js reads the nonce back out of this request header and stamps it on
  // every script tag it renders. Without it the nonce in the response header
  // would match nothing and the document would fail to boot.
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
