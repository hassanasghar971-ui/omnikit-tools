"use client";

import { useState, type ReactNode } from "react";
import { Button, Field, Input, TextArea } from "@/components/ui";
import { FOUNDER } from "@/lib/utils";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">OmniKit Tools</p>
      <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
      <p className="mt-2 text-xs text-slate-500">Last updated: {updated}</p>
      <div className="legal-prose mt-8 space-y-6 text-sm leading-relaxed text-slate-400">{children}</div>
    </main>
  );
}

export function H({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-bold text-white">{children}</h2>;
}

export function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — hidden from humans
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; note?: string };
      if (json.ok) {
        setState("sent");
        setMessage("");
      } else {
        setState("error");
        setError(json.error ?? "Submission failed.");
      }
    } catch {
      setState("error");
      setError("Network error — please try again.");
    }
  };

  if (state === "sent") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-300">✓ Message received</p>
        <p className="mt-1 text-sm text-slate-400">
          Thank you, {name || "friend"}. Hassan will reply to {email || "your email"} shortly.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Need an instant answer? Email{" "}
          <a className="text-cyan-300 hover:underline" href={`mailto:${FOUNDER.email}`}>{FOUNDER.email}</a>{" "}
          or WhatsApp {FOUNDER.phone1}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name"><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
      </div>
      <Field label="Subject"><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Partnership, bug report, idea…" /></Field>
      <Field label="Message"><TextArea value={message} onChange={(e) => setMessage(e.target.value)} required className="min-h-[140px]" /></Field>
      {/* Honeypot — real users never see or fill this */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>
      {state === "error" ? <p className="text-sm text-rose-300">{error}</p> : null}
      <Button type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send message →"}</Button>
    </form>
  );
}

export const FOUNDER_LINE = `${FOUNDER.name} · ${FOUNDER.email} · ${FOUNDER.phone1} · ${FOUNDER.phone2}`;
