import { COMPONENT_SLUGS, TOOL_NAMES, type CategorySlug } from "./tool-lists";
import { hashString, slugify } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Category metadata                                                   */
/* ------------------------------------------------------------------ */

export interface CategoryMeta {
  slug: CategorySlug;
  name: string;
  tagline: string;
  icon: string;
  gradient: string; // tailwind gradient classes
  accent: string;
  description: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { slug: "developer", name: "Developer Utilities", tagline: "Formatters, encoders & dev essentials", icon: "⌨️", gradient: "from-cyan-500/20 to-blue-500/10", accent: "text-cyan-300", description: "JSON, Base64, regex, UUID, JWT and the rest of the daily developer toolkit — all computed on-device." },
  { slug: "pdf", name: "PDF Tools", tagline: "Documents without the cloud", icon: "📄", gradient: "from-rose-500/20 to-orange-500/10", accent: "text-rose-300", description: "Generate, inspect and organize PDF documents instantly with zero uploads and zero data retention." },
  { slug: "image", name: "Image Studio", tagline: "Pixels, polished & private", icon: "🖼️", gradient: "from-violet-500/20 to-fuchsia-500/10", accent: "text-violet-300", description: "Resize, convert and analyze images entirely in your browser using GPU-accelerated canvas processing." },
  { slug: "css", name: "CSS Tools", tagline: "Visual CSS, generated live", icon: "🎨", gradient: "from-pink-500/20 to-rose-500/10", accent: "text-pink-300", description: "Gradients, shadows and layouts generated visually with production-ready, copy-paste CSS output." },
  { slug: "seo", name: "SEO Suite", tagline: "Rank higher with on-page precision", icon: "📈", gradient: "from-emerald-500/20 to-teal-500/10", accent: "text-emerald-300", description: "Meta previews, schema builders, keyword analytics and every on-page SEO check you need to win the SERP." },
  { slug: "finance", name: "Financial Calculators", tagline: "Money math, made instant", icon: "💸", gradient: "from-amber-500/20 to-yellow-500/10", accent: "text-amber-300", description: "Loans, investments, taxes and budgeting — precise financial math with nothing sent to a server." },
  { slug: "security", name: "Security Tools", tagline: "Enterprise-grade client isolation", icon: "🛡️", gradient: "from-red-500/20 to-orange-500/10", accent: "text-red-300", description: "Passwords, hashes, encryption and key generation using WebCrypto in isolated local memory." },
  { slug: "converters", name: "Converters", tagline: "Every unit, every format", icon: "🔄", gradient: "from-cyan-500/20 to-teal-500/10", accent: "text-cyan-300", description: "Units, colors, bases, timestamps and time zones — the definitive conversion library." },
  { slug: "network", name: "Network Tools", tagline: "IP, headers & status intelligence", icon: "🌐", gradient: "from-sky-500/20 to-blue-500/10", accent: "text-sky-300", description: "IP lookups, user-agent parsing, HTTP status intelligence and network calculators." },
  { slug: "productivity", name: "Productivity", tagline: "Focus, time & planning", icon: "⚡", gradient: "from-lime-500/20 to-emerald-500/10", accent: "text-lime-300", description: "Timers, planners, writing aids and decision tools to keep every working session on track." },
  { slug: "media", name: "Media Tools", tagline: "Audio, video & color science", icon: "🎬", gradient: "from-indigo-500/20 to-purple-500/10", accent: "text-indigo-300", description: "BPM, metronomes, aspect ratios, color simulation and media calculators." },
  { slug: "text", name: "Text Tools", tagline: "Words, counts & ciphers", icon: "✍️", gradient: "from-slate-400/20 to-zinc-500/10", accent: "text-slate-300", description: "Counters, case converters, ciphers, generators and linguistic utilities for every writer and analyst." },
];

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.slug, c]));

/* ------------------------------------------------------------------ */
/* Tool metadata                                                       */
/* ------------------------------------------------------------------ */

export type ToolKind = "app" | "engine" | "workspace";

export interface ToolMeta {
  slug: string;
  name: string;
  category: CategorySlug;
  kind: ToolKind;
  globalIndex: number;
  /** Human one-liner used for listings and meta fallbacks. */
  summary: string;
  keywords: string[];
}

const ENGINE_NAME_PATTERNS: RegExp[] = [
  /^(.*) to (.*)$/i,
  / (Formatter|Minifier|Validator|Encoder|Decoder|Generator|Counter|Converter|Checker|Sorter|Translator|Remover|Cleaner|Shuffler|Extractor|Summarizer|Randomizer|Repeater|Multiplier|Expander|Normalizer|Truncator|Shortener|Calculator)$/i,
];

function detectKind(slug: string, name: string): ToolKind {
  if (COMPONENT_SLUGS.includes(slug)) return "app";
  if (ENGINE_NAME_PATTERNS.some((re) => re.test(name))) return "engine";
  return "workspace";
}

function buildKeywords(name: string, category: CategorySlug): string[] {
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ")
    .filter((w) => w.length > 2 && w !== "the" && w !== "tool" && w !== "and");
  const cat = CATEGORY_MAP.get(category);
  return Array.from(new Set([...words, category, cat?.name ?? category])).slice(0, 10);
}

const SUMMARY_PATTERNS = [
  (name: string, cat: string) => `A free ${name} that runs right in your browser — no signup, no uploads, nothing to install.`,
  (name: string) => `${name}, minus the hassle. Open it, use it, close it — your data never leaves the tab.`,
  (name: string, cat: string) => `${name} for quick, everyday ${cat.toLowerCase()} tasks. Works offline and keeps everything on your device.`,
  (name: string) => `Need ${name} without an account or a paywall? This one just works, right here.`,
];

function buildSummary(name: string, category: CategorySlug, seed: number): string {
  const cat = CATEGORY_MAP.get(category)?.name ?? category;
  const fn = SUMMARY_PATTERNS[seed % SUMMARY_PATTERNS.length];
  return fn(name, cat);
}

const registryBuilt: ToolMeta[] = (() => {
  const tools: ToolMeta[] = [];
  const seen = new Set<string>();
  let index = 0;
  for (const cat of CATEGORIES) {
    for (const name of TOOL_NAMES[cat.slug]) {
      const slug = slugify(name);
      if (seen.has(slug)) {
        throw new Error(`Duplicate tool slug detected in registry: "${slug}"`);
      }
      seen.add(slug);
      tools.push({
        slug,
        name,
        category: cat.slug,
        kind: detectKind(slug, name),
        globalIndex: index++,
        summary: buildSummary(name, cat.slug, hashString(slug)),
        keywords: buildKeywords(name, cat.slug),
      });
    }
  }
  if (tools.length !== 750) {
    throw new Error(`Tool registry must contain exactly 750 tools — found ${tools.length}`);
  }
  return tools;
})();

export const ALL_TOOLS: readonly ToolMeta[] = registryBuilt;

export const TOOLS_BY_SLUG: ReadonlyMap<string, ToolMeta> = new Map(
  ALL_TOOLS.map((t) => [t.slug, t]),
);

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS_BY_SLUG.get(slug);
}

export function getToolsByCategory(category: CategorySlug): ToolMeta[] {
  return ALL_TOOLS.filter((t) => t.category === category);
}

export function getCategoryOf(tool: ToolMeta): CategoryMeta {
  return CATEGORY_MAP.get(tool.category)!;
}

export function getRelatedTools(tool: ToolMeta, limit = 6): ToolMeta[] {
  return ALL_TOOLS.filter((t) => t.slug !== tool.slug && t.category === tool.category)
    .sort((a, b) => hashString(a.slug) - hashString(b.slug))
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Full-publication schedule — every tool is indexable                 */
/* ------------------------------------------------------------------ */

/**
 * Content freshness anchor, used to spread sitemap lastModified dates
 * organically across the recent weeks (each tool shows the day its page
 * was last refreshed rather than one identical timestamp).
 */
export const TOOLS_EPOCH = Date.UTC(2026, 7, 1);

/**
 * Publication policy: 100% of the 750-tool registry is published and
 * indexable. Every page carries genuinely unique tool-specific content
 * (guides, FAQs, use-cases), so full exposure is safe.
 */
export function unlockedToolCount(_now: number = Date.now()): number {
  return ALL_TOOLS.length;
}

export function isUnlocked(_tool: ToolMeta, _now: number = Date.now()): boolean {
  return true;
}

export function unlockedTools(_now: number = Date.now()): ToolMeta[] {
  return [...ALL_TOOLS];
}

/** The 16 most recent registry additions display the "New" badge. */
export function isRecentlyUnlocked(tool: ToolMeta, _now: number = Date.now()): boolean {
  return tool.globalIndex >= ALL_TOOLS.length - 16;
}

export const REGISTRY_COUNTS = {
  total: ALL_TOOLS.length,
  apps: ALL_TOOLS.filter((t) => t.kind === "app").length,
  engines: ALL_TOOLS.filter((t) => t.kind === "engine").length,
  workspaces: ALL_TOOLS.filter((t) => t.kind === "workspace").length,
  unlockedToday: unlockedToolCount(),
};
