"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[OmniKit route error]", error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col items-center px-4 py-28 text-center sm:px-6">
      <span className="text-5xl">🌌</span>
      <h1 className="mt-4 text-2xl font-bold text-white">A cosmic glitch occurred</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        The self-healing engine caught this error before it could break anything else. Retry instantly — no page reload needed.
      </p>
      {error.digest ? <p className="mt-2 font-mono text-xs text-slate-600">digest: {error.digest}</p> : null}
      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
      >
        ↻ Retry
      </button>
    </main>
  );
}
