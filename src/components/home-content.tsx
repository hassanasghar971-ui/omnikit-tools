"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { HeroSearch } from "@/components/hero-search";
import { AdSlot } from "@/components/ad-slot";
import { ALL_TOOLS, CATEGORIES, getToolsByCategory, REGISTRY_COUNTS } from "@/config/tools-registry";

const FEATURED_SLUGS = [
  "json-formatter", "password-generator", "color-converter", "word-counter",
  "uuid-generator", "regex-tester", "loan-calculator", "qr-code-generator",
  "gradient-generator", "hash-generator", "text-to-pdf", "timestamp-converter",
];

/**
 * Fully-localized homepage: every heading, badge, stat, button and
 * section title switches with the selected language (26 dictionaries).
 */
export function HomeContent() {
  const { t } = useI18n();
  const featured = FEATURED_SLUGS
    .map((slug) => ALL_TOOLS.find((tool) => tool.slug === slug))
    .filter((tool) => tool !== undefined);

  const trust = [
    ["🛡️", t("trust.client")],
    ["🔒", t("trust.privacy")],
    ["🗑️", t("trust.retention")],
    ["⚡", t("trust.speed")],
  ];

  const stats: Array<[string | number, string]> = [
    [REGISTRY_COUNTS.total, t("stats.tools")],
    [12, t("stats.categories")],
    [100, t("stats.offline")],
    ["0", t("stats.retained")],
  ];

  const howItWorks = [
    ["🖥️", t("how.1.title"), t("how.1.desc")],
    ["⚡", t("how.2.title"), t("how.2.desc")],
    ["🛡️", t("how.3.title"), t("how.3.desc")],
  ];

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="hero-aurora relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <span className="fade-up inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-300">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-cyan-400" />
            {t("hero.badge")}
          </span>
          <h1 className="fade-up mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="fade-up mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            {t("hero.subtitle")}
          </p>
          <div className="fade-up mt-8">
            <HeroSearch />
          </div>
          <div className="fade-up mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {trust.map(([icon, label]) => (
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
          {stats.map(([value, label]) => (
            <div key={String(label)} className="text-center">
              <p className="font-mono text-3xl font-bold text-cyan-300">{value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= AD ================= */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <AdSlot variant="leaderboard" />
      </div>

      {/* ================= CATEGORIES ================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">{t("home.explore")}</p>
          <h2 className="text-3xl font-bold tracking-tight text-white">{t("cats.title")}</h2>
          <p className="mt-2 text-sm text-slate-400">{t("cats.subtitle")}</p>
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
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">{t("featured.title")}</p>
              <h2 className="text-3xl font-bold tracking-tight text-white">{t("home.start")}</h2>
            </div>
            <Link href="/tools" className="hidden text-sm text-cyan-300 hover:text-cyan-200 sm:block">
              {t("nav.tools")} →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((tool) => (
              <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group rounded-xl border border-white/10 bg-[#0a1120] p-4 transition-all hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5">
                <p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300">{tool.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{tool.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">{t("home.arch")}</p>
          <h2 className="text-3xl font-bold tracking-tight text-white">{t("how.title")}</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {howItWorks.map(([icon, title, desc]) => (
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
          <h2 className="text-2xl font-bold text-white sm:text-3xl">{t("cta.banner")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">{t("featured.subtitle")}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tools" className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400">
              {t("hero.cta")} →
            </Link>
            <Link href="/about" className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10">
              {t("nav.about")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
