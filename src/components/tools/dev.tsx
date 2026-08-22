"use client";

import { useEffect, useState } from "react";
import { Button, CopyButton, Field, Input, OutputPanel, Panel, Select, TextArea } from "@/components/ui";
import type { ToolResult } from "@/components/universal-action-bar";

export interface ToolProps {
  onResult?: (r: ToolResult) => void;
}

/* ---------------- JSON Formatter ---------------- */

export function JsonFormatter({ onResult }: ToolProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (mode: "pretty" | "minify" | "validate") => {
    try {
      const parsed = JSON.parse(input);
      if (mode === "validate") {
        setOutput(`✓ Valid JSON\nType: ${Array.isArray(parsed) ? "array" : parsed === null ? "null" : typeof parsed}\nKeys/Items: ${Array.isArray(parsed) ? parsed.length : parsed && typeof parsed === "object" ? Object.keys(parsed).length : 1}\nBytes: ${new TextEncoder().encode(input).length.toLocaleString()}`);
        setError(null);
      } else {
        setOutput(JSON.stringify(parsed, null, mode === "pretty" ? 2 : 0));
        setError(null);
      }
    } catch (e) {
      setOutput("");
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    onResult?.({ text: error ? `JSON Error: ${error}` : output, ext: "json" });
  }, [output, error, onResult]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <Field label="JSON input">
          <TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder='{"name":"OmniKit Tools","tools":750,"privacy":"on-device"}' className="min-h-[220px]" />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run("pretty")}>Format · 2 spaces</Button>
          <Button variant="soft" onClick={() => run("minify")}>Minify</Button>
          <Button variant="ghost" onClick={() => run("validate")}>Validate</Button>
          <Button variant="ghost" onClick={() => setInput('{"name":"OmniKit Tools","tools":750,"privacy":"on-device"}')}>Sample</Button>
        </div>
      </div>
      <div className="space-y-2">
        <Field label="Result">{error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-mono text-sm text-rose-300">{error}</div> : <OutputPanel value={output} />}</Field>
        {output ? <CopyButton text={output} /> : null}
      </div>
    </div>
  );
}

/* ---------------- Base64 ---------------- */

export function Base64Tool({ mode = "encode", onResult }: ToolProps & { mode?: "encode" | "decode" }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!input) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      if (mode === "encode") {
        const bytes = new TextEncoder().encode(input);
        let bin = "";
        bytes.forEach((b) => (bin += String.fromCharCode(b)));
        setOutput(btoa(bin));
        setError(null);
      } else {
        const bin = atob(input.trim());
        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        setOutput(new TextDecoder().decode(bytes));
        setError(null);
      }
    } catch (e) {
      setOutput("");
      setError((e as Error).message);
    }
  }, [input, mode]);

  useEffect(() => {
    onResult?.({ text: error ? `Base64 error: ${error}` : output, ext: "txt" });
  }, [output, error, onResult]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Field label={mode === "encode" ? "Plain text" : "Base64 input"}>
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "encode" ? "Type text to encode as Base64…" : "Paste Base64 to decode…"} className="min-h-[200px]" />
      </Field>
      <div className="space-y-2">
        <Field label={mode === "encode" ? "Base64 output" : "Decoded text"} hint="UTF-8 safe · instant">
          {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-mono text-sm text-rose-300">{error}</div> : <OutputPanel value={output} />}
        </Field>
        {output ? <CopyButton text={output} /> : null}
      </div>
    </div>
  );
}

/* ---------------- URL Encoder / Decoder ---------------- */

export function UrlCodec({ mode = "encode", onResult }: ToolProps & { mode?: "encode" | "decode" }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!input) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      setOutput(mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input));
      setError(null);
    } catch {
      setOutput("");
      setError("Invalid URL encoding — check for stray % characters.");
    }
  }, [input, mode]);

  useEffect(() => {
    onResult?.({ text: error ? `URL error: ${error}` : output, ext: "txt" });
  }, [output, error, onResult]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Field label={mode === "encode" ? "Raw text / URL" : "Encoded URL"}>
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "encode" ? "https://example.com/search?q=hello world&lang=en" : "https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world"} className="min-h-[180px]" />
      </Field>
      <div className="space-y-2">
        <Field label={mode === "encode" ? "Percent-encoded" : "Decoded"}>{error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-mono text-sm text-rose-300">{error}</div> : <OutputPanel value={output} />}</Field>
        {output ? <CopyButton text={output} /> : null}
      </div>
    </div>
  );
}

/* ---------------- Regex Tester ---------------- */

export function RegexTester({ onResult }: ToolProps) {
  const [pattern, setPattern] = useState("([a-z]+)@(\\w+)\\.(com|org|io)");
  const [flags, setFlags] = useState("gi");
  const [text, setText] = useState("Contact support@omnikit.tools or sales@example.org today.");
  const [replaceWith, setReplaceWith] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (mode: "match" | "replace") => {
    try {
      const re = new RegExp(pattern, flags.replace(/[^gimsuy]/g, ""));
      if (mode === "replace") {
        setResult(text.replace(re, replaceWith));
        setError(null);
      } else {
        const matches = text.match(re) ?? [];
        setResult(`Matches found: ${matches.length}\n\n${matches.map((m, i) => `  [${i}] ${m}`).join("\n")}`);
        setError(null);
      }
    } catch (e) {
      setResult("");
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    onResult?.({ text: error ? `Regex error: ${error}` : result, ext: "txt" });
  }, [result, error, onResult]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
        <Field label="Pattern"><Input value={pattern} onChange={(e) => setPattern(e.target.value)} className="font-mono" placeholder="/pattern/" /></Field>
        <Field label="Flags"><Input value={flags} onChange={(e) => setFlags(e.target.value)} className="font-mono" placeholder="gi" /></Field>
      </div>
      <Field label="Test string">
        <TextArea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[110px]" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="Replace with (optional)"><Input value={replaceWith} onChange={(e) => setReplaceWith(e.target.value)} className="font-mono" placeholder="$1@redacted.$2" /></Field>
        <div className="flex items-end gap-2 pb-0.5">
          <Button onClick={() => run("match")}>Test Match</Button>
          <Button variant="soft" onClick={() => run("replace")}>Replace</Button>
        </div>
      </div>
      <Field label="Result">{error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-mono text-sm text-rose-300">{error}</div> : <OutputPanel value={result} />}</Field>
    </div>
  );
}

/* ---------------- UUID Generator ---------------- */

export function UuidGenerator({ onResult }: ToolProps) {
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [noDashes, setNoDashes] = useState(false);
  const [bulk, setBulk] = useState("");
  const [single, setSingle] = useState("");

  const makeOne = (): string => {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  };

  const format = (u: string) => {
    let out = u;
    if (uppercase) out = out.toUpperCase();
    if (noDashes) out = out.replaceAll("-", "");
    return out;
  };

  const generate = () => {
    setSingle(format(makeOne()));
    setBulk(Array.from({ length: Math.min(count, 200) }, () => format(makeOne())).join("\n"));
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uppercase, noDashes, count]);

  useEffect(() => {
    onResult?.({ text: single ? `${single}\n\n${bulk}` : bulk, ext: "txt" });
  }, [single, bulk, onResult]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Count"><Input type="number" min={1} max={200} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} className="w-28" /></Field>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-300"><input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} className="accent-cyan-400" /> Uppercase</label>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-300"><input type="checkbox" checked={noDashes} onChange={(e) => setNoDashes(e.target.checked)} className="accent-cyan-400" /> No dashes</label>
        <Button onClick={generate}>Regenerate</Button>
      </div>
      <div className="space-y-2">
        <Field label="Latest (RFC 4122 v4)">
          <Panel className="p-4"><p className="break-all font-mono text-sm text-cyan-300">{single || "Generating…"}</p></Panel>
        </Field>
        {bulk ? (
          <Field label="Bulk">
            <OutputPanel value={bulk} />
            <div className="mt-2"><CopyButton text={bulk} label="Copy all" /></div>
          </Field>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- JWT Decoder ---------------- */

export function JwtDecoder({ onResult }: ToolProps) {
  const [token, setToken] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const decode = (t: string) => {
    if (!t) {
      setOutput("");
      setError(null);
      return;
    }
    const parts = t.trim().split(".");
    if (parts.length !== 3) {
      setError("Not a JWT — expected 3 dot-separated segments (header.payload.signature).");
      setOutput("");
      return;
    }
    try {
      const dec = (seg: string) => {
        const norm = seg.replace(/-/g, "+").replace(/_/g, "/");
        const padded = norm + "=".repeat((4 - (norm.length % 4)) % 4);
        return JSON.parse(decodeURIComponent(Array.from(atob(padded), (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")));
      };
      const header = dec(parts[0]);
      const payload = dec(parts[1]);
      const lines = [
        "HEADER (decoded)",
        JSON.stringify(header, null, 2),
        "",
        "PAYLOAD (decoded)",
        JSON.stringify(payload, null, 2),
      ];
      if (typeof payload.exp === "number") {
        const expDate = new Date(payload.exp * 1000);
        const expired = Date.now() > payload.exp * 1000;
        lines.push("", `Expires: ${expDate.toUTCString()} — ${expired ? "⛔ EXPIRED" : "✓ valid"}`);
      }
      if (typeof payload.iat === "number") {
        lines.push(`Issued at: ${new Date(payload.iat * 1000).toUTCString()}`);
      }
      setOutput(lines.join("\n"));
      setError(null);
    } catch (e) {
      setOutput("");
      setError(`Decode failed: ${(e as Error).message}`);
    }
  };

  useEffect(() => decode(token), [token]);
  useEffect(() => {
    onResult?.({ text: error ? `JWT error: ${error}` : output, ext: "txt" });
  }, [output, error, onResult]);

  return (
    <div className="space-y-3">
      <Field label="JWT token" hint="decoded locally — never transmitted">
        <TextArea value={token} onChange={(e) => setToken(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature" className="min-h-[90px]" />
      </Field>
      {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-mono text-sm text-rose-300">{error}</div> : <OutputPanel value={output} />}
    </div>
  );
}

/* ---------------- Number Base Converter ---------------- */

export function NumberBaseConverter({ onResult }: ToolProps) {
  const [value, setValue] = useState("255");
  const [from, setFrom] = useState(10);
  const [to, setTo] = useState(16);
  const [output, setOutput] = useState("ff");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const negative = value.trim().startsWith("-");
      const unsigned = negative ? value.trim().slice(1) : value.trim().toLowerCase();
      const prefixes: Record<number, string> = { 2: "0b", 8: "0o", 16: "0x" };
      const parsed =
        from === 10
          ? BigInt(unsigned)
          : from in prefixes
            ? BigInt(prefixes[from] + unsigned)
            : BigInt(parseInt(unsigned, from).toString());
      setOutput((negative ? "-" : "") + parsed.toString(to));
      setError(null);
    } catch {
      setOutput("");
      setError(`"${value}" is not a valid base-${from} number`);
    }
  }, [value, from, to]);

  useEffect(() => {
    onResult?.({ text: error ? `Conversion error: ${error}` : output, ext: "txt" });
  }, [output, error, onResult]);

  const bases = Array.from({ length: 35 }, (_, i) => i + 2);

  return (
    <div className="space-y-4">
      <Field label="Number"><Input value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" placeholder="255" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="From base"><Select value={from} onChange={(e) => setFrom(Number(e.target.value))}>{bases.map((b) => <option key={b} value={b}>Base {b} {b === 2 ? "(binary)" : b === 8 ? "(octal)" : b === 10 ? "(decimal)" : b === 16 ? "(hex)" : ""}</option>)}</Select></Field>
        <Field label="To base"><Select value={to} onChange={(e) => setTo(Number(e.target.value))}>{bases.map((b) => <option key={b} value={b}>Base {b} {b === 2 ? "(binary)" : b === 8 ? "(octal)" : b === 10 ? "(decimal)" : b === 16 ? "(hex)" : ""}</option>)}</Select></Field>
      </div>
      <div className="space-y-2">
        <Field label="Result">{error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-mono text-sm text-rose-300">{error}</div> : <Panel className="p-4"><p className="break-all font-mono text-lg text-cyan-300">{output || "—"}</p></Panel>}</Field>
        {output ? <CopyButton text={output} /> : null}
      </div>
    </div>
  );
}

/* ---------------- QR Code Generator ---------------- */

export function QrCodeGenerator({ onResult }: ToolProps) {
  const [text, setText] = useState("https://omnikit.tools");
  const [size, setSize] = useState(280);
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDataUrl("");
    if (!text) {
      setError(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL(text, {
          width: size,
          margin: 2,
          color: { dark: "#0b1626", light: "#e2f7ff" },
        });
        if (!cancelled) {
          setDataUrl(url);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
        }
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, size]);

  useEffect(() => {
    onResult?.({ text: `QR Code — ${text}`, dataUrl, ext: "png", fileName: "qrcode.png" });
  }, [dataUrl, text, onResult]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Field label="Content to encode"><TextArea value={text} onChange={(e) => setText(e.target.value)} placeholder="URL, text, Wi-Fi config, contact card…" className="min-h-[110px]" /></Field>
        <div>
          <p className="mb-2 text-xs font-medium text-slate-400">Output size: <span className="font-mono text-cyan-300">{size}px</span></p>
          <input type="range" min={128} max={512} step={32} value={size} onChange={(e) => setSize(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400" />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        {/* Fixed-size box pre-allocated for the QR render → CLS = 0 */}
        <div className="grid place-items-center rounded-xl border border-white/10 bg-white p-3" style={{ width: size, height: size }}>
          {error ? <p className="px-4 text-center text-xs text-rose-300">{error}</p> : dataUrl ? <img src={dataUrl} alt="Generated QR code" className="h-full w-full" /> : <p className="text-xs text-slate-500">Rendering…</p>}
        </div>
        {dataUrl ? <CopyButton text={text} label="Copy content" /> : null}
      </div>
    </div>
  );
}

/* ---------------- Timestamp Converter ---------------- */

export function TimestampConverter({ onResult }: ToolProps) {
  const [input, setInput] = useState("");
  const [now, setNow] = useState(0); // server-safe initial (hydration-safe)
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    const trimmed = input.trim();
    const num = Number(trimmed);
    let ms: number;
    if (/^\d+$/.test(trimmed)) {
      ms = trimmed.length <= 11 ? num * 1000 : num; // seconds vs ms
      if (ms > 86_400_000_000_000) {
        setError("Timestamp out of range");
        setOutput("");
        return;
      }
    } else {
      ms = Date.parse(trimmed);
      if (isNaN(ms)) {
        setError(`Cannot parse "${trimmed}" as a date`);
        setOutput("");
        return;
      }
    }
    const d = new Date(ms);
    setOutput(
      `Unix seconds:  ${Math.floor(ms / 1000)}\nUnix ms:       ${ms}\nISO 8601:      ${d.toISOString()}\nUTC:           ${d.toUTCString()}\nLocal:         ${d.toString()}\nDay of week:   ${d.toLocaleDateString(undefined, { weekday: "long" })}`,
    );
    setError(null);
  }, [input]);

  useEffect(() => {
    onResult?.({ text: error ? `Timestamp error: ${error}` : output, ext: "txt" });
  }, [output, error, onResult]);

  return (
    <div className="space-y-4">
      <Panel className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Current epoch</p>
          <p className="font-mono text-xl text-cyan-300">{now ? Math.floor(now / 1000).toLocaleString() : "…"} <span className="text-xs text-slate-500">s</span></p>
        </div>
        <p className="font-mono text-xs text-slate-500">{now ? new Date(now).toUTCString() : "syncing clock…"}</p>
      </Panel>
      <Field label="Timestamp or date to convert" hint="e.g. 1717200000 · 2026-06-01 · “now”">
        <Input value={input} onChange={(e) => setInput(e.target.value)} className="font-mono" placeholder="1717200000" />
      </Field>
      <div className="flex gap-2">
        <Button variant="soft" onClick={() => setInput(String(Math.floor(now / 1000)))}>Use now</Button>
        <Button variant="ghost" onClick={() => setInput("")}>Clear</Button>
      </div>
      {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-mono text-sm text-rose-300">{error}</div> : <OutputPanel value={output} />}
    </div>
  );
}


