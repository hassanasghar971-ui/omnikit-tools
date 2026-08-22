"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Zero-CLS Google AdSense slot.
 * Rigid, pre-allocated dimensions are reserved BEFORE the ad loads —
 * absolutely no layout shift, guaranteeing CLS = 0 for policy approval.
 *
 * Configure via:
 *   NEXT_PUBLIC_ADSENSE_CLIENT  (e.g. ca-pub-XXXXXXXXXXXXXXXX)
 *   NEXT_PUBLIC_AD_SLOT_BANNER / _RECT / _LEADER
 * When unconfigured, a fixed-size branded placeholder renders in place.
 */

export type AdVariant = "leaderboard" | "banner" | "rectangle" | "inline";

const VARIANTS: Record<AdVariant, { w: number; h: number; className: string }> = {
  leaderboard: { w: 728, h: 90, className: "h-[90px] min-h-[90px] w-full max-w-[728px]" },
  banner: { w: 468, h: 60, className: "h-[60px] min-h-[60px] w-full max-w-[468px]" },
  rectangle: { w: 300, h: 250, className: "h-[250px] min-h-[250px] w-full max-w-[300px]" },
  inline: { w: 336, h: 280, className: "h-[280px] min-h-[280px] w-full max-w-[336px]" },
};

export function AdSlot({
  variant = "banner",
  className,
  slotId,
}: {
  variant?: AdVariant;
  className?: string;
  slotId?: string;
}) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slot = slotId ?? process.env.NEXT_PUBLIC_AD_SLOT;
  const v = VARIANTS[variant];
  const enabled = Boolean(client && slot);

  useEffect(() => {
    if (!enabled) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      /* AdSense unavailable (blocker/offline) — placeholder remains fixed-size */
    }
  }, [enabled]);

  if (enabled) {
    return (
      <div
        className={cn("ad-slot mx-auto flex items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]", v.className, className)}
        data-cls-guard="true"
      >
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", height: v.h, maxWidth: v.w }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={variant === "rectangle" || variant === "inline" ? "rectangle" : "auto"}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        "ad-slot mx-auto flex flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed border-white/10 bg-white/[0.02]",
        v.className,
        className,
      )}
      data-cls-guard="true"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-600">Advertisement</span>
      <span className="text-[10px] text-slate-700">Fixed-size slot · zero layout shift</span>
    </div>
  );
}

/**
 * Adsterra banner slot — fully self-activating from code.
 * When NEXT_PUBLIC_ADSTERRA_KEY is present, the official Adsterra invoke
 * script + container render inside a rigid fixed-size box (CLS = 0).
 * Without the key, a matching fixed-size placeholder renders — no external
 * configuration is ever required to deploy or run the site.
 */
export function AdsterraSlot({
  height = 250,
  className,
}: {
  height?: 250 | 90;
  className?: string;
}) {
  const [key] = useState<string | null>(() => {
    const env = process.env as Record<string, string | undefined>;
    const k = env["NEXT_PUBLIC_ADSTERRA_KEY"];
    return typeof k === "string" && k.trim() ? k.trim() : null;
  });

  const fixed = height === 250 ? "h-[250px] min-h-[250px]" : "h-[90px] min-h-[90px]";

  if (!key) {
    return (
      <div
        aria-hidden
        className={cn(
          "ad-slot mx-auto flex flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed border-white/10 bg-white/[0.02]",
          fixed,
          className,
        )}
        data-cls-guard="true"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-600">Advertisement</span>
        <span className="text-[10px] text-slate-700">Fixed-size slot · zero layout shift</span>
      </div>
    );
  }

  return (
    <div
      className={cn("ad-slot mx-auto flex items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]", fixed, className)}
      data-cls-guard="true"
    >
      <div id={`container-${key}`} style={{ width: "100%", height }} />
      <script
        type="text/javascript"
        src={`//www.topcreativeformat.com/${encodeURIComponent(key)}/invoke.js`}
        async
      />
    </div>
  );
}
