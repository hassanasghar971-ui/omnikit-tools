"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/config/tools-registry";
import { useI18n } from "@/components/i18n-provider";
import { LOCALE_NAMES, LOCALES } from "@/lib/locales";
import { cn } from "@/lib/utils";

function dispatchPalette() {
  window.dispatchEvent(new Event("omnikit:palette"));
}

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline support unavailable — non-fatal */
    });
  }, []);
  return null;
}

export function Header() {
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  const nav = [
    { href: "/tools", label: t("nav.tools") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-[#080c14]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="logo-glow grid h-9 w-9 place-items-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-blue-600/10 text-lg">
            ◆
          </span>
          <span className="text-[15px] font-bold tracking-tight text-white">
            OmniKit<span className="text-cyan-400"> Tools</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                pathname === item.href ? "bg-white/5 text-cyan-300" : "text-slate-400 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={dispatchPalette}
            className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-cyan-500/40 hover:text-slate-200 lg:flex"
          >
            <span>{t("nav.search")}</span>
            <kbd className="rounded border border-white/10 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">Ctrl K</kbd>
          </button>

          <div className="relative">
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-500/40"
              aria-label={t("lang.switch")}
            >
              <span className="text-slate-400">🌐</span>
              <span className="hidden sm:inline">{LOCALE_NAMES[locale]}</span>
              <span className="sm:hidden">{locale.toUpperCase()}</span>
            </button>
            {langOpen ? (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                <div className="lang-pop absolute end-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#0a1120] py-1 shadow-2xl">
                  {LOCALES.map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        setLocale(l);
                        setLangOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/5",
                        l === locale ? "text-cyan-300" : "text-slate-300",
                      )}
                    >
                      {LOCALE_NAMES[l]}
                      {l === locale ? "✓" : null}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-slate-300 md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav className="border-t border-white/10 bg-[#080c14] px-4 py-3 md:hidden">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5">
              {item.label}
            </Link>
          ))}
          <button onClick={dispatchPalette} className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-cyan-300">
            ⌕ {t("nav.search")}
          </button>
        </nav>
      ) : null}
    </header>
  );
}

export function Footer() {
  const { t } = useI18n();
  const legal = [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-of-service", label: "Terms of Service" },
    { href: "/disclaimer", label: "Disclaimer" },
    { href: "/contact", label: "Contact" },
    { href: "/about", label: "About" },
  ];
  return (
    <footer className="no-print border-t border-white/10 bg-[#060a12]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-blue-600/10 text-sm">◆</span>
              <span className="text-sm font-bold text-white">
                OmniKit<span className="text-cyan-400"> Tools</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">{t("footer.tagline")}</p>
            <p className="mt-4 text-xs text-slate-600">
              {t("footer.made")} <span className="font-medium text-slate-400">Hassan Asghar</span> · ©{" "}
              <span suppressHydrationWarning>{new Date().getFullYear()}</span> OmniKit Tools. {t("footer.rights")}
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("footer.categories")}</h3>
            <ul className="space-y-2">
              {CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.slug}>
                  <Link href={`/tools?category=${c.slug}`} className="text-sm text-slate-500 transition-colors hover:text-cyan-300">
                    {c.icon} {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("footer.legal")}</h3>
            <ul className="space-y-2">
              {legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 transition-colors hover:text-cyan-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
