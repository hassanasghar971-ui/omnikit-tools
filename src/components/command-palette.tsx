"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_TOOLS, getCategoryOf, isRecentlyUnlocked, type ToolMeta } from "@/config/tools-registry";
import { useI18n } from "@/components/i18n-provider";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Subsequence fuzzy scorer — prefers prefix, word-boundary and consecutive hits. */
function scoreFuzzy(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 0;
  if (t === q) return 1000;
  if (t.startsWith(q)) return 600 - Math.min(t.length - q.length, 40);
  if (t.includes(q)) return 350 - t.indexOf(q) * 0.5;
  let qi = 0;
  let score = 0;
  let last = -2;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      score += i === last + 1 ? 12 : 4;
      if (i === 0 || t[i - 1] === " " || t[i - 1] === "-") score += 6;
      last = i;
      qi++;
    }
  }
  return qi === q.length ? score - t.length * 0.1 : -1;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
}

const RECENT_KEY = "omnikit-recent";

function getRecent(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function CommandPalette() {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const actions = useMemo<QuickAction[]>(
    () => [
      { id: "home", label: "OmniKit Tools — Home", icon: "◆", href: "/" },
      { id: "tools", label: t("nav.tools"), icon: "▤", href: "/tools" },
      { id: "about", label: t("nav.about"), icon: "ℹ", href: "/about" },
      { id: "contact", label: t("nav.contact"), icon: "✉", href: "/contact" },
      { id: "privacy", label: "Privacy Policy", icon: "⚿", href: "/privacy-policy" },
    ],
    [t],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("omnikit:palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("omnikit:palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return ALL_TOOLS.slice(0, 10);
    const scored: Array<{ tool: ToolMeta; score: number }> = [];
    for (const tool of ALL_TOOLS) {
      const nameScore = scoreFuzzy(q, tool.name);
      const catScore = scoreFuzzy(q, getCategoryOf(tool).name);
      const kw = tool.keywords.join(" ");
      const kwScore = scoreFuzzy(q, kw);
      const best = Math.max(nameScore, catScore, kwScore);
      if (best > 0) scored.push({ tool, score: best });
    }
    scored.sort((a, b) => b.score - a.score || a.tool.globalIndex - b.tool.globalIndex);
    return scored.slice(0, 12).map((s) => s.tool);
  }, [query]);

  const recent = useMemo(() => {
    if (query.trim() || !open) return [];
    return getRecent()
      .map((slug) => ALL_TOOLS.find((t2) => t2.slug === slug))
      .filter((t2): t2 is ToolMeta => Boolean(t2))
      .slice(0, 4);
  }, [query, open]);

  const navigate = useCallback(
    (href: string, slug?: string) => {
      if (slug) {
        try {
          const rec = getRecent().filter((s) => s !== slug);
          rec.unshift(slug);
          window.localStorage.setItem(RECENT_KEY, JSON.stringify(rec.slice(0, 8)));
        } catch {
          /* private mode */
        }
      }
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const allItems = useMemo(() => {
    const actionItems = query.trim()
      ? actions.filter((a) => scoreFuzzy(query.trim(), a.label) > 0)
      : [];
    return { tools: results, actions: actionItems };
  }, [results, actions, query]);

  const total = allItems.tools.length + allItems.actions.length;

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(total - 1, 0)));
  }, [total]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, total - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && total > 0) {
      e.preventDefault();
      const tool = allItems.tools[active];
      if (tool) navigate(`/tools/${tool.slug}`, tool.slug);
      else {
        const action = allItems.actions[active - allItems.tools.length];
        if (action) navigate(action.href);
      }
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="palette-pop relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a1120]/95 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <span className="text-cyan-400">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("palette.placeholder")}
            className="w-full bg-transparent py-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">ESC</kbd>
        </div>

        <ul ref={listRef} className="max-h-[46vh] overflow-y-auto p-2">
          {total === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-slate-500">{t("palette.empty")}</li>
          ) : null}
          {allItems.tools.map((tool, i) => {
            const cat = getCategoryOf(tool);
            const isNew = isRecentlyUnlocked(tool);
            return (
              <li key={tool.slug} data-index={i}>
                <button
                  onClick={() => navigate(`/tools/${tool.slug}`, tool.slug)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    i === active ? "bg-cyan-500/10 ring-1 ring-cyan-500/30" : "hover:bg-white/5",
                  )}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-100">{tool.name}</span>
                    <span className="block truncate text-xs text-slate-500">{cat.name}</span>
                  </span>
                  {isNew ? <Badge tone="green">{t("tool.new")}</Badge> : <Badge tone="cyan">{t("tool.offline")}</Badge>}
                  {i === active ? <span className="font-mono text-xs text-cyan-400">↵</span> : null}
                </button>
              </li>
            );
          })}
          {allItems.actions.map((action, i) => {
            const idx = allItems.tools.length + i;
            return (
              <li key={action.id} data-index={idx}>
                <button
                  onClick={() => navigate(action.href)}
                  onMouseEnter={() => setActive(idx)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    idx === active ? "bg-cyan-500/10 ring-1 ring-cyan-500/30" : "hover:bg-white/5",
                  )}
                >
                  <span className="text-lg text-slate-500">{action.icon}</span>
                  <span className="flex-1 text-sm font-medium text-slate-200">{action.label}</span>
                  <Badge tone="slate">{t("palette.actions")}</Badge>
                </button>
              </li>
            );
          })}
          {recent.length > 0 ? (
            <li className="mt-1 border-t border-white/5 pt-1">
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">{t("palette.recent")}</p>
              {recent.map((tool) => (
                <button
                  key={tool.slug}
                  onClick={() => navigate(`/tools/${tool.slug}`, tool.slug)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200"
                >
                  <span>{getCategoryOf(tool).icon}</span>
                  <span className="truncate">{tool.name}</span>
                </button>
              ))}
            </li>
          ) : null}
        </ul>

        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 text-[10px] text-slate-600">
          <span>⌘K · ↑↓ navigate · ↵ open · esc close</span>
          <span className="font-mono">{ALL_TOOLS.length} tools indexed</span>
        </div>
      </div>
    </div>
  );
}
