"use client";

import { useI18n } from "@/components/i18n-provider";

/**
 * Fully-localized tools-directory heading: eyebrow, title, results line
 * and search button all switch with the selected language.
 */
export function ToolsHeading({
  query,
  count,
  unlocked,
}: {
  query: string;
  count: number;
  unlocked: number;
}) {
  const { t } = useI18n();
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
          {t("tools.eyebrow")}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {query ? (
            <>{t("tools.all")} — “{query}”</>
          ) : (
            t("tools.all")
          )}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {t("tools.results", { count: String(count), unlocked: String(unlocked) })}
        </p>
      </div>
      <form className="flex w-full max-w-xs gap-2" action="/tools" method="get">
        <input
          name="q"
          defaultValue={query}
          placeholder={t("nav.search")}
          className="w-full rounded-lg border border-white/10 bg-[#0d1424] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500/50"
        />
        <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-cyan-400">
          {t("tools.go")}
        </button>
      </form>
    </div>
  );
}
