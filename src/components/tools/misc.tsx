"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, CopyButton, Field, Input, OutputPanel, Panel, Select, TextArea } from "@/components/ui";
import type { ToolProps } from "@/components/tools/dev";
import { formatBytes } from "@/lib/utils";

/* ============ IMAGE ============ */

function useFileImage(onLoad: (img: HTMLImageElement, file: File) => void) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onFile = (f: File | null) => {
    setFile(f);
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => onLoad(img, f);
      img.onerror = () => setError("Could not decode this image.");
      img.src = String(reader.result);
    };
    reader.readAsDataURL(f);
  };
  return { file, error, onFile };
}

export function ImageToBase64({ onResult }: ToolProps) {
  const [dataUrl, setDataUrl] = useState("");
  const { file, error, onFile } = useFileImage((img, f) => {
    setDataUrl(img.src);
    void f;
  });

  useEffect(() => {
    onResult?.({
      text: dataUrl ? `Data URL (${formatBytes(Math.round(dataUrl.length * 0.75))} approx)\n\n${dataUrl}` : "",
      dataUrl: dataUrl || undefined,
      ext: "png",
      fileName: file ? file.name : undefined,
    });
  }, [dataUrl, file, onResult]);

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center transition-colors hover:border-cyan-500/40">
        <span className="text-3xl">🖼️</span>
        <span className="text-sm text-slate-300">{file ? file.name : "Drop an image or click to browse"}</span>
        <span className="text-xs text-slate-600">Converted locally — nothing is uploaded</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </label>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {dataUrl ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {/* Fixed-size preview box → zero layout shift while decoding */}
            <div className="grid h-48 w-full max-w-sm place-items-center overflow-hidden rounded-xl border border-white/10 bg-[#0d1424]">
              <img src={dataUrl} alt="Preview" className="h-full w-full object-contain" />
            </div>
            <div className="space-y-1 text-xs text-slate-400">
              <p>Length: <span className="font-mono text-cyan-300">{dataUrl.length.toLocaleString()} chars</span></p>
              <p>Approx size: <span className="font-mono text-cyan-300">{formatBytes(Math.round(dataUrl.length * 0.75))}</span></p>
            </div>
          </div>
          <OutputPanel value={dataUrl} placeholder="Data URL appears here…" />
          <CopyButton text={dataUrl} label="Copy data URL" />
        </>
      ) : null}
    </div>
  );
}

export function ImageResizer({ onResult }: ToolProps) {
  const [dataUrl, setDataUrl] = useState("");
  const [width, setWidth] = useState(800);
  const [quality, setQuality] = useState(0.85);
  const [format, setFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/jpeg");
  const [info, setInfo] = useState("");
  const { file, error, onFile } = useFileImage((img, f) => {
    const ratio = img.height / img.width;
    const targetW = Math.min(img.width, 1200);
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = Math.round(targetW * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    setDataUrl(canvas.toDataURL("image/jpeg", 0.9));
    setInfo(`Original: ${img.width}×${img.height} · ${formatBytes(f.size)}`);
  });

  const resize = () => {
    if (!dataUrl) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = Math.round((img.height / img.width) * width);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setDataUrl(canvas.toDataURL(format, quality));
    };
    img.src = dataUrl;
  };

  useEffect(() => {
    onResult?.({ text: info, dataUrl: dataUrl || undefined, ext: "png", fileName: "resized-image.png" });
  }, [dataUrl, info, onResult]);

  const ext = format.split("/")[1] === "jpeg" ? "jpg" : format.split("/")[1];

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] px-6 py-8 text-center hover:border-cyan-500/40">
        <span className="text-2xl">📐</span>
        <span className="text-sm text-slate-300">{file ? file.name : "Choose an image to resize"}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </label>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {dataUrl ? (
        <>
          <p className="text-xs text-slate-400">{info}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Target width (px)"><Input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="font-mono" /></Field>
            <Field label="Format"><Select value={format} onChange={(e) => setFormat(e.target.value as typeof format)}><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></Select></Field>
            <Field label="Quality"><Input type="number" step={0.05} min={0.1} max={1} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="font-mono" /></Field>
          </div>
          <div className="flex gap-2">
            <Button onClick={resize}>Resize preview</Button>
            <CopyButton text={`${width}px · ${format} · q${quality}`} label="Copy settings" />
          </div>
          {/* Fixed-size preview box → zero layout shift while decoding */}
          <div className="grid h-64 w-full place-items-center overflow-hidden rounded-xl border border-white/10 bg-[#0d1424]">
            <img src={dataUrl} alt="Resized preview" className="h-full w-full object-contain" />
          </div>
          <p className="text-xs text-slate-500">Download the final PNG via “Download Raw” in the action bar above.</p>
        </>
      ) : null}
    </div>
  );
}

export function ImageMetadata({ onResult }: ToolProps) {
  const [meta, setMeta] = useState("");
  const { file, error, onFile } = useFileImage((img, f) => {
    const lines = [
      `File name: ${f.name}`,
      `File type: ${f.type || "unknown"}`,
      `File size: ${formatBytes(f.size)}`,
      `Dimensions: ${img.width} × ${img.height} px`,
      `Aspect ratio: ${(img.width / img.height).toFixed(4)}:1`,
      `Megapixels: ${((img.width * img.height) / 1e6).toFixed(2)} MP`,
      `Last modified: ${new Date(f.lastModified).toISOString()}`,
    ];
    setMeta(lines.join("\n"));
  });

  useEffect(() => {
    onResult?.({ text: meta, ext: "txt" });
  }, [meta, onResult]);

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] px-6 py-8 text-center hover:border-cyan-500/40">
        <span className="text-2xl">🔍</span>
        <span className="text-sm text-slate-300">{file ? file.name : "Choose an image to inspect"}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </label>
      {error ? <p className="text-sm text-rose-300">{error}</p> : meta ? <OutputPanel value={meta} /> : null}
      {meta ? <CopyButton text={meta} /> : null}
    </div>
  );
}

export function ColorPaletteExtractor({ onResult }: ToolProps) {
  const [palette, setPalette] = useState<Array<{ hex: string; pct: number }>>([]);
  const { file, error, onFile } = useFileImage((img) => {
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, 96, 96);
    const data = ctx.getImageData(0, 0, 96, 96).data;
    const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += 4) {
      const r = Math.round(data[i] / 24) * 24;
      const g = Math.round(data[i + 1] / 24) * 24;
      const b = Math.round(data[i + 2] / 24) * 24;
      const key = `${r},${g},${b}`;
      const entry = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      entry.count++;
      entry.r += data[i];
      entry.g += data[i + 1];
      entry.b += data[i + 2];
      buckets.set(key, entry);
    }
    const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count).slice(0, 8);
    const total = sorted.reduce((s, e) => s + e.count, 0) || 1;
    setPalette(
      sorted.map((e) => ({
        hex: "#" + [Math.round(e.r / e.count), Math.round(e.g / e.count), Math.round(e.b / e.count)].map((v) => v.toString(16).padStart(2, "0")).join(""),
        pct: Math.round((e.count / total) * 100),
      })),
    );
  });

  useEffect(() => {
    onResult?.({
      text: palette.map((p) => `${p.hex} — ${p.pct}%`).join("\n"),
      ext: "txt",
    });
  }, [palette, onResult]);

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] px-6 py-8 text-center hover:border-cyan-500/40">
        <span className="text-2xl">🎨</span>
        <span className="text-sm text-slate-300">{file ? file.name : "Choose an image to extract its palette"}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </label>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {palette.length ? (
        <div className="flex flex-wrap gap-3">
          {palette.map((p) => (
            <Panel key={p.hex} className="w-28 overflow-hidden">
              <div className="h-20" style={{ background: p.hex }} />
              <div className="flex items-center justify-between px-2.5 py-2">
                <code className="font-mono text-xs text-slate-300">{p.hex}</code>
                <span className="text-[10px] text-slate-500">{p.pct}%</span>
              </div>
            </Panel>
          ))}
        </div>
      ) : null}
      {palette.length ? <CopyButton text={palette.map((p) => p.hex).join(", ")} label="Copy palette" /> : null}
    </div>
  );
}

/* ============ SEO ============ */

export function MetaTagPreview({ onResult }: ToolProps) {
  const [title, setTitle] = useState("OmniKit Tools — 750 Free Online Tools, 100% On-Device");
  const [description, setDescription] = useState("Every tool runs entirely in your browser: WebAssembly speed, zero uploads, zero data retention. JSON, PDF, image, SEO, finance and more.");
  const [url, setUrl] = useState("https://omnikit.tools/tools/json-formatter");

  const titleLen = title.length;
  const descLen = description.length;

  useEffect(() => {
    onResult?.({
      text: `<title>${title}</title>\n<meta name="description" content="${description}" />\n<link rel="canonical" href="${url}" />\n\nTitle: ${titleLen}/60 chars\nDescription: ${descLen}/160 chars`,
      ext: "txt",
    });
  }, [title, description, url, titleLen, descLen, onResult]);

  return (
    <div className="space-y-4">
      <Field label="Meta title" hint={`${titleLen}/60`}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className={titleLen > 60 ? "border-rose-500/50" : ""} />
      </Field>
      <Field label="Meta description" hint={`${descLen}/160`}>
        <TextArea value={description} onChange={(e) => setDescription(e.target.value)} className={descLen > 160 ? "min-h-[80px] border-rose-500/50" : "min-h-[80px]"} />
      </Field>
      <Field label="URL"><Input value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono" /></Field>
      <div className="space-y-1 rounded-2xl border border-white/10 bg-[#0d1424] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Google SERP preview</p>
        <p className="truncate text-xs text-emerald-400">{url}</p>
        <p className="truncate text-lg text-sky-400">{title}</p>
        <p className="text-sm leading-snug text-slate-300 line-clamp-2">{description}</p>
      </div>
      <CopyButton text={`<title>${title}</title>\n<meta name="description" content="${description}" />\n<link rel="canonical" href="${url}" />`} label="Copy HTML" />
    </div>
  );
}

export function KeywordDensity({ onResult }: ToolProps) {
  const [text, setText] = useState("OmniKit Tools offers a JSON formatter, JSON validator and JSON to CSV converter. Each JSON tool runs entirely on-device with zero data retention and full offline support.");
  const [top, setTop] = useState(15);

  const rows = useMemo(() => {
    const words = (text.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) ?? []).filter((w) => w.length > 2);
    const total = words.length || 1;
    const counts = new Map<string, number>();
    for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.min(top, 40))
      .map(([word, count]) => ({ word, count, pct: (count / total) * 100 }));
  }, [text, top]);

  useEffect(() => {
    onResult?.({
      text: rows.map((r) => `${r.word}: ${r.count} (${r.pct.toFixed(2)}%)`).join("\n"),
      ext: "txt",
    });
  }, [rows, onResult]);

  return (
    <div className="space-y-4">
      <TextArea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[120px]" />
      <Field label="Show top N keywords"><Input type="number" min={5} max={40} value={top} onChange={(e) => setTop(Number(e.target.value))} className="w-28" /></Field>
      <Panel className="p-4">
        {rows.map((r) => (
          <div key={r.word} className="mb-2 flex items-center gap-3">
            <span className="w-36 truncate font-mono text-xs text-slate-300">{r.word}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${Math.min(100, r.pct * 8)}%` }} />
            </div>
            <span className="w-24 text-right font-mono text-xs text-slate-500">{r.count} · {r.pct.toFixed(1)}%</span>
          </div>
        ))}
        {rows.length === 0 ? <p className="text-sm text-slate-500">Enter some text to analyze keyword density.</p> : null}
      </Panel>
    </div>
  );
}

export function RobotsTxtGenerator({ onResult }: ToolProps) {
  const [agents, setAgents] = useState("*");
  const [allow, setAllow] = useState("/");
  const [disallow, setDisallow] = useState("/api/ /draft-*");
  const [sitemap, setSitemap] = useState("https://omnikit.tools/sitemap.xml");

  const output = useMemo(() => {
    const lines = [`User-agent: ${agents}`];
    for (const path of allow.split(/\s+/).filter(Boolean)) lines.push(`Allow: ${path}`);
    for (const path of disallow.split(/\s+/).filter(Boolean)) lines.push(`Disallow: ${path}`);
    if (sitemap.trim()) lines.push("", `Sitemap: ${sitemap.trim()}`);
    return lines.join("\n");
  }, [agents, allow, disallow, sitemap]);

  useEffect(() => {
    onResult?.({ text: output, ext: "txt" });
  }, [output, onResult]);

  return (
    <div className="space-y-4">
      <Field label="User-agent"><Input value={agents} onChange={(e) => setAgents(e.target.value)} className="font-mono" /></Field>
      <Field label="Allow (space-separated)"><Input value={allow} onChange={(e) => setAllow(e.target.value)} className="font-mono" /></Field>
      <Field label="Disallow (space-separated)"><Input value={disallow} onChange={(e) => setDisallow(e.target.value)} className="font-mono" /></Field>
      <Field label="Sitemap URL"><Input value={sitemap} onChange={(e) => setSitemap(e.target.value)} className="font-mono" /></Field>
      <OutputPanel value={output} />
      <CopyButton text={output} label="Copy robots.txt" />
    </div>
  );
}

/* ============ NETWORK ============ */

export function IpLookup({ onResult }: ToolProps) {
  const [data, setData] = useState("");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ip")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("API unavailable"))))
      .then((json) => {
        if (cancelled) return;
        setData(JSON.stringify(json, null, 2));
        setStatus("ok");
      })
      .catch(() => {
        if (cancelled) return;
        setData("IP lookup requires connectivity. Offline mode: this tool only reads your device's network headers via the local API.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onResult?.({ text: data, ext: "txt" });
  }, [data, onResult]);

  return (
    <div className="space-y-4">
      {status === "loading" ? <p className="text-sm text-slate-400">Resolving your connection headers…</p> : null}
      {status === "error" ? <p className="text-sm text-amber-300">{data}</p> : status === "ok" ? <OutputPanel value={data} /> : null}
      {status === "ok" ? <CopyButton text={data} /> : null}
    </div>
  );
}

export function UserAgentParser({ onResult }: ToolProps) {
  const [output, setOutput] = useState("");

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent;
    const browser = /Edg\//.test(ua) ? "Microsoft Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Unknown browser";
    const os = /Windows NT/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "Unknown OS";
    const device = /Mobi/.test(ua) ? "Mobile" : /Tablet|iPad/.test(ua) ? "Tablet" : "Desktop";
    const cores = navigator.hardwareConcurrency ?? "unknown";
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const lines = [
      `Browser: ${browser}`,
      `Engine: ${/Firefox/.test(ua) ? "Gecko" : /Safari/.test(ua) && !/Chrome/.test(ua) ? "WebKit" : "Blink/WebKit"}`,
      `Operating system: ${os}`,
      `Device class: ${device}`,
      `Platform: ${navigator.platform}`,
      `Language: ${navigator.language}`,
      `CPU cores: ${cores}`,
      `Device memory: ${memory ? memory + " GB" : "not exposed"}`,
      `Cookies enabled: ${navigator.cookieEnabled}`,
      `Do Not Track: ${navigator.doNotTrack === "1" ? "enabled" : "not set"}`,
      ``,
      `Raw UA:\n${ua}`,
    ];
    setOutput(lines.join("\n"));
  }, []);

  useEffect(() => {
    onResult?.({ text: output, ext: "txt" });
  }, [output, onResult]);

  return <OutputPanel value={output} placeholder="Reading your browser fingerprint…" />;
}

const STATUS_CODES: Record<string, string> = {
  "200": "OK — the request succeeded",
  "201": "Created — a new resource was created",
  "202": "Accepted — request accepted for processing",
  "204": "No Content — success with no response body",
  "301": "Moved Permanently — permanent redirect",
  "302": "Found — temporary redirect",
  "304": "Not Modified — use cached copy",
  "307": "Temporary Redirect",
  "308": "Permanent Redirect",
  "400": "Bad Request — malformed request syntax",
  "401": "Unauthorized — authentication required",
  "403": "Forbidden — server refuses to authorize",
  "404": "Not Found — resource does not exist",
  "405": "Method Not Allowed",
  "408": "Request Timeout",
  "409": "Conflict — request conflicts with state",
  "410": "Gone — permanently removed",
  "413": "Payload Too Large",
  "414": "URI Too Long",
  "415": "Unsupported Media Type",
  "418": "I'm a teapot (RFC 2324)",
  "422": "Unprocessable Entity",
  "429": "Too Many Requests — rate limited",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout",
};

export function HttpStatusChecker({ onResult }: ToolProps) {
  const [code, setCode] = useState("404");
  const found = STATUS_CODES[code];

  useEffect(() => {
    onResult?.({
      text: found ? `HTTP ${code} — ${found}` : `HTTP ${code} is not a registered status code. Try 200, 404, 429, 500…`,
      ext: "txt",
    });
  }, [code, found, onResult]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 3))} className="w-32 text-center font-mono text-lg" placeholder="404" />
        <Button variant="soft" onClick={() => setCode(String(Math.floor(Math.random() * 60) + 200))}>Random</Button>
      </div>
      {found ? (
        <Panel className={`p-4 ${code.startsWith("2") ? "border-emerald-500/30 bg-emerald-500/10" : code.startsWith("3") ? "border-sky-500/30 bg-sky-500/10" : code.startsWith("4") ? "border-amber-500/30 bg-amber-500/10" : "border-rose-500/30 bg-rose-500/10"}`}>
          <p className="font-mono text-lg font-bold text-slate-100">HTTP {code}</p>
          <p className="mt-1 text-sm text-slate-300">{found}</p>
        </Panel>
      ) : null}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {Object.entries(STATUS_CODES).slice(0, 18).map(([c, label]) => (
          <button key={c} onClick={() => setCode(c)} className={`rounded-lg border px-2.5 py-1.5 text-left font-mono text-xs transition-colors ${code === c ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/20"}`}>
            {c} <span className="text-slate-600">{label.split(" — ")[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function UrlParser({ onResult }: ToolProps) {
  const [url, setUrl] = useState("https://user:pass@omnikit.tools:443/tools/json-formatter?lang=en&theme=dark#faq");
  const parsed = useMemo(() => {
    try {
      const u = new URL(url);
      const params = Array.from(u.searchParams.entries());
      return [
        `Protocol: ${u.protocol}`,
        `Host: ${u.hostname}`,
        `Port: ${u.port || "default"}`,
        `Pathname: ${u.pathname}`,
        `Search: ${u.search || "(none)"}`,
        `Hash: ${u.hash || "(none)"}`,
        `Username: ${u.username || "(none)"}`,
        ``,
        `Query parameters (${params.length}):`,
        ...(params.length ? params.map(([k, v]) => `  ${k} = ${v}`) : ["  (none)"]),
      ].join("\n");
    } catch {
      return `Invalid URL: ${url}`;
    }
  }, [url]);

  useEffect(() => {
    onResult?.({ text: parsed, ext: "txt" });
  }, [parsed, onResult]);

  return (
    <div className="space-y-4">
      <Field label="URL"><Input value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono" /></Field>
      <OutputPanel value={parsed} />
      <CopyButton text={parsed} />
    </div>
  );
}

/* ============ CSS ============ */

export function GradientGenerator({ onResult }: ToolProps) {
  const [angle, setAngle] = useState(135);
  const [c1, setC1] = useState("#06b6d4");
  const [c2, setC2] = useState("#3b82f6");
  const [c3, setC3] = useState("#8b5cf6");
  const [type, setType] = useState<"linear" | "radial">("linear");

  const css = useMemo(
    () => type === "linear" ? `background: linear-gradient(${angle}deg, ${c1}, ${c2} 55%, ${c3});` : `background: radial-gradient(circle at 30% 30%, ${c1}, ${c2} 55%, ${c3});`,
    [angle, c1, c2, c3, type],
  );

  useEffect(() => {
    onResult?.({ text: css, ext: "txt" });
  }, [css, onResult]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button variant={type === "linear" ? "primary" : "ghost"} onClick={() => setType("linear")}>Linear</Button>
          <Button variant={type === "radial" ? "primary" : "ghost"} onClick={() => setType("radial")}>Radial</Button>
        </div>
        {type === "linear" ? (
          <div>
            <p className="mb-2 flex justify-between text-xs font-medium text-slate-400"><span>Angle</span><span className="font-mono text-cyan-300">{angle}°</span></p>
            <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400" />
          </div>
        ) : null}
        <div className="space-y-3">
          {[c1, c2, c3].map((c, i) => (
            <Field key={i} label={`Color stop ${i + 1}`}>
              <div className="flex items-center gap-2">
                <input type="color" value={c} onChange={(e) => [setC1, setC2, setC3][i](e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
                <Input value={c} onChange={(e) => [setC1, setC2, setC3][i](e.target.value)} className="font-mono" />
              </div>
            </Field>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-52 rounded-2xl border border-white/10" style={{ background: type === "linear" ? `linear-gradient(${angle}deg, ${c1}, ${c2} 55%, ${c3})` : `radial-gradient(circle at 30% 30%, ${c1}, ${c2} 55%, ${c3})` }} />
        <OutputPanel value={css} />
        <CopyButton text={css} label="Copy CSS" />
      </div>
    </div>
  );
}

export function BoxShadowGenerator({ onResult }: ToolProps) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(12);
  const [blur, setBlur] = useState(32);
  const [spread, setSpread] = useState(-4);
  const [color, setColor] = useState("#06b6d4");
  const [opacity, setOpacity] = useState(35);
  const [inset, setInset] = useState(false);

  const css = useMemo(() => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `box-shadow: ${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px rgba(${r}, ${g}, ${b}, ${opacity / 100});`;
  }, [x, y, blur, spread, color, opacity, inset]);

  useEffect(() => {
    onResult?.({ text: css, ext: "txt" });
  }, [css, onResult]);

  const sliders: Array<[string, number, (v: number) => void, number, number]> = [
    ["Offset X", x, setX, -80, 80],
    ["Offset Y", y, setY, -80, 80],
    ["Blur", blur, setBlur, 0, 120],
    ["Spread", spread, setSpread, -60, 60],
    ["Opacity %", opacity, setOpacity, 0, 100],
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        {sliders.map(([label, value, set, min, max]) => (
          <div key={label}>
            <p className="mb-2 flex justify-between text-xs font-medium text-slate-400"><span>{label}</span><span className="font-mono text-cyan-300">{value}</span></p>
            <input type="range" min={min} max={max} value={value} onChange={(e) => set(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400" />
          </div>
        ))}
        <div className="flex items-center gap-3">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
          <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={inset} onChange={(e) => setInset(e.target.checked)} className="accent-cyan-400" /> Inset</label>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex h-52 items-center justify-center rounded-2xl border border-white/10 bg-[#0d1424]">
          <div className="h-24 w-40 rounded-xl bg-cyan-400/20" style={{ boxShadow: `${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px ${color}${Math.round(opacity * 2.55).toString(16).padStart(2, "0")}` }} />
        </div>
        <OutputPanel value={css} />
        <CopyButton text={css} label="Copy CSS" />
      </div>
    </div>
  );
}

export function BorderRadiusGenerator({ onResult }: ToolProps) {
  const [tl, setTl] = useState(24);
  const [tr, setTr] = useState(24);
  const [br, setBr] = useState(12);
  const [bl, setBl] = useState(12);

  const css = useMemo(() => {
    if (tl === tr && tr === br && br === bl) return `border-radius: ${tl}px;`;
    return `border-radius: ${tl}px ${tr}px ${br}px ${bl}px;`;
  }, [tl, tr, br, bl]);

  useEffect(() => {
    onResult?.({ text: css, ext: "txt" });
  }, [css, onResult]);

  const corners: Array<[string, number, (v: number) => void]> = [
    ["Top-left", tl, setTl],
    ["Top-right", tr, setTr],
    ["Bottom-right", br, setBr],
    ["Bottom-left", bl, setBl],
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="grid grid-cols-2 gap-4">
        {corners.map(([label, value, set]) => (
          <div key={label}>
            <p className="mb-2 flex justify-between text-xs font-medium text-slate-400"><span>{label}</span><span className="font-mono text-cyan-300">{value}px</span></p>
            <input type="range" min={0} max={120} value={value} onChange={(e) => set(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400" />
          </div>
        ))}
        <Button variant="soft" onClick={() => { setTl(12); setTr(12); setBr(12); setBl(12); }}>Reset 12px</Button>
        <Button variant="soft" onClick={() => { setTl(999); setTr(999); setBr(999); setBl(999); }}>Pill</Button>
      </div>
      <div className="space-y-3">
        <div className="flex h-52 items-center justify-center rounded-2xl border border-white/10 bg-[#0d1424]">
          <div className="h-28 w-44 border-2 border-cyan-400/60 bg-cyan-400/10" style={{ borderRadius: `${tl}px ${tr}px ${br}px ${bl}px` }} />
        </div>
        <OutputPanel value={css} />
        <CopyButton text={css} label="Copy CSS" />
      </div>
    </div>
  );
}
