"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#080c14", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8rem 1rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>OmniKit Tools hit a boundary</h1>
          <p style={{ maxWidth: 480, fontSize: "0.9rem", color: "#94a3b8" }}>
            A critical error was contained by the global self-healing layer. The rest of the platform is unaffected.
          </p>
          {error.digest ? <p style={{ fontSize: "0.75rem", color: "#475569", fontFamily: "monospace" }}>digest: {error.digest}</p> : null}
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              background: "#06b6d4",
              color: "#020617",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.65rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ↻ Recover
          </button>
        </main>
      </body>
    </html>
  );
}
