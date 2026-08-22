"use client";

import { createElement, type ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";

/**
 * LocalizedText — drop-in translated string for any server-rendered page.
 * Renders the dictionary value for the active locale; English baseline
 * during SSR, then switches instantly after hydration (no mismatch,
 * same pattern as the header).
 */
export function LT({
  k,
  vars,
  as = "span",
  className,
}: {
  k: string;
  vars?: Record<string, string>;
  as?: "span" | "h1" | "h2" | "h3" | "p" | "strong";
  className?: string;
}) {
  const { t } = useI18n();
  return createElement(as, { className }, t(k, vars) as ReactNode);
}
