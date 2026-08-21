"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_TOOLS, getCategoryOf } from "@/config/tools-registry";
import { useI18n } from "@/components/i18n-provider";

export function HeroSearch() {
  const { t } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return ALL_TOOLS.filter(
      (t) => t.name.toLowerCase().includes(query) || t.keywords.some((k) => k.includes(query)),
    ).slice(0, 5);
  }, [q]);

  const go = (slug?: string) => {
    if (slug) router.push(`/tools/${slug}`);
    else if (q.trim()) router.push(`/tools?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="hero-glow flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0a1120]/90 px-5 py-4 backdrop-blur-md">
        <span className="text-lg text-cyan-400">⌕</span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") go(suggestions[0]?.slug);
          }}
          placeholder={t("hero.search")}
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        <kbd className="hidden rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-slate-500 sm:block">⌘K</kbd>
      </div>
      {focused && suggestions.length > 0 ? (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1120]/98 shadow-2xl backdrop-blur-xl">
          {suggestions.map((s) => (
            <button
              key={s.slug}
              onClick={() => go(s.slug)}
              onMouseDown={(e) => e.preventDefault()}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-cyan-500/10"
            >
              <span>{getCategoryOf(s).icon}</span>
              <span className="flex-1 truncate text-sm text-slate-200">{s.name}</span>
              <span className="text-xs text-slate-500">{getCategoryOf(s).name}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
