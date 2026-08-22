/** Tiny shared helpers — pure, isomorphic, zero dependencies. */

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Deterministic slugifier used by the registry. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** djb2 string hash → stable 32-bit number used for deterministic content. */
export function hashString(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Deterministic pick from an array given a seed and index. */
export function pickStable<T>(arr: readonly T[], seed: number, i: number): T {
  if (arr.length === 0) throw new Error("pickStable: empty array");
  return arr[(seed + i * 31) % arr.length];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatBytes(bytes: number): string {
  if (!isFinite(bytes) || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 2)} ${units[i]}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function downloadBlob(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  triggerDownload(filename, url);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadDataUrl(filename: string, dataUrl: string): void {
  triggerDownload(filename, dataUrl);
}

function triggerDownload(filename: string, href: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Canonical site URL — resolved automatically and GUARANTEED to be a
 * valid absolute URL at all times (including build time):
 *   1. NEXT_PUBLIC_SITE_URL  (optional custom-domain override)
 *   2. NEXT_PUBLIC_VERCEL_URL / VERCEL_URL (Vercel system variables)
 *   3. Brand default: https://omnikit.tools
 *
 * Every candidate is normalized and validated with try/catch — empty
 * strings, whitespace, and malformed values can never produce
 * `new URL("")` crashes during `next build` (metadataBase, sitemaps).
 */
export const FALLBACK_SITE_URL = "https://omnikit.tools";

function normalizeSiteUrl(raw: unknown): string {
  if (typeof raw !== "string") return FALLBACK_SITE_URL;
  const trimmed = raw.trim();
  if (!trimmed) return FALLBACK_SITE_URL;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (!parsed.hostname || !parsed.hostname.includes(".")) return FALLBACK_SITE_URL;
    return parsed.origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const SITE_URL: string = (() => {
  try {
    const env = process.env as Record<string, string | undefined>;
    return normalizeSiteUrl(
      env["NEXT_PUBLIC_SITE_URL"] ?? env["NEXT_PUBLIC_VERCEL_URL"] ?? env["VERCEL_URL"],
    );
  } catch {
    return FALLBACK_SITE_URL;
  }
})();

/**
 * Bulletproof `new URL()` wrapper for metadataBase and any other
 * build-time URL instantiation — returns a valid URL object in 100%
 * of cases, so route config collection can never crash.
 */
export function safeUrl(input?: string): URL {
  const candidate = normalizeSiteUrl(input ?? SITE_URL);
  try {
    return new URL(candidate);
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
}

export const SITE_NAME = "OmniKit Tools";

export const FOUNDER = {
  name: "Hassan Asghar",
  email: "hassanasghar7868686@gmail.com",
  phone1: "+92 345 1098607",
  phone2: "+92 349 7726469",
  whatsapp: "923451098607",
};

export const DAY_MS = 86_400_000;
