"use client";

import { useCallback, useEffect, useState } from "react";
import type { ToolMeta } from "@/config/tools-registry";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui";
import { copyText, downloadBlob, downloadDataUrl } from "@/lib/utils";

export interface ToolResult {
  text: string;
  /** file extension for raw download: txt | json | csv | html | xml | yaml | png */
  ext?: string;
  mime?: string;
  dataUrl?: string;
  fileName?: string;
}

const EXT_MIME: Record<string, string> = {
  txt: "text/plain",
  json: "application/json",
  csv: "text/csv",
  html: "text/html",
  xml: "application/xml",
  yaml: "text/yaml",
  md: "text/markdown",
};

export function UniversalActionBar({ tool, result }: { tool: ToolMeta; result: ToolResult | null }) {
  const { t } = useI18n();
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);

  const run = useCallback(
    async (id: string, fn: () => Promise<void> | void) => {
      setBusy(id);
      try {
        await fn();
      } catch {
        flash(t("action.empty"));
      } finally {
        setTimeout(() => setBusy(null), 500);
      }
    },
    [flash, t],
  );

  const handleCopy = useCallback(() => {
    void run("copy", async () => {
      if (!result || !result.text) {
        flash(t("action.empty"));
        return;
      }
      if (await copyText(result.text)) flash(t("action.copied"));
    });
  }, [result, run, flash, t]);

  const handleShare = useCallback(() => {
    void run("share", async () => {
      const url = typeof window !== "undefined" ? window.location.href : "";
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `${tool.name} — OmniKit Tools`, url });
      } else {
        await copyText(url);
      }
      flash(t("action.shared"));
    });
  }, [run, tool.name, flash, t]);

  const handlePdf = useCallback(() => {
    void run("pdf", async () => {
      if (!result || !result.text) {
        flash(t("action.empty"));
        return;
      }
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 48;
      const width = doc.internal.pageSize.getWidth() - margin * 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(tool.name, margin, 60);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text("Generated on-device by OmniKit Tools — zero data left your browser.", margin, 78);
      doc.setTextColor(20);
      doc.setFontSize(10);
      doc.setFont("courier", "normal");
      const lines = doc.splitTextToSize(result.text, width);
      doc.text(lines, margin, 100);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150);
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pages} · omnikit.tools/tools/${tool.slug}`, margin, doc.internal.pageSize.getHeight() - 28);
      }
      doc.save(`${tool.slug}-result.pdf`);
      flash(t("action.pdfDone"));
    });
  }, [run, result, tool, flash, t]);

  const handlePrint = useCallback(() => {
    if (!result || !result.text) {
      flash(t("action.empty"));
      return;
    }
    flash(t("action.printing"));
    setTimeout(() => {
      window.focus();
      window.print();
    }, 350);
  }, [result, flash, t]);

  const handleRaw = useCallback(() => {
    void run("raw", async () => {
      if (!result || !result.text) {
        flash(t("action.empty"));
        return;
      }
      if (result.dataUrl) {
        downloadDataUrl(result.fileName ?? `${tool.slug}-result.png`, result.dataUrl);
      } else {
        const ext = result.ext ?? "txt";
        downloadBlob(result.fileName ?? `${tool.slug}-result.${ext}`, result.text, result.mime ?? EXT_MIME[ext] ?? "text/plain");
      }
      flash(t("action.rawDone"));
    });
  }, [run, result, tool.slug, flash, t]);

  // Global print styling state (self-heals after print)
  useEffect(() => {
    const cleanup = () => document.body.classList.remove("omnikit-printing");
    window.addEventListener("afterprint", cleanup);
    return () => {
      window.removeEventListener("afterprint", cleanup);
      document.body.classList.remove("omnikit-printing");
    };
  }, []);

  // Hydration-safe document timestamp (client-only)
  const [printedAt, setPrintedAt] = useState("");
  useEffect(() => {
    setPrintedAt(new Date().toISOString());
  }, []);

  const buttons = [
    { id: "copy", label: t("action.copy"), icon: "⧉", onClick: handleCopy },
    { id: "share", label: t("action.share"), icon: "↗", onClick: handleShare },
    { id: "pdf", label: t("action.pdf"), icon: "⬇", onClick: handlePdf },
    { id: "print", label: t("action.print"), icon: "⎙", onClick: handlePrint },
    { id: "raw", label: t("action.raw"), icon: "⇩", onClick: handleRaw },
  ];

  return (
    <>
      <div className="no-print relative">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#0a1120]/90 p-3 backdrop-blur-md">
        <span className="mr-1 hidden items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
          Universal Action Bar
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {buttons.map((b) => (
            <Button key={b.id} variant="ghost" onClick={b.onClick} disabled={busy === b.id} className="text-xs">
              <span className="text-cyan-400">{b.icon}</span>
              {busy === b.id ? "…" : b.label}
            </Button>
          ))}
        </div>
        {result?.text ? (
          <span className="hidden rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-[10px] text-emerald-300 md:inline">
            {result.text.length.toLocaleString()} chars ready
          </span>
        ) : null}
      </div>

      {toast ? (
        <div className="pointer-events-none absolute inset-x-0 -bottom-11 flex justify-center">
          <div className="toast-pop rounded-full border border-cyan-500/30 bg-[#0a1120] px-4 py-1.5 text-xs font-medium text-cyan-200 shadow-lg shadow-cyan-500/10">
            {toast}
          </div>
        </div>
      ) : null}
      </div>

      {/* Print-only area — SIBLING of the no-print wrapper so it survives printing */}
      <div id="print-area" className="print-area" aria-hidden>
        <h1 className="print-title">{tool.name}</h1>
        <p className="print-meta">Generated by OmniKit Tools · 100% on-device · {printedAt}</p>
        <pre className="print-result">{result?.text ?? ""}</pre>
      </div>
    </>
  );
}
