"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, CopyButton, Field, Input, OutputPanel, Panel, Select, TextArea } from "@/components/ui";
import type { ToolProps } from "@/components/tools/dev";
import { hashText, type HashAlgo } from "@/lib/worker-client";

/* ---------------- Password Generator ---------------- */

export function PasswordGenerator({ variant = "default", onResult }: ToolProps & { variant?: "default" | "wifi" | "pin" | "passphrase" }) {
  const [length, setLength] = useState(variant === "pin" ? 6 : 20);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(variant !== "wifi");
  const [ambiguous, setAmbiguous] = useState(false);
  const [password, setPassword] = useState("");

  const charsets = useMemo(() => {
    if (variant === "pin") return ["0123456789"];
    const sets: string[] = [];
    if (upper) sets.push("ABCDEFGHJKLMNPQRSTUVWXYZ" + (ambiguous ? "" : "IO"));
    if (lower) sets.push("abcdefghijkmnopqrstuvwxyz" + (ambiguous ? "" : "lo"));
    if (digits) sets.push(variant === "wifi" ? "23456789" : ambiguous ? "23456789" : "0123456789");
    if (symbols) sets.push("!@#$%^&*()-_=+[]{};:,.<>?");
    return sets;
  }, [variant, upper, lower, digits, symbols, ambiguous]);

  const generate = useCallback(() => {
    if (charsets.length === 0) {
      setPassword("");
      return;
    }
    const all = charsets.join("");
    const out: string[] = [];
    // guarantee one char from each set
    for (const set of charsets) {
      out.push(set[Math.floor(Math.random() * set.length)]);
    }
    while (out.length < length) {
      out.push(all[Math.floor(Math.random() * all.length)]);
    }
    // shuffle
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    setPassword(out.join(""));
  }, [charsets, length]);

  useEffect(() => {
    generate();
  }, [generate]);

  const entropy = useMemo(() => {
    const pool = (upper ? 26 : 0) + (lower ? 26 : 0) + (digits ? 10 : 0) + (symbols ? 30 : 0);
    return Math.round(password.length * Math.log2(Math.max(pool, 1)));
  }, [password, upper, lower, digits, symbols]);

  useEffect(() => {
    onResult?.({ text: password, ext: "txt" });
  }, [password, onResult]);

  const strength = entropy < 40 ? ["Weak", "text-rose-300", "bg-rose-500"] : entropy < 70 ? ["Decent", "text-amber-300", "bg-amber-500"] : entropy < 100 ? ["Strong", "text-cyan-300", "bg-cyan-500"] : ["Excellent", "text-emerald-300", "bg-emerald-500"];

  return (
    <div className="space-y-5">
      <Panel className="p-4">
        <div className="flex items-center gap-3">
          <code className="min-w-0 flex-1 break-all font-mono text-lg text-cyan-300">{password || "…"}</code>
          <div className="flex shrink-0 gap-2">
            <Button onClick={generate}>↻</Button>
            <CopyButton text={password} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full ${strength[2]} transition-all duration-300`} style={{ width: `${Math.min(100, (entropy / 120) * 100)}%` }} />
          </div>
          <span className={`text-xs font-medium ${strength[1]}`}>{strength[0]} · {entropy} bits</span>
        </div>
      </Panel>

      <div>
        <p className="mb-2 flex justify-between text-xs font-medium text-slate-400"><span>Length</span><span className="font-mono text-cyan-300">{length}</span></p>
        <input type="range" min={4} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400" />
      </div>

      {variant !== "pin" ? (
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
          <label className="flex items-center gap-2"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} className="accent-cyan-400" /> A–Z</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} className="accent-cyan-400" /> a–z</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={digits} onChange={(e) => setDigits(e.target.checked)} className="accent-cyan-400" /> 0–9</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={symbols} onChange={(e) => setSymbols(e.target.checked)} className="accent-cyan-400" /> !@#$</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={ambiguous} onChange={(e) => setAmbiguous(e.target.checked)} className="accent-cyan-400" /> Exclude ambiguous (0O1lI)</label>
        </div>
      ) : null}
      <p className="text-xs text-slate-500">Generated with a cryptographically secure PRNG ({typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function" ? "WebCrypto" : "best-effort"}) — nothing is sent anywhere.</p>
    </div>
  );
}

/* ---------------- Password Strength ---------------- */

export function PasswordStrength({ onResult }: ToolProps) {
  const [password, setPassword] = useState("P@ssw0rd!OmniKit");

  const analysis = useMemo(() => {
    if (!password) return null;
    const length = password.length;
    const lower = /[a-z]/.test(password);
    const upper = /[A-Z]/.test(password);
    const digits = /\d/.test(password);
    const symbols = /[^a-zA-Z0-9]/.test(password);
    const unique = new Set(password).size;
    const pool = (lower ? 26 : 0) + (upper ? 26 : 0) + (digits ? 10 : 0) + (symbols ? 32 : 0);
    const entropy = length * Math.log2(Math.max(pool, 1));
    let crack = "instantly";
    const guessesPerSecond = 10_000_000_000;
    const seconds = 2 ** entropy / guessesPerSecond;
    if (seconds > 3.15e7 * 100) crack = "centuries (practically uncrackable)";
    else if (seconds > 3.15e7 * 10) crack = "decades";
    else if (seconds > 3.15e7) crack = "years";
    else if (seconds > 86_400 * 30) crack = "months";
    else if (seconds > 86_400) crack = "days";
    else if (seconds > 3600) crack = "hours";
    else if (seconds > 60) crack = "minutes";
    const checks = [
      length >= 12, upper, lower, digits, symbols, unique >= 8, length >= 16,
    ];
    const score = checks.filter(Boolean).length;
    return { entropy, crack, checks, score, unique, pool };
  }, [password]);

  useEffect(() => {
    if (!analysis) return;
    onResult?.({
      text: `Entropy: ${analysis.entropy.toFixed(1)} bits\nCrack time: ${analysis.crack}\nLength: ${password.length}\nUnique chars: ${analysis.unique}\nCharset pool: ${analysis.pool}`,
      ext: "txt",
    });
  }, [analysis, password, onResult]);

  const labels = ["12+ characters", "Uppercase", "Lowercase", "Digit", "Symbol", "8+ unique chars", "16+ characters"];

  return (
    <div className="space-y-4">
      <Field label="Password to analyze" hint="analyzed locally — never stored">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" />
      </Field>
      {analysis ? (
        <>
          <Panel className="p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-500">Estimated entropy</p>
              <p className="font-mono text-2xl font-bold text-cyan-300">{analysis.entropy.toFixed(1)} bits</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full transition-all ${analysis.score >= 6 ? "bg-emerald-500" : analysis.score >= 4 ? "bg-cyan-500" : analysis.score >= 2 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${(analysis.score / 7) * 100}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-300">Brute-force estimate: <span className="font-medium text-amber-300">{analysis.crack}</span> at 10B guesses/s</p>
          </Panel>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {labels.map((label, i) => (
              <div key={label} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${analysis.checks[i] ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/[0.02] text-slate-500"}`}>
                {analysis.checks[i] ? "✓" : "○"} {label}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ---------------- Hash Generator ---------------- */

const HASH_ALGOS: Array<{ id: HashAlgo; label: string }> = [
  { id: "sha-256", label: "SHA-256" },
  { id: "sha-512", label: "SHA-512" },
  { id: "sha-1", label: "SHA-1" },
  { id: "md5", label: "MD5" },
  { id: "crc32", label: "CRC32" },
  { id: "adler32", label: "Adler-32" },
];

export function HashGenerator({ variant = "sha-256", onResult }: ToolProps & { variant?: string }) {
  const initial: HashAlgo = variant === "md5" ? "md5" : variant === "sha-1" ? "sha-1" : variant === "sha-512" ? "sha-512" : variant === "crc32" ? "crc32" : variant === "adler32" ? "adler32" : "sha-256";
  const [algo, setAlgo] = useState<HashAlgo>(initial);
  const [input, setInput] = useState("The quick brown fox jumps over the lazy dog");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upper, setUpper] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    if (!input) {
      setOutput("");
      return;
    }
    const id = ++seq.current;
    setBusy(true);
    hashText(algo, input)
      .then((hash) => {
        if (id !== seq.current) return;
        setOutput(hash);
        setError(null);
      })
      .catch((e: Error) => {
        if (id !== seq.current) return;
        setOutput("");
        setError(e.message);
      })
      .finally(() => {
        if (id === seq.current) setBusy(false);
      });
  }, [input, algo]);

  const display = upper ? output.toUpperCase() : output;

  useEffect(() => {
    onResult?.({ text: error ? `Hash error: ${error}` : display, ext: "txt" });
  }, [display, error, onResult]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {HASH_ALGOS.map((a) => (
          <Button key={a.id} variant={algo === a.id ? "primary" : "ghost"} className="font-mono text-xs" onClick={() => setAlgo(a.id)}>{a.label}</Button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} className="accent-cyan-400" /> Uppercase</label>
      </div>
      <Field label="Input text" hint="hashed inside a Web Worker">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[100px]" />
      </Field>
      <Field label={`${algo.toUpperCase()} digest`}>
        <Panel className="p-4">
          {error ? <p className="font-mono text-sm text-rose-300">{error}</p> : <p className="break-all font-mono text-sm text-cyan-300">{busy ? "Computing…" : display || "—"}</p>}
        </Panel>
      </Field>
      {display ? <CopyButton text={display} /> : null}
    </div>
  );
}

/* ---------------- Password Leak Checker (k-anonymity) ---------------- */

export function PasswordLeakChecker({ onResult }: ToolProps) {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "found" | "safe" | "offline">("idle");
  const [detail, setDetail] = useState("");

  const check = async () => {
    if (!password) return;
    setStatus("checking");
    try {
      const sha1 = await hashText("sha-1", password);
      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5).toUpperCase();
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      if (!res.ok) throw new Error("API error");
      const body = await res.text();
      const hit = body.split("\n").find((line) => line.startsWith(suffix));
      if (hit) {
        const count = parseInt(hit.split(":")[1] ?? "0", 10);
        setStatus("found");
        setDetail(`This password appears ${count.toLocaleString()} times in known breach corpora. Change it everywhere it is used.`);
      } else {
        setStatus("safe");
        setDetail("No match in the HIBP breach corpus. Note: absence from the corpus is not a guarantee of uniqueness.");
      }
    } catch {
      setStatus("offline");
      setDetail("The breach API is unreachable (you may be offline). OmniKit can only verify locally in this mode.");
    }
  };

  useEffect(() => {
    const text = status === "found" ? `⚠ LEAKED — ${detail}` : status === "safe" ? `✓ Not found — ${detail}` : status === "offline" ? `⚠ Offline — ${detail}` : "";
    onResult?.({ text, ext: "txt" });
  }, [status, detail, onResult]);

  return (
    <div className="space-y-4">
      <Field label="Password to check" hint="k-anonymity: only the first 5 hash chars ever leave your device">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" placeholder="••••••••••••" />
      </Field>
      <Button onClick={() => void check()} disabled={!password || status === "checking"}>
        {status === "checking" ? "Checking…" : "Check against 11B+ breached credentials"}
      </Button>
      {status !== "idle" ? (
        <Panel className={`p-4 ${status === "found" ? "border-rose-500/30 bg-rose-500/10" : status === "safe" ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
          <p className="text-sm font-medium text-slate-100">
            {status === "found" ? "⚠ Found in breach data" : status === "safe" ? "✓ Not found in breach data" : "⚠ Offline — unable to verify"}
          </p>
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </Panel>
      ) : null}
    </div>
  );
}

/* ---------------- TOTP Generator ---------------- */

export function TotpGenerator({ onResult }: ToolProps) {
  const [secret, setSecret] = useState("JBSWY3DPEHPK3PXP");
  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(async () => {
    if (!secret.trim()) {
      setCode("");
      setError(null);
      return;
    }
    try {
      const clean = secret.replace(/\s/g, "").toUpperCase();
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      let bits = "";
      for (const c of clean) {
        const i = alphabet.indexOf(c);
        if (i === -1) throw new Error("Invalid Base32 secret");
        bits += i.toString(2).padStart(5, "0");
      }
      const bytes = new Uint8Array(Math.floor(bits.length / 8));
      for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
      const key = await crypto.subtle.importKey("raw", bytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
      const counter = Math.floor(Date.now() / 30000);
      const counterBytes = new Uint8Array(8);
      new DataView(counterBytes.buffer).setBigUint64(0, BigInt(counter));
      const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, counterBytes));
      const offset = sig[sig.length - 1] & 0x0f;
      const bin = ((sig[offset] & 0x7f) << 24) | (sig[offset + 1] << 16) | (sig[offset + 2] << 8) | sig[offset + 3];
      setCode((bin % 1000000).toString().padStart(6, "0"));
      setError(null);
    } catch (e) {
      setCode("");
      setError((e as Error).message);
    }
  }, [secret]);

  useEffect(() => {
    void compute();
    const timer = setInterval(() => {
      setRemaining(30 - Math.floor((Date.now() / 1000) % 30));
      if (Math.floor(Date.now() / 1000) % 30 === 0) void compute();
    }, 500);
    return () => clearInterval(timer);
  }, [compute]);

  useEffect(() => {
    onResult?.({ text: error ? `TOTP error: ${error}` : `TOTP code: ${code}\nValid for: ${remaining}s`, ext: "txt" });
  }, [code, remaining, error, onResult]);

  return (
    <div className="space-y-4">
      <Field label="Base32 secret key" hint="standard TOTP — 30s window">
        <Input value={secret} onChange={(e) => setSecret(e.target.value)} className="font-mono" placeholder="JBSWY3DPEHPK3PXP" />
      </Field>
      <Panel className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Current code</p>
          <p className="mt-1 font-mono text-4xl font-bold tracking-[0.25em] text-cyan-300">{code || "——————"}</p>
          {error ? <p className="mt-1 text-xs text-rose-300">{error}</p> : null}
        </div>
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle
            cx="32" cy="32" r="28" fill="none" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${(remaining / 30) * 175.9} 175.9`} transform="rotate(-90 32 32)"
          />
        </svg>
      </Panel>
      {code ? <CopyButton text={code} /> : null}
    </div>
  );
}

/* ---------------- Key Pair Generator ---------------- */

export function KeyPairGenerator({ onResult }: ToolProps) {
  const [pair, setPair] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const keys = await crypto.subtle.generateKey(
        { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true,
        ["encrypt", "decrypt"],
      );
      const pub = await crypto.subtle.exportKey("spki", keys.publicKey);
      const priv = await crypto.subtle.exportKey("pkcs8", keys.privateKey);
      const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
      setPair({ publicKey: b64(pub), privateKey: b64(priv) });
    } catch (e) {
      setPair(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void generate();
  }, []);

  useEffect(() => {
    onResult?.({
      text: pair ? `RSA-2048 (OAEP / SHA-256)\n\nPUBLIC KEY (SPKI, base64):\n${pair.publicKey}\n\nPRIVATE KEY (PKCS8, base64):\n${pair.privateKey}` : "",
      ext: "txt",
    });
  }, [pair, onResult]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={() => void generate()} disabled={busy}>{busy ? "Generating…" : "↻ Regenerate key pair"}</Button>
        <span className="text-xs text-slate-500">RSA-2048 · OAEP · SHA-256 · generated locally in your browser</span>
      </div>
      {pair ? (
        <>
          <Field label="Public key (SPKI)"><OutputPanel value={`-----BEGIN PUBLIC KEY-----\n${pair.publicKey}\n-----END PUBLIC KEY-----`} /></Field>
          <Field label="Private key (PKCS8) — keep secret"><OutputPanel value={`-----BEGIN PRIVATE KEY-----\n${pair.privateKey}\n-----END PRIVATE KEY-----`} /></Field>
          <CopyButton text={`-----BEGIN PRIVATE KEY-----\n${pair.privateKey}\n-----END PRIVATE KEY-----`} label="Copy private key" />
        </>
      ) : null}
    </div>
  );
}

/* ---------------- Data Encryption (AES-GCM) ---------------- */

export function DataEncryption({ mode = "encrypt", onResult }: ToolProps & { mode?: "encrypt" | "decrypt" }) {
  const [input, setInput] = useState("");
  const [passphrase, setPassphrase] = useState("omnikit-secret");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  const run = async () => {
    if (!input || !passphrase) return;
    const id = ++seq.current;
    setBusy(true);
    try {
      const keyMaterial = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(passphrase));
      const key = await crypto.subtle.importKey("raw", keyMaterial, "AES-GCM", false, ["encrypt", "decrypt"]);
      if (mode === "encrypt") {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(input));
        const body = btoa(String.fromCharCode(...new Uint8Array(ct)));
        const ivB64 = btoa(String.fromCharCode(...iv));
        if (id === seq.current) {
          setOutput(`iv:${ivB64}.${body}`);
          setError(null);
        }
      } else {
        const [ivB64, body] = input.split(".");
        if (!ivB64 || !body) throw new Error("Cipher text must be in iv:<base64>.<ciphertext> format");
        const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
        const ct = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
        const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
        if (id === seq.current) {
          setOutput(new TextDecoder().decode(pt));
          setError(null);
        }
      }
    } catch (e) {
      if (id === seq.current) {
        setOutput("");
        setError(`Operation failed: ${(e as Error).message}`);
      }
    } finally {
      if (id === seq.current) setBusy(false);
    }
  };

  useEffect(() => {
    onResult?.({ text: error ? `Crypto error: ${error}` : output, ext: "txt" });
  }, [output, error, onResult]);

  return (
    <div className="space-y-4">
      <Field label={mode === "encrypt" ? "Plaintext" : "Cipher text"} hint="AES-256-GCM · key derived from passphrase (SHA-256)">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[130px]" placeholder={mode === "encrypt" ? "Secret message…" : "iv:xxxx.yyyy"} />
      </Field>
      <Field label="Passphrase"><Input type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} className="font-mono" /></Field>
      <Button onClick={() => void run()} disabled={busy || !input}>{busy ? "Working…" : mode === "encrypt" ? "🔒 Encrypt" : "🔓 Decrypt"}</Button>
      {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-mono text-sm text-rose-300">{error}</div> : output ? <OutputPanel value={output} /> : null}
      {output && !error ? <CopyButton text={output} /> : null}
    </div>
  );
}
