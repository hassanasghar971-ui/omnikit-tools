import Link from "next/link";

export const metadata = { robots: { index: false } };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col items-center px-4 py-28 text-center sm:px-6">
      <span className="text-5xl">🛰️</span>
      <h1 className="mt-4 text-2xl font-bold text-white">You are offline</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        Pages you&apos;ve visited before remain fully available through the OmniKit offline cache. Connect once to sync new pages.
      </p>
      <Link href="/" className="mt-6 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950">
        Try cached home
      </Link>
    </main>
  );
}
