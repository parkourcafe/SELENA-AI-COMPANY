import type { Metadata } from "next";
import { headers } from "next/headers";
import { site } from "@/lib/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CursorAura } from "@/components/ui/CursorAura";
import { DocumentLanguage } from "@/components/layout/DocumentLanguage";
import { SkipLink } from "@/components/layout/SkipLink";
import { PublicEventTracker } from "@/components/analytics/PublicEventTracker";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-selena-document-locale") === "ru" ? "ru" : "en";

  return (
    <html lang={locale}>
      <head>
        {/* Without JS, scroll-reveal never fires — force content visible. */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </head>
      <body>
        <DocumentLanguage />
        <PublicEventTracker />
        {/* Skip link for keyboard users */}
        <SkipLink />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <CursorAura />
      </body>
    </html>
  );
}
