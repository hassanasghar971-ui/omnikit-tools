"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, CopyButton, Field, Input, OutputPanel, Panel, Select, TextArea } from "@/components/ui";
import type { ToolProps } from "@/components/tools/dev";

/* ---------------- Word Counter ---------------- */

export function WordCounter({ onResult }: ToolProps) {
  const [text, setText] = useState("OmniKit Tools runs every computation on your device — no servers, no uploads, no tracking. Paste anything here to analyze it instantly.");
  const stats = useMemo(() => {
    const words = text.trim() ? (text.trim().match(/\S+/g) ?? []).length : 0;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;
    const letters = (text.match(/[a-zA-Z]/g) ?? []).length;
    const sentences = (text.match(/[.!?]+(\s|$)/g) ?? []).length;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
    const lines = text ? text.split("\n").length : 0;
    const reading = Math.ceil(words / 200);
    const speaking = Math.ceil(words / 130);
    return { words, chars, charsNoSpace, letters, sentences, paragraphs, lines, reading, speaking };
  }, [text]);

  const cells = [
    { label: "Words", value: stats.words, icon: "✍️" },
    { label: "Characters", value: stats.chars, icon: "🔤" },
    { label: "No spaces", value: stats.charsNoSpace, icon: "↔" },
    { label: "Letters", value: stats.letters, icon: "🅰️" },
    { label: "Sentences", value: stats.sentences, icon: "🔚" },
    { label: "Paragraphs", value: stats.paragraphs, icon: "📄" },
    { label: "Lines", value: stats.lines, icon: "➖" },
    { label: "Reading time", value: `${stats.reading} min`, icon: "📖" },
    { label: "Speaking time", value: `${stats.speaking} min`, icon: "🎙️" },
  ];

  useEffect(() => {
    onResult?.({ text: cells.map((c) => `${c.label}: ${c.value}`).join("\n"), ext: "txt" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, onResult]);

  return (
    <div className="space-y-4">
      <TextArea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[180px]" placeholder="Paste or type your text…" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cells.map((c) => (
          <Panel key={c.label} className="p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">{c.icon} {c.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-cyan-300">{c.value}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Case Converter ---------------- */

export function CaseConverter({ onResult }: ToolProps) {
  const [input, setInput] = useState("the quick brown fox jumps over the lazy dog");
  const [output, setOutput] = useState("");

  const transforms: Array<[string, (s: string) => string]> = [
    ["UPPERCASE", (s) => s.toUpperCase()],
    ["lowercase", (s) => s.toLowerCase()],
    ["Title Case", (s) => s.toLowerCase().replace(/(^|\s)(\S)/g, (_, sp: string, c: string) => sp + c.toUpperCase())],
    ["Sentence case", (s) => s.toLowerCase().replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g, (c) => c.toUpperCase())],
    ["camelCase", (s) => { const w = s.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean); return w.length ? w[0].toLowerCase() + w.slice(1).map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase()).join("") : ""; }],
    ["PascalCase", (s) => s.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean).map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase()).join("")],
    ["snake_case", (s) => s.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase().replace(/^_+|_+$/g, "")],
    ["kebab-case", (s) => s.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase().replace(/^-+|-+$/g, "")],
    ["aLtErNaTiNg", (s) => s.split("").map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join("")],
    ["iNVERT cASE", (s) => s.split("").map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join("")],
  ];

  useEffect(() => {
    onResult?.({ text: output, ext: "txt" });
  }, [output, onResult]);

  return (
    <div className="space-y-4">
      <TextArea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[90px]" />
      <div className="flex flex-wrap gap-2">
        {transforms.map(([label, fn]) => (
          <Button key={label} variant="soft" className="font-mono text-xs" onClick={() => setOutput(fn(input))}>{label}</Button>
        ))}
      </div>
      <OutputPanel value={output} />
      {output ? <CopyButton text={output} /> : null}
    </div>
  );
}

/* ---------------- Lorem Ipsum ---------------- */

export function LoremIpsumGenerator({ onResult }: ToolProps) {
  const [type, setType] = useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const [count, setCount] = useState(3);
  const [classic, setClassic] = useState(true);
  const [output, setOutput] = useState("");

  const SENTENCES = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse.",
    "Excepteur sint occaecat cupidatat non proident, sunt in culpa.",
    "Nisi ut aliquip ex ea commodo consequat, sed inceptos himenaeos.",
    "Cras pulvinar mattis nunc, sed blandit libero volutpat sed.",
    "Pellentesque habitant morbi tristique senectus et netus.",
    "Vestibulum ante ipsum primis in faucibus orci luctus.",
    "Etiam rhoncus, tortor sed eleifend tristique, nulla nunc porta lectus.",
  ];
  const WORDS = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
    "eiusmod", "tempor", "incididunt", "magna", "aliqua", "veniam", "quis", "nostrud", "ullamco",
    "laboris", "aliquip", "commodo", "consequat", "habitant", "morbi", "tristique", "senectus",
  ];

  const generate = () => {
    const n = Math.min(count, 50);
    if (type === "words") {
      setOutput(Array.from({ length: n }, () => WORDS[Math.floor(Math.random() * WORDS.length)]).join(" "));
    } else if (type === "sentences") {
      const sentences = Array.from({ length: n }, () => SENTENCES[Math.floor(Math.random() * SENTENCES.length)]);
      setOutput(classic && n > 0 ? "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + sentences.slice(1).join(" ") : sentences.join(" "));
    } else {
      const paragraphs = Array.from({ length: n }, () => {
        const s = 4 + Math.floor(Math.random() * 4);
        return Array.from({ length: s }, () => SENTENCES[Math.floor(Math.random() * SENTENCES.length)]).join(" ");
      });
      if (classic && paragraphs.length > 0) paragraphs[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. " + paragraphs[0];
      setOutput(paragraphs.join("\n\n"));
    }
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, count, classic]);

  useEffect(() => {
    onResult?.({ text: output, ext: "txt" });
  }, [output, onResult]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Type"><Select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="w-40">{(["paragraphs", "sentences", "words"] as const).map((t2) => <option key={t2} value={t2}>{t2}</option>)}</Select></Field>
        <Field label="Count"><Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} className="w-24" /></Field>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-300"><input type="checkbox" checked={classic} onChange={(e) => setClassic(e.target.checked)} className="accent-cyan-400" /> Start with “Lorem ipsum…”</label>
        <Button onClick={generate}>Generate</Button>
      </div>
      <OutputPanel value={output} />
      {output ? <CopyButton text={output} /> : null}
    </div>
  );
}

/* ---------------- Slug Generator ---------------- */

export function SlugGenerator({ onResult }: ToolProps) {
  const [input, setInput] = useState("How to Export PDF Results from OmniKit Tools");
  const output = useMemo(
    () => input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    [input],
  );
  const versions = useMemo(() => {
    const words = output.split("-").filter(Boolean);
    return [output, words.slice(0, 5).join("-"), words.slice(0, 3).join("-"), words.map((w) => w.replace(/[aeiou]/g, "")).filter(Boolean).join("-")].filter(Boolean);
  }, [output]);

  useEffect(() => {
    onResult?.({ text: versions.join("\n"), ext: "txt" });
  }, [versions, onResult]);

  return (
    <div className="space-y-4">
      <Field label="Title / text"><Input value={input} onChange={(e) => setInput(e.target.value)} className="text-base" /></Field>
      <div className="space-y-2">
        {versions.map((v, i) => (
          <Panel key={v} className="flex items-center justify-between gap-3 p-3">
            <code className={`font-mono text-sm ${i === 0 ? "text-cyan-300" : "text-slate-400"}`}>/{v}</code>
            <CopyButton text={v} className="shrink-0" />
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Text Reverser ---------------- */

export function TextReverser({ onResult }: ToolProps) {
  const [input, setInput] = useState("OmniKit Tools — 100% on-device");
  const [mode, setMode] = useState<"chars" | "words" | "lines">("chars");
  const output = useMemo(() => {
    if (mode === "chars") return input.split("").reverse().join("");
    if (mode === "words") return input.split(/\s+/).reverse().join(" ");
    return input.split("\n").reverse().join("\n");
  }, [input, mode]);

  useEffect(() => {
    onResult?.({ text: output, ext: "txt" });
  }, [output, onResult]);

  return (
    <div className="space-y-4">
      <TextArea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[90px]" />
      <div className="flex gap-2">
        {(["chars", "words", "lines"] as const).map((m) => (
          <Button key={m} variant={mode === m ? "primary" : "ghost"} onClick={() => setMode(m)}>By {m}</Button>
        ))}
      </div>
      <OutputPanel value={output} />
      {output ? <CopyButton text={output} /> : null}
    </div>
  );
}

/* ---------------- Find & Replace ---------------- */

export function FindReplace({ onResult }: ToolProps) {
  const [text, setText] = useState("The quick brown fox. The lazy dog. The quick dog.");
  const [find, setFind] = useState("quick");
  const [replace, setReplace] = useState("fast");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [output, setOutput] = useState("");
  const [count, setCount] = useState(0);

  const run = () => {
    try {
      const re = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), caseSensitive ? "g" : "gi");
      let hits = 0;
      const result = text.replace(re, () => {
        hits++;
        return replace;
      });
      setOutput(result);
      setCount(hits);
    } catch {
      setOutput("");
      setCount(0);
    }
  };

  useEffect(() => {
    onResult?.({ text: `${count} replacements\n\n${output}`, ext: "txt" });
  }, [output, count, onResult]);

  return (
    <div className="space-y-3">
      <Field label="Text"><TextArea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[110px]" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Find"><Input value={find} onChange={(e) => setFind(e.target.value)} className="font-mono" /></Field>
        <Field label="Replace with"><Input value={replace} onChange={(e) => setReplace(e.target.value)} className="font-mono" /></Field>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={run}>Replace all</Button>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} className="accent-cyan-400" /> Case sensitive</label>
        {output ? <span className="text-xs text-emerald-300">{count} replacement{count === 1 ? "" : "s"} made</span> : null}
      </div>
      <OutputPanel value={output} />
    </div>
  );
}

/* ---------------- Text Diff ---------------- */

function lcsLines(a: string[], b: string[]): Array<{ type: "same" | "add" | "del"; text: string }> {
  const n = a.length;
  const m = b.length;

  // Pathological-input guard: exact LCS is O(n·m). Past huge diffs, switch
  // to an O(n+m) prefix/suffix algorithm so the tab can never freeze.
  if (n * m > 4_000_000) {
    let start = 0;
    while (start < n && start < m && a[start] === b[start]) start++;
    let endA = n;
    let endB = m;
    while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
      endA--;
      endB--;
    }
    const out: Array<{ type: "same" | "add" | "del"; text: string }> = [];
    for (let i = 0; i < start; i++) out.push({ type: "same", text: a[i] });
    for (let i = start; i < endA; i++) out.push({ type: "del", text: a[i] });
    for (let i = start; i < endB; i++) out.push({ type: "add", text: b[i] });
    for (let i = endA; i < n; i++) out.push({ type: "same", text: a[i] });
    return out;
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: Array<{ type: "same" | "add" | "del"; text: string }> = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "del", text: a[i] });
      i++;
    } else {
      out.push({ type: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) out.push({ type: "del", text: a[i++] });
  while (j < m) out.push({ type: "add", text: b[j++] });
  return out;
}

export function TextDiff({ onResult }: ToolProps) {
  const [left, setLeft] = useState("OmniKit Tools\nJSON Formatter\nBase64 Encoder\nRegex Tester");
  const [right, setRight] = useState("OmniKit Tools\nJSON Formatter\nBase64 Decoder\nRegex Tester\nUUID Generator");
  const diff = useMemo(() => lcsLines(left.split("\n"), right.split("\n")), [left, right]);
  const summary = useMemo(() => {
    const adds = diff.filter((d) => d.type === "add").length;
    const dels = diff.filter((d) => d.type === "del").length;
    return `${adds} line(s) added · ${dels} line(s) removed`;
  }, [diff]);

  useEffect(() => {
    onResult?.({ text: `${summary}\n\n${diff.map((d) => `${d.type === "add" ? "+" : d.type === "del" ? "-" : " "} ${d.text}`).join("\n")}`, ext: "txt" });
  }, [diff, summary, onResult]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <Field label="Original"><TextArea value={left} onChange={(e) => setLeft(e.target.value)} className="min-h-[150px]" /></Field>
        <Field label="Modified"><TextArea value={right} onChange={(e) => setRight(e.target.value)} className="min-h-[150px]" /></Field>
      </div>
      <p className="text-xs font-medium text-emerald-300">{summary}</p>
      <div className="rounded-xl border border-white/10 bg-[#0d1424] px-4 py-3 font-mono text-sm leading-relaxed">
        {diff.map((d, i) => (
          <div key={i} className={d.type === "add" ? "bg-emerald-500/10 text-emerald-300" : d.type === "del" ? "bg-rose-500/10 text-rose-300 line-through" : "text-slate-400"}>
            {d.type === "add" ? "+" : d.type === "del" ? "−" : " "} {d.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Text to Speech ---------------- */

export function TextToSpeech({ onResult }: ToolProps) {
  const [text, setText] = useState("OmniKit Tools processes everything on your device. Nothing is uploaded, nothing is stored.");
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
  }, []);

  const speak = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };
  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    onResult?.({ text, ext: "txt" });
  }, [text, onResult]);

  return (
    <div className="space-y-4">
      <TextArea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[140px]" />
      {supported ? (
        <div className="flex gap-2">
          <Button onClick={speak} disabled={speaking}>{speaking ? "▶ Speaking…" : "▶ Speak"}</Button>
          {speaking ? <Button variant="ghost" onClick={stop}>Stop</Button> : null}
        </div>
      ) : (
        <p className="text-sm text-amber-300">Speech synthesis is not supported in this browser.</p>
      )}
      <p className="text-xs text-slate-500">Voice is generated locally by your operating system — audio never leaves your device.</p>
    </div>
  );
}

/* ---------------- Speech to Text ---------------- */

type SpeechRecCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

function getSpeechCtor(): SpeechRecCtor | null {
  const w = window as unknown as { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function SpeechToText({ onResult }: ToolProps) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recorder = useRef<{ stop(): void } | null>(null);

  useEffect(() => {
    setSupported(Boolean(getSpeechCtor()));
    return () => recorder.current?.stop();
  }, []);

  const toggle = () => {
    const Ctor = getSpeechCtor();
    if (!Ctor) return;
    if (listening) {
      recorder.current?.stop();
      recorder.current = null;
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event: unknown) => {
      const ev = event as { results: ArrayLike<ArrayLike<{ transcript: string }>> };
      let finalText = "";
      for (let i = 0; i < ev.results.length; i++) {
        finalText += ev.results[i][0].transcript;
      }
      setText(finalText);
    };
    rec.onend = () => {
      recorder.current = null;
      setListening(false);
    };
    recorder.current = rec;
    rec.start();
    setListening(true);
  };

  useEffect(() => {
    onResult?.({ text, ext: "txt" });
  }, [text, onResult]);

  return (
    <div className="space-y-4">
      {supported ? (
        <div className="flex items-center gap-3">
          <Button onClick={toggle} variant={listening ? "danger" : "primary"}>
            {listening ? "■ Stop listening" : "🎙 Start listening"}
          </Button>
          {listening ? (
            <span className="flex items-center gap-2 text-xs text-cyan-300">
              <span className="live-dot h-2 w-2 rounded-full bg-cyan-400" /> Live transcription active
            </span>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-amber-300">Speech recognition requires Chrome or Edge. Recognition runs locally via the Web Speech API.</p>
      )}
      <OutputPanel value={text} placeholder="Spoken words will appear here…" />
      {text ? <CopyButton text={text} /> : null}
    </div>
  );
}
