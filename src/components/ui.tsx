"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { copyText } from "@/lib/utils";

/* ---------- primitives ---------- */

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "soft" | "danger" }) {
  const styles = {
    primary:
      "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_24px_-6px_rgba(6,182,212,0.55)]",
    ghost: "bg-white/5 text-slate-200 hover:bg-white/10 border border-white/10",
    soft: "bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/20",
    danger: "bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="soft"
      className={className}
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }
      }}
    >
      {copied ? "✓ Copied" : label}
    </Button>
  );
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      spellCheck={false}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-[#0d1424] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-colors focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20",
        "font-mono leading-relaxed resize-y min-h-[140px]",
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-white/10 bg-[#0d1424] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-colors focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20",
        className,
      )}
      {...props}
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
        {hint ? <span className="font-normal normal-case tracking-normal text-slate-500">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export function RangeInput({ label, value, onChange, min, max, step = 1 }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-medium text-slate-400">
        <span>{label}</span>
        <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-cyan-300">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400"
      />
    </label>
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full appearance-none rounded-lg border border-white/10 bg-[#0d1424] px-3 py-2 text-sm text-slate-200 outline-none transition-colors focus:border-cyan-500/50",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({ children, tone = "cyan", className }: { children: ReactNode; tone?: "cyan" | "green" | "amber" | "rose" | "slate"; className?: string }) {
  const tones = {
    cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25",
    green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    rose: "bg-rose-500/10 text-rose-300 border-rose-500/25",
    slate: "bg-white/5 text-slate-300 border-white/10",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md", className)}>
      {children}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      {eyebrow ? <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">{eyebrow}</p> : null}
      <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
      {subtitle ? <p className="mt-1.5 max-w-2xl text-sm text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

export function OutputPanel({ value, placeholder = "Output appears here…" }: { value: string; placeholder?: string }) {
  return (
    <pre className="max-h-96 min-h-[120px] w-full overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-[#0d1424] px-4 py-3 font-mono text-sm leading-relaxed text-slate-200">
      {value || <span className="text-slate-600">{placeholder}</span>}
    </pre>
  );
}
