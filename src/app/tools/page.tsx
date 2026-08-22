import type { Metadata } from "next";
import Link from "next/link";
import {
  ALL_TOOLS, CATEGORIES, CATEGORY_MAP, getToolsByCategory, isUnlocked,
} from "@/config/tools-registry";
import type { CategorySlug } from "@/config/tool-lists";
import { AdSlot } from "@/components/ad-slot";
import { ToolsHeading } from "@/components/tools-heading";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All 750 Tools — Free Online Tool Directory | OmniKit Tools",
  description: "Browse all 750 free online tools from OmniKit Tools across 12 categories: developer utilities, PDF, image, SEO, finance, security, converters and more. 100% on-device.",
  alternates: { canonical: `${SITE_URL}/tools` },
  robots: { index: false, follow: true },
};

function fuzzyFilter(query: string): typeof ALL_TOOLS {
  const q = query.toLowerCase().trim();
  return ALL_TOOLS.filter(
    (t) => t.name.toLowerCase().includes(q) || t.keywords.some((k) => k.includes(q)),
  );
}

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const category = CATEGORY_MAP.has(sp.category as CategorySlug) ? (sp.category as CategorySlug) : null;

  const base = q ? fuzzyFilter(q) : category ? getToolsByCategory(category) : [...ALL_TOOLS];
  const unlockedCount = base.filter((t) => isUnlocked(t)).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <ToolsHeading query={q} count={base.length} unlocked={unlockedCount} />

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/tools"
          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${!category && !q ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/25"}`}
        >
          All ({ALL_TOOLS.length})
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/tools?category=${c.slug}`}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${category === c.slug && !q ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/25"}`}
          >
            {c.icon} {c.name} ({getToolsByCategory(c.slug).length})
          </Link>
        ))}
      </div>

      <AdSlot variant="banner" className="mb-8" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {base.slice(0, 200).map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="group rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/[0.04]"
          >
            <p className="truncate text-sm font-medium text-slate-200 group-hover:text-cyan-300">{tool.name}</p>
            <p className="mt-1 truncate text-xs text-slate-600">{CATEGORY_MAP.get(tool.category)?.name}</p>
          </Link>
        ))}
      </div>

      {base.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-500">No tools match “{q}”. Try “json”, “pdf” or “timer” — or press Ctrl+K for predictive search.</p>
      ) : null}

      {base.length > 200 ? (
        <p className="mt-6 text-center text-xs text-slate-600">
          Showing 200 of {base.length}. Refine your search or browse by category.
        </p>
      ) : null}
    </main>
  );
}
