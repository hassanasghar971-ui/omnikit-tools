import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryOf, getRelatedTools, getToolBySlug, isRecentlyUnlocked,
  isUnlocked, unlockedTools,
} from "@/config/tools-registry";
import { getToolContent } from "@/lib/content";
import { buildToolJsonLd } from "@/lib/jsonld";
import { ToolClient } from "@/components/tool-client";
import { AdSlot } from "@/components/ad-slot";
import { SITE_NAME, SITE_URL } from "@/lib/utils";

export const revalidate = 86400;
export const dynamicParams = true;

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  // Pre-render the currently unlocked head of the registry at build time;
  // the remaining 750 routes render on-demand (ISR) with zero build cost.
  return unlockedTools().slice(0, 30).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};
  const content = getToolContent(tool);
  const url = `${SITE_URL}/tools/${tool.slug}`;
  const unlocked = isUnlocked(tool);
  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: { canonical: url },
    keywords: tool.keywords,
    robots: unlocked ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: content.ogTitle,
      description: content.ogDescription,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: tool.name }],
      locale: "en_US",
    },
    twitter: { card: "summary_large_image", title: content.ogTitle, description: content.ogDescription, images: [`${SITE_URL}/og.png`] },
  };
}

export default async function ToolPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const content = getToolContent(tool);
  const category = getCategoryOf(tool);
  const related = getRelatedTools(tool, 6);
  const isNew = isRecentlyUnlocked(tool);
  const jsonLd = buildToolJsonLd(tool, content);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AdSlot variant="banner" className="mb-6" />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-cyan-300">Home</Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-cyan-300">Tools</Link>
            <span>/</span>
            <Link href={`/tools?category=${category.slug}`} className="hover:text-cyan-300">{category.name}</Link>
            <span>/</span>
            <span className="text-slate-300">{tool.name}</span>
          </nav>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{tool.name}</h1>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${isNew ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"}`}>
              {isNew ? "● New this week" : "◆ Works offline"}
            </span>
          </div>

          {/* Interactive tool — instant utility above the fold */}
          <ToolClient tool={tool} />

          {/* Unique problem-solving guide */}
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold tracking-tight text-white">Problem-solving guide</h2>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-400">{content.problem}</p>
            <div className="space-y-5">
              {content.howTo.map((step, i) => (
                <article key={step.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <h3 className="mb-2 flex items-center gap-3 text-base font-semibold text-slate-100">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cyan-500/15 font-mono text-xs text-cyan-300">{i + 1}</span>
                    {step.title}
                  </h3>
                  <p className="pl-10 text-sm leading-relaxed text-slate-400">{step.body}</p>
                </article>
              ))}
            </div>
          </section>

          {/* FAQ with FAQPage JSON-LD */}
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold tracking-tight text-white">Frequently asked questions</h2>
            <div className="space-y-3">
              {content.faqs.map((faq) => (
                <details key={faq.question} className="group rounded-2xl border border-white/10 bg-white/[0.02] transition-colors open:border-cyan-500/30">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-slate-200 [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span className="text-cyan-400 transition-transform group-open:rotate-45">＋</span>
                  </summary>
                  <p className="px-5 pb-4 text-sm leading-relaxed text-slate-400">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Related tools */}
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold tracking-tight text-white">
              More {category.name} tools
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link key={r.slug} href={`/tools/${r.slug}`} className="group rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition-colors hover:border-cyan-500/40">
                  <p className="text-sm font-medium text-slate-200 group-hover:text-cyan-300">{r.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{r.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="hidden space-y-5 xl:block">
          <div className="sticky top-24 space-y-5">
            <AdSlot variant="rectangle" />
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">When to use it</h3>
              <ul className="space-y-2.5">
                {content.useCases.map((uc) => (
                  <li key={uc} className="flex gap-2 text-xs leading-relaxed text-slate-400">
                    <span className="mt-0.5 text-cyan-400">✓</span>{uc}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Trust</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><span>🛡️</span> Enterprise Grade Client Isolation</li>
                <li className="flex items-center gap-2"><span>🔒</span> 100% On-Device Privacy</li>
                <li className="flex items-center gap-2"><span>🗑️</span> Zero Data Retention</li>
                <li className="flex items-center gap-2"><span>⚡</span> Sub-5ms Local Processing</li>
              </ul>
            </section>
          </div>
        </aside>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
