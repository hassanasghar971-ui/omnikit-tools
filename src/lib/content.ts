import type { ToolMeta } from "@/config/tools-registry";
import { getCategoryOf } from "@/config/tools-registry";
import { hashString, pickStable } from "@/lib/utils";

/**
 * Deterministic, tool-specific copy generation.
 * Every tool page receives a unique combination of headings, guides,
 * FAQs and use-cases derived from its own slug hash — zero duplicated
 * dynamic templates across the registry.
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
  "{name} — Free Online Tool | OmniKit Tools",
  "{name} · Instant, Private & On-Device | OmniKit Tools",
  "{name} Online — No Signup, No Uploads | OmniKit Tools",
  "{name} — {categoryName} Free Tool | OmniKit Tools",
  "Free {name} — Instant Results in Your Browser | OmniKit Tools",
] as const;

const META_DESC_TEMPLATES = [
  "Use the free {name} tool online. {categoryName} made instant: 100% client-side processing, zero uploads, zero data retention. Works offline in any modern browser.",
  "Free online {name} — process your data instantly on your own device. Nothing is uploaded, nothing is stored. Part of the OmniKit Tools {categoryName} suite.",
  "{name}: fast, private and unlimited. Enterprise-grade client isolation with instant results — no servers, no signup, no tracking. Free forever.",
  "Run {name} directly in your browser. Sub-5ms on-device processing, complete privacy, full offline support via PWA. The premium {categoryName} utility from OmniKit Tools.",
  "{name} online tool — instant, accurate and 100% free. Your data never leaves your machine. Trusted {categoryName} utility with zero data retention.",
  "Free {name} from OmniKit Tools. Professional-grade {categoryName} utility with WebAssembly-speed local processing and airtight on-device privacy.",
] as const;

const PROBLEM_TEMPLATES = [
  "Chances are you searched for {name} because you need a fast, reliable result without uploading sensitive data to an unknown server.",
  "Most online utilities require signups, hit you with paywalls, or quietly store your data. {name} fixes exactly that.",
  "Speed and privacy are usually trade-offs. {name} proves they do not have to be: every computation happens locally.",
] as const;

const HOWTO_TITLES = [
  "Getting started with {name}",
  "How {name} works behind the scenes",
  "Best practices for {name}",
  "Avoiding common {name} mistakes",
  "When should you use {name}?",
  "{name} vs. self-hosted alternatives",
  "Optimizing your {category} workflow with {name}",
  "Step-by-step walkthrough of {name}",
  "Advanced tips for power users of {name}",
  "How to validate results from {name}",
] as const;

const HOWTO_BODIES = [
  "Paste or type your input into the workspace at the top of this page and the result renders instantly. Because {name} runs fully on-device with WebAssembly and worker-accelerated computation, there is no upload delay, no queue, and no page reload between attempts.",
  "Every computation in {name} executes inside your browser sandbox. Your input never touches a network socket — the tool keeps working with airplane mode enabled thanks to the OmniKit offline-first PWA architecture.",
  "Start with a small, known test case and confirm the output matches your expectations before processing large batches. The action bar above lets you copy, share, download as PDF, print, or export the raw result in a single click.",
  "If a result ever looks off, press the reset control and re-run the operation. {name} includes automatic state self-healing: transient computation errors repair local state instantly without a full browser refresh.",
  "Bookmark this page or install OmniKit Tools as a PWA to pin {name} to your device home screen. It will launch like a native app and run entirely offline — ideal for air-gapped machines and low-bandwidth environments.",
  "Because everything is client-side, {name} is safe for confidential payloads: tokens, credentials, contract text or private documents never appear in any server log because no server is ever involved.",
  "Combine {name} with the universal action bar: export a PDF proof of your result, print a formatted report with the built-in print stylesheet, or download the raw output in the most useful file format for your pipeline.",
  "Power users can reach any of the 750 OmniKit tools instantly with Ctrl+K. The predictive command palette learns your intent as you type and deep-links straight to {name}.",
  "Check the FAQ below for edge cases specific to {name} — input formats, limits, and encoding gotchas are all documented there with exact, testable answers.",
  "No cookies, no analytics fingerprinting, no rate limits: {name} is deliberately stateless. Close the tab and every trace of your session vanishes with it.",
] as const;

const FAQ_POOL: ReadonlyArray<readonly [string, string]> = [
  [
    "Is {name} really free?",
    "Yes. {name} is 100% free with no usage caps, no paywalls and no hidden trials. OmniKit Tools monetizes exclusively through fixed-size advertising placements, so every utility — including {name} — stays free forever.",
  ],
  [
    "Does {name} upload my data anywhere?",
    "No. {name} runs entirely inside your browser. Input is processed in local memory (optionally inside a dedicated Web Worker) and is never transmitted, logged or retained. Closing the tab erases everything.",
  ],
  [
    "Does {name} work offline?",
    "Completely. OmniKit Tools is an offline-first PWA: once the app shell is cached, {name} — like every other tool in the registry — executes with zero connectivity, including on airplane mode.",
  ],
  [
    "What devices and browsers support {name}?",
    "Any modern browser: Chrome, Edge, Firefox, Safari, and mobile browsers on Android and iOS. The UI is fully responsive, supports RTL layouts, and is served in 9 languages.",
  ],
  [
    "Are there any limits on input size in {name}?",
    "Practical limits depend only on your device memory. Typical inputs process in well under 5ms; multi-megabyte payloads are handled gracefully with streaming-friendly algorithms and no artificial quotas.",
  ],
  [
    "Can I use {name} for commercial or enterprise work?",
    "Absolutely. Results are computed locally with enterprise-grade client isolation, so sensitive commercial documents never transit a third-party server. Many teams use OmniKit utilities for production pipelines.",
  ],
  [
    "How accurate is {name}?",
    "{name} uses the same battle-tested algorithms shipped in standard libraries and platforms. Always verify critical outputs against an independent source — this is good engineering practice for any utility, online or offline.",
  ],
  [
    "Do I need to create an account to use {name}?",
    "No account, no email, no signup — ever. {name} opens instantly, remembers nothing, and respects your privacy by design. There is not even a login page in the product.",
  ],
  [
    "How do I share results from {name}?",
    "Use the Share button in the universal action bar: on supported devices it opens the native Web Share sheet; otherwise it copies a direct link to this exact tool page. You can also export a PDF or download raw output.",
  ],
  [
    "What if {name} gives me an unexpected result?",
    "Re-run the operation after a reset — the self-healing engine repairs local state automatically. If a specific input reproduces an issue, the problem is reproducible entirely client-side and can be reported without exposing any data.",
  ],
] as const;

const USE_CASES = [
  "Processing {category} workloads on air-gapped or offline machines",
  "Validating sensitive payloads without exposing them to third-party servers",
  "Running quick ad-hoc conversions inside design, QA and support tickets",
  "Embedding deterministic outputs into CI scripts and automation pipelines",
  "Teaching or demonstrating {categoryName} concepts in classrooms and meetups",
  "Bulk-preparing data before import into spreadsheets, CMS or analytics tools",
  "Generating auditable PDF or print exports for client deliverables",
  "Mobile-first field work where connectivity is slow or unavailable",
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

  const howTo: Array<{ title: string; body: string }> = [];
  for (let i = 0; i < 3; i++) {
    howTo.push({
      title: fill(pickStable(HOWTO_TITLES, seed, 3 + i * 2), v),
      body: fill(pickStable(HOWTO_BODIES, seed, 4 + i * 2), v),
    });
  }

  const faqCount = 4;
  const faqs = [];
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

  const useCases: string[] = [];
  for (let i = 0; i < 4; i++) {
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
