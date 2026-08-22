import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found | OmniKit Tools",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col items-center px-4 py-28 text-center sm:px-6">
      <p className="font-mono text-7xl font-bold text-cyan-500/30">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">This page drifted into deep space</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        The route you requested doesn&apos;t exist — or the tool hasn&apos;t unlocked in this week&apos;s index window yet.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
          Back home
        </Link>
        <Link href="/tools" className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10">
          Browse all tools
        </Link>
      </div>
    </main>
  );
}
