import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { I18nProvider } from "@/components/i18n-provider";
import { CommandPalette } from "@/components/command-palette";
import { Footer, Header, PwaRegister } from "@/components/chrome";
import { safeUrl, SITE_NAME, SITE_URL } from "@/lib/utils";

// Never crash build-time route configuration (e.g. /_not-found):
// safeUrl() validates and falls back to the brand domain in every case.
export const metadata: Metadata = {
  metadataBase: safeUrl(SITE_URL),
  title: {
    default: `${SITE_NAME} — 750 Free Online Tools, 100% On-Device`,
    template: `%s`,
  },
  description:
    "750+ free online tools that run entirely in your browser — WebAssembly speed, Web Worker acceleration, zero uploads, zero data retention, full offline PWA support.",
  applicationName: SITE_NAME,
  icons: { icon: "/icon.svg" },
  robots: { index: true, follow: true },
  verification: {
    google: "pwyfdDe7eDVI1cMvuebKjXMzJ6kFspOCtUPX7aDskuI",
  },
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image", creator: "@omnikit" },
};

export const viewport: Viewport = {
  themeColor: "#080C14",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="pwyfdDe7eDVI1cMvuebKjXMzJ6kFspOCtUPX7aDskuI" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />
        <link rel="dns-prefetch" href="https://api.pwnedpasswords.com" />
      </head>
      <body className="min-h-screen bg-[#080c14] text-slate-200 antialiased">
        <I18nProvider>
          <Header />
          {children}
          <Footer />
          <CommandPalette />
          <PwaRegister />
        </I18nProvider>
        {adsenseClient ? (
          <Script
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClient)}`}
          />
        ) : null}
      </body>
    </html>
  );
}
