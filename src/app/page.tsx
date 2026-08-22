import type { Metadata } from "next";
import { HomeContent } from "@/components/home-content";
import { buildSiteJsonLd } from "@/lib/jsonld";
import { SITE_NAME, SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "OmniKit Tools — 750 Free Online Tools, 100% On-Device & Offline",
  description: "750+ free online tools running entirely in your browser: JSON, PDF, image, SEO, finance, security, converters and more. WebAssembly speed, zero uploads, zero data retention.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "OmniKit Tools — The Digital Wonder of the Internet",
    description: "750+ free on-device tools. Zero servers. Zero uploads. Full offline PWA.",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image" },
};

export default function HomePage() {
  return (
    <main>
      <HomeContent />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSiteJsonLd()) }} />
    </main>
  );
}
