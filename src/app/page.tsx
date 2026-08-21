import Link from "next/link";
import type { Metadata } from "next";
import { ALL_TOOLS, CATEGORIES, getToolsByCategory, REGISTRY_COUNTS } from "@/config/tools-registry";
import { HeroSearch } from "@/components/hero-search";
import { AdSlot } from "@/components/ad-slot";
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

const FEATURED_SLUGS = [
  "json-formatter", "password-generator", "color-converter", "word-counter",
  "uuid-generator", "regex-tester", "loan-calculator", "qr-code-generator",
  "gradient-generator", "hash-generator", "text-to-pdf", "timestamp-converter",
];

export default function HomePage() {
  const featured = FEATURED_SLUGS
    .map((slug) => ALL_TOOLS.find((t) => t.slug === slug))
    .filter((t) => t !== undefined);

  return (
    <main>
      {/* ================= HERO ================= */}
      <section className="hero-aurora relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <span className="fade-up inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-300">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-cyan-400" />
            750+ tools · 100% on-device · zero hosting cost
          </span>
          <h1 className="fade-up mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
            The <span className="text-glow bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">digital wonder</span> of the internet
          </h1>
          <p className="fade-up mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Every tool runs entirely in your browser — WebAssembly speed, Web Worker brains, airtight privacy and full
            offline power. No signups. No uploads. No limits.
          </p>
          <div className="fade-up mt-8">
            <HeroSearch />
          </div>
          <div className="fade-up mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              ["🛡️", "Enterprise Grade Client Isolation"],
              ["🔒", "100% On-Device Privacy"],
              ["🗑️", "Zero Data Retention"],
              ["⚡", "Sub-5ms Local Processing"],
            ].map(([icon, label]) => (
              <span key={label} className="flex items-center gap-2 text-xs text-slate-500">
                <span>{icon}</span>{label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="border-b border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
          {[
            [REGISTRY_COUNTS.total, "Dedicated tools"],
            [12, "Categories"],
            [100, "% offline"],
            ["0", "Data retained"],
          ].map(([value, label]) => (
            <div key={String(label)} className="text-center">
              <p className="font-mono text-3xl font-bold text-cyan-300">{value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= AD (below hero action area) ================= */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <AdSlot variant="leaderboard" />
      </div>

      {/* ================= CATEGORIES ================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">Explore</p>
          <h2 className="text-3xl font-bold tracking-tight text-white">12 categories. 750 tools. One engine.</h2>
          <p className="mt-2 text-sm text-slate-400">Every category is computed locally — nothing ever leaves your machine.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/tools?category=${c.slug}`}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${c.gradient} p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-white/25`}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{c.icon}</span>
                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                  {getToolsByCategory(c.slug).length}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-cyan-200">{c.name}</h3>
              <p className={`mt-0.5 text-xs font-medium ${c.accent}`}>{c.tagline}</p>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= FEATURED ================= */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">Featured this week</p>
              <h2 className="text-3xl font-bold tracking-tight text-white">Start with the icons</h2>
            </div>
            <Link href="/tools" className="hidden text-sm text-cyan-300 hover:text-cyan-200 sm:block">View all 750 →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((t) => (
              <Link key={t.slug} href={`/tools/${t.slug}`} className="group rounded-xl border border-white/10 bg-[#0a1120] p-4 transition-all hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300">{t.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{t.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">Architecture</p>
          <h2 className="text-3xl font-bold tracking-tight text-white">Built different, on purpose</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["🖥️", "Zero servers", "Computation lives in your browser via Web Workers and WebAssembly. No server hosting, no queues, no data centers — ever."],
            ["⚡", "Instant & offline", "Sub-5ms local processing and a full offline-first PWA: airplane mode is a supported environment, not an error state."],
            ["🛡️", "Enterprise trust", "Deterministic state self-healing, strict hydration safety and zero analytics fingerprinting — designed for corporate data."],
          ].map(([icon, title, desc]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <span className="text-2xl">{icon}</span>
              <h3 className="mt-3 text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-[#0a1120] to-blue-600/10 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Install OmniKit Tools as an app</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
            Native installability, offline execution and instant startup — pin the entire toolkit to your home screen.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tools" className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400">
              Explore all tools →
            </Link>
            <Link href="/about" className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10">
              About OmniKit
            </Link>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSiteJsonLd()) }} />
    </main>
  );
}
