"use client";

import { useCallback, useEffect, useState } from "react";
import type { ToolMeta } from "@/config/tools-registry";
import { ToolRenderer } from "@/components/tool-renderer";
import { UniversalActionBar, type ToolResult } from "@/components/universal-action-bar";
import { AdSlot } from "@/components/ad-slot";
import { Panel } from "@/components/ui";
import { SelfHealingBoundary } from "@/components/error-boundary";

export function ToolClient({ tool }: { tool: ToolMeta }) {
  const [result, setResult] = useState<ToolResult | null>(null);

  const handleResult = useCallback((r: ToolResult) => {
    setResult((prev) => (prev && prev.text === r.text && prev.dataUrl === r.dataUrl ? prev : r));
  }, []);

  // Self-healing: reset corrupt state if the tool identity changes
  useEffect(() => {
    setResult(null);
  }, [tool.slug]);

  return (
    <div className="space-y-4">
      <Panel className="p-4 sm:p-6">
        <SelfHealingBoundary label={tool.name} key={tool.slug}>
          <ToolRenderer tool={tool} onResult={handleResult} />
        </SelfHealingBoundary>
      </Panel>

      <UniversalActionBar tool={tool} result={result} />

      <AdSlot variant="banner" className="my-4" />

      <p className="flex items-center gap-2 text-[11px] text-slate-600">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
        100% on-device · no uploads · no cookies · no tracking · state self-heals on error
      </p>
    </div>
  );
}
