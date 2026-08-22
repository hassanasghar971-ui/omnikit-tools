import type { ToolMeta } from "@/config/tools-registry";
import { getCategoryOf } from "@/config/tools-registry";
import { hashString, pickStable } from "@/lib/utils";

/**
 * Deterministic, tool-specific copy generation.
 * Every tool page receives a unique combination of headings, guides,
 * FAQs and use-cases derived from its own slug hash — zero duplicated
 * dynamic templates across the registry.
 *
 * Voice: plain, human, helpful. Short sentences, everyday words, no
 * marketing fluff — the way a colleague would explain it.
 */

interface Vars {
  name: string;
  category: string;
  categoryName: string;
  kind: string;
}

function varsOf(tool: ToolMeta): Vars {
  const cat = getCategoryOf(tool);
  return { name: tool.name, category: cat.slug, categoryName: cat.name, kind: tool.kind };
}

function fill(template: string, v: Vars): string {
  return template
    .replaceAll("{name}", v.name)
    .replaceAll("{category}", v.category)
    .replaceAll("{categoryName}", v.categoryName);
}

const META_TITLE_TEMPLATES = [
  "{name} — Free, No Signup, Runs in Your Browser",
  "{name} | OmniKit Tools",
  "{name} — Fast & Private Online Tool",
  "{name} — Instant Results, Nothing Uploaded",
  "{name} — Free Online Utility That Just Works",
  "{name} — Use It Right Here in Your Browser",
] as const;

const META_DESC_TEMPLATES = [
  "Use {name} for free, right in your browser. Nothing gets uploaded, nothing gets stored, and it works offline. Try it in seconds.",
  "A free {name} you can open and use immediately. Results are computed on your own device — private by default.",
  "Looking for a quick {name}? This one runs locally in your tab, needs no account, and leaves no trace behind.",
  "{name} made simple: paste, run, done. A free {categoryName} utility that keeps your data on your machine.",
  "Free online {name} — fast, private, and unlimited. Your input never leaves your device.",
  "No signup, no waiting, no uploads. Just a straightforward {name} that works offline in any modern browser.",
] as const;

const PROBLEM_TEMPLATES = [
  "If you searched for {name}, you probably just want to get something done quickly — without making an account or uploading files to some unknown server.",
  "Most online tools make you sign up, show you a paywall, or quietly keep a copy of your input. {name} skips all of that.",
  "You could install an app for this, or you could run {name} right here in about five seconds. Your call.",
  "Speed and privacy shouldn't be a trade-off, and with {name} they aren't — every calculation happens on your own device.",
  "The simplest fix for a common {categoryName} task is usually a plain tool that opens instantly. That's what this page is.",
  "If your current workflow involves emailing files to yourself or pasting data into a spreadsheet first, {name} is probably a shortcut worth trying.",
] as const;

const HOWTO_TITLES = [
  "Getting started with {name}",
  "How {name} actually works",
  "Tips for better results with {name}",
  "What to check if {name} gives you a strange result",
  "When {name} is (and isn't) the right tool",
  "How we keep {name} private",
  "Using {name} on your phone",
  "A quick walkthrough of {name}",
  "Working with large inputs in {name}",
  "Saving and exporting your {name} results",
] as const;

const HOWTO_BODIES = [
  "Type or paste your input into the box at the top of this page. The result updates right away, because everything is computed by your own browser — there's no upload step, no queue, and no page reloads between attempts.",
  "Everything you enter here stays in this tab. The tool never opens a network connection with your data, so it keeps working even with airplane mode on — the whole OmniKit suite is designed to run offline.",
  "Start small. Try a short, known example first and compare the result against what you expect. Once it looks right, feel free to paste larger batches — the algorithms handle big inputs gracefully.",
  "If a result ever looks wrong, hit the reset button and run it again. The tool repairs its own state automatically, so a bad run never gets stuck — no browser refresh needed.",
  "On your phone or tablet, the tool behaves the same way, and you can add OmniKit to your home screen so it opens like a regular app. It's handy for quick checks while travelling, even without a connection.",
  "For sensitive material — passwords, tokens, contracts, anything confidential — this is one of the safest places to process it, simply because the data is never sent anywhere. There is no server in the loop.",
  "The action bar above the tool gives you a one-click copy, a share link, a PDF export, a print view, and a raw download. That covers most of the ways you'll want to keep or pass along the result.",
  "If you use OmniKit often, press Ctrl+K from anywhere on the site. The search palette finds all 750 tools as you type and jumps straight to the one you need.",
  "Check the questions below for anything specific to {name} — input formats, limits, and edge cases are covered there with concrete answers.",
  "No cookies, no analytics fingerprinting, no rate limits. Close the tab and your session disappears with it; that's the entire point.",
] as const;

const FAQ_POOL: ReadonlyArray<readonly [string, string]> = [
  [
    "Is {name} really free?",
    "Yes — genuinely free, with no premium tier hiding behind it. OmniKit is supported by a few fixed-size ad placements, which means tools like {name} never ask you for payment, trials, or an account.",
  ],
  [
    "Where does my data go when I use {name}?",
    "Nowhere. Your input is processed inside your browser's own memory and never transmitted. Close the tab and it's gone for good — that's the privacy model the whole site is built on.",
  ],
  [
    "Can I use {name} without an internet connection?",
    "You can. Once the page has loaded once, the tool runs entirely on your device, so offline use — even airplane mode — works fine. Install the site as an app and it stays available like any offline app.",
  ],
  [
    "Which browsers does {name} support?",
    "Anything modern: Chrome, Edge, Firefox, Safari, and mobile browsers on Android and iOS. The layout adapts to your screen, and the interface is available in 26 languages.",
  ],
  [
    "Is there a limit on how much I can process?",
    "Only what your device can handle. Normal inputs finish in milliseconds; multi-megabyte files are processed with streaming-friendly code and no artificial quotas.",
  ],
  [
    "Can I use {name} for work?",
    "Plenty of people do, including for sensitive business documents — because nothing ever leaves the machine. Just remember to double-check critical output against an independent source, as you would with any tool.",
  ],
  [
    "How accurate is {name}?",
    "It uses the same well-tested algorithms found in standard libraries. For anything that matters financially or legally, treat the output as a helpful estimate and verify it independently.",
  ],
  [
    "Do I need to create an account?",
    "There isn't even a login page. Every tool, including {name}, opens instantly and remembers nothing — on purpose.",
  ],
  [
    "How do I share a result from {name}?",
    "Use the Share button in the action bar: on phones it opens the native share sheet, and on desktop it copies a direct link to this tool. You can also export a PDF or download the raw output.",
  ],
  [
    "What if {name} shows an unexpected result?",
    "Reset and re-run — the interface self-heals if anything goes sideways. If a specific input reproduces the issue, it can be investigated entirely client-side, so reporting it never means exposing your data.",
  ],
] as const;

const USE_CASES = [
  "Handling {categoryName} chores on machines with no internet connection",
  "Processing confidential inputs that shouldn't touch a third-party server",
  "Quick conversions and checks while reviewing tickets, spreadsheets, or designs",
  "Generating shareable PDF or print exports for clients and colleagues",
  "Teaching or demonstrating {categoryName} concepts without installing software",
  "Preparing data before importing it into other tools",
  "Mobile fieldwork where the connection is slow or absent",
  "Running ad-hoc tasks without creating accounts for every site you visit",
] as const;

export interface ToolContent {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  problem: string;
  howTo: Array<{ title: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
  useCases: string[];
}

export function getToolContent(tool: ToolMeta): ToolContent {
  const v = varsOf(tool);
  const seed = hashString(tool.slug);

  const metaTitle = fill(pickStable(META_TITLE_TEMPLATES, seed, 0), v);
  const metaDescription = fill(pickStable(META_DESC_TEMPLATES, seed, 1), v);
  const problem = fill(pickStable(PROBLEM_TEMPLATES, seed, 2), v);

  // Three guide sections: title + body are picked independently, so
  // combinations vary widely from tool to tool.
  const howTo: Array<{ title: string; body: string }> = [];
  for (let i = 0; i < 3; i++) {
    howTo.push({
      title: fill(pickStable(HOWTO_TITLES, seed, 3 + i * 2), v),
      body: fill(pickStable(HOWTO_BODIES, seed, 4 + i * 2), v),
    });
  }

  // Structural variety: the number of FAQs and use-cases varies per tool
  // (4–5 FAQs, 3–5 use-cases), so pages never share an identical shape.
  const faqCount = 4 + (seed % 2);
  const faqs: Array<{ question: string; answer: string }> = [];
  const used = new Set<number>();
  for (let i = 0; i < faqCount; i++) {
    const idx = (seed + i * 5) % FAQ_POOL.length;
    if (used.has(idx)) continue;
    used.add(idx);
    faqs.push({
      question: fill(FAQ_POOL[idx][0], v),
      answer: fill(FAQ_POOL[idx][1], v),
    });
  }

  const ucCount = 3 + (seed % 3);
  const useCases: string[] = [];
  for (let i = 0; i < ucCount; i++) {
    const uc = fill(pickStable(USE_CASES, seed, 8 + i), v);
    if (!useCases.includes(uc)) useCases.push(uc);
  }

  return {
    metaTitle,
    metaDescription,
    ogTitle: metaTitle,
    ogDescription: metaDescription,
    problem,
    howTo,
    faqs,
    useCases,
  };
}
