/**
 * Route loading skeleton — fixed-size shimmer blocks, so navigating
 * between routes never shifts layout (CLS stays 0 during ISR renders).
 */
export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="animate-pulse rounded-lg bg-white/5" style={{ width: 260, height: 32 }} />
      <div className="mt-3 animate-pulse rounded-lg bg-white/5" style={{ width: 420, height: 14 }} />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
            <div className="mt-4 h-3 w-full animate-pulse rounded bg-white/5" />
            <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-white/5" />
            <div className="mt-6 h-8 w-full animate-pulse rounded-lg bg-white/5" />
          </div>
        ))}
      </div>
      <span className="sr-only" role="status">Loading OmniKit Tools…</span>
    </main>
  );
}
