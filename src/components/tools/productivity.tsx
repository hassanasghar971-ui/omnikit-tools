"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, CopyButton, Field, Input, OutputPanel, Panel, TextArea } from "@/components/ui";
import type { ToolProps } from "@/components/tools/dev";
import { mdToHtml } from "@/lib/engine";

/* ---------------- Pomodoro Timer ---------------- */

export function PomodoroTimer({ onResult }: ToolProps) {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [phase, setPhase] = useState<"work" | "break">("work");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const total = phase === "work" ? workMin * 60 : breakMin * 60;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          beep();
          if (phase === "work") {
            setSessions((n) => n + 1);
            setPhase("break");
            return breakMin * 60;
          }
          setPhase("work");
          return workMin * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, phase, workMin, breakMin]);

  const beep = () => {
    try {
      const ac = new AudioContext();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
      osc.connect(gain).connect(ac.destination);
      // Release the AudioContext when the tone ends — browsers cap the
      // number of live contexts, so leaking them would kill audio tools.
      osc.onended = () => {
        void ac.close().catch(() => undefined);
      };
      osc.start();
      osc.stop(ac.currentTime + 0.45);
    } catch {
      /* audio unavailable */
    }
  };

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");
  const progress = 1 - secondsLeft / total;

  useEffect(() => {
    document.title = running ? `${mm}:${ss} · ${phase === "work" ? "Focus" : "Break"} — OmniKit` : "OmniKit Tools";
  }, [mm, ss, running, phase]);

  useEffect(() => {
    onResult?.({ text: `${phase === "work" ? "Focus" : "Break"} phase · ${mm}:${ss} · ${sessions} session${sessions === 1 ? "" : "s"} completed`, ext: "txt" });
  }, [mm, ss, phase, sessions, onResult]);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="relative h-56 w-56">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
          <circle cx="50" cy="50" r="45" fill="none" stroke={phase === "work" ? "#06b6d4" : "#10b981"} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${progress * 282.7} 282.7`} className="transition-all duration-500" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className={`font-mono text-4xl font-bold ${phase === "work" ? "text-cyan-300" : "text-emerald-300"}`}>{mm}:{ss}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-500">{phase === "work" ? "Focus" : "Break"}</p>
          <p className="mt-1 text-[10px] text-slate-600">{sessions} session{sessions === 1 ? "" : "s"} done</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => setRunning((r) => !r)}>{running ? "⏸ Pause" : "▶ Start"}</Button>
        <Button variant="ghost" onClick={() => { setRunning(false); setPhase("work"); setSecondsLeft(workMin * 60); }}>Reset</Button>
      </div>
      <div className="flex items-center gap-6 text-sm text-slate-400">
        <label className="flex items-center gap-2">Focus <input type="number" min={1} max={90} value={workMin} onChange={(e) => { setWorkMin(Math.max(1, Number(e.target.value) || 25)); if (!running && phase === "work") setSecondsLeft(Math.max(1, Number(e.target.value) || 25) * 60); }} className="w-16 rounded-lg border border-white/10 bg-[#0d1424] px-2 py-1 font-mono text-xs text-slate-200" /> min</label>
        <label className="flex items-center gap-2">Break <input type="number" min={1} max={30} value={breakMin} onChange={(e) => { setBreakMin(Math.max(1, Number(e.target.value) || 5)); if (!running && phase === "break") setSecondsLeft(Math.max(1, Number(e.target.value) || 5) * 60); }} className="w-16 rounded-lg border border-white/10 bg-[#0d1424] px-2 py-1 font-mono text-xs text-slate-200" /> min</label>
      </div>
    </div>
  );
}

/* ---------------- Countdown Timer ---------------- */

export function CountdownTimer({ onResult }: ToolProps) {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(30);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState<number | null>(null);

  const start = () => {
    setLeft(days * 86400 + hours * 3600 + minutes * 60 + seconds);
    setRunning(true);
  };

  useEffect(() => {
    if (!running || left === null) return;
    if (left <= 0) {
      setRunning(false);
      return;
    }
    const timer = setInterval(() => setLeft((l) => (l === null ? null : l - 1)), 1000);
    return () => clearInterval(timer);
  }, [running, left]);

  const parts = useMemo(() => {
    if (left === null) return null;
    const l = Math.max(left, 0);
    return {
      d: Math.floor(l / 86400),
      h: Math.floor((l % 86400) / 3600),
      m: Math.floor((l % 3600) / 60),
      s: l % 60,
      done: left === 0,
    };
  }, [left]);

  useEffect(() => {
    onResult?.({
      text: parts ? (parts.done ? "⏰ Time's up!" : `Countdown: ${parts.d}d ${parts.h}h ${parts.m}m ${parts.s}s remaining`) : "Set a duration and press start.",
      ext: "txt",
    });
  }, [parts, onResult]);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {!running ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([["Days", days, setDays], ["Hours", hours, setHours], ["Minutes", minutes, setMinutes], ["Seconds", seconds, setSeconds]] as const).map(([label, value, set]) => (
            <Field key={label} label={label}>
              <Input type="number" min={0} value={value} onChange={(e) => set(Math.max(0, Number(e.target.value)))} className="w-24 text-center font-mono text-lg" />
            </Field>
          ))}
        </div>
      ) : parts ? (
        <div className="flex gap-3">
          {([["Days", parts.d], ["Hours", parts.h], ["Min", parts.m], ["Sec", parts.s]] as const).map(([label, value]) => (
            <Panel key={label} className="w-20 py-4 text-center">
              <p className={`font-mono text-3xl font-bold ${parts.done ? "text-emerald-300" : "text-cyan-300"}`}>{String(value).padStart(2, "0")}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
            </Panel>
          ))}
        </div>
      ) : null}
      <div className="flex gap-3">
        {!running ? (
          <Button onClick={start}>▶ Start countdown</Button>
        ) : (
          <Button variant="ghost" onClick={() => { setRunning(false); setLeft(null); }}>Cancel</Button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Stopwatch ---------------- */

export function Stopwatch({ onResult }: ToolProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);

  useEffect(() => {
    if (!running) return;
    const start = performance.now() - elapsed;
    const timer = setInterval(() => setElapsed(performance.now() - start), 41);
    return () => clearInterval(timer);
  }, [running, elapsed]);

  const fmt = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };

  useEffect(() => {
    onResult?.({
      text: `Stopwatch: ${fmt(elapsed)}\nLaps:\n${laps.map((l, i) => `#${i + 1}: ${fmt(l)}`).join("\n") || "(none yet)"}`,
      ext: "txt",
    });
  }, [elapsed, laps, onResult]);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="font-mono text-6xl font-bold tracking-tight text-cyan-300">{fmt(elapsed)}</p>
      <div className="flex gap-3">
        <Button onClick={() => setRunning((r) => !r)}>{running ? "⏸ Pause" : "▶ Start"}</Button>
        <Button variant="ghost" onClick={() => setLaps((l) => [...l, elapsed])} disabled={!running}>Lap</Button>
        <Button variant="ghost" onClick={() => { setRunning(false); setElapsed(0); setLaps([]); }}>Reset</Button>
      </div>
      {laps.length ? (
        <Panel className="w-full max-w-xs p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Laps</p>
          <ul className="space-y-1 font-mono text-sm text-slate-300">
            {laps.map((l, i) => <li key={i} className="flex justify-between"><span>#{i + 1}</span><span>{fmt(l)}</span></li>)}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

/* ---------------- World Clock ---------------- */

const ZONES = [
  { label: "New York", tz: "America/New_York" },
  { label: "London", tz: "Europe/London" },
  { label: "Berlin", tz: "Europe/Berlin" },
  { label: "Dubai", tz: "Asia/Dubai" },
  { label: "Karachi", tz: "Asia/Karachi" },
  { label: "Beijing", tz: "Asia/Shanghai" },
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "Sydney", tz: "Australia/Sydney" },
];

export function WorldClock({ onResult }: ToolProps) {
  const [now, setNow] = useState(0); // hydration-safe initial

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rows = ZONES.map((z) => {
    const t = now || Date.UTC(2026, 0, 1);
    const time = new Intl.DateTimeFormat("en-US", { timeZone: z.tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(t);
    const day = new Intl.DateTimeFormat("en-US", { timeZone: z.tz, weekday: "short" }).format(t);
    return { ...z, time: now ? time : "…", day: now ? day : "" };
  });

  useEffect(() => {
    onResult?.({ text: rows.map((r) => `${r.label}: ${r.time} (${r.day})`).join("\n"), ext: "txt" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, onResult]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((r) => (
        <Panel key={r.tz} className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-slate-200">{r.label}</p>
            <p className="text-xs text-slate-500">{r.tz}</p>
          </div>
          <p className="font-mono text-xl font-bold text-cyan-300">{r.time}</p>
        </Panel>
      ))}
    </div>
  );
}

/* ---------------- Markdown Editor ---------------- */

export function MarkdownEditor({ onResult }: ToolProps) {
  const [md, setMd] = useState(
    "# Hello OmniKit\n\nWrite **markdown** here — rendered *instantly* on-device.\n\n- Lists work\n- Code works: `inline` and\n\n```js\nconsole.log(\"blocks\");\n```\n\n> Blockquotes too.",
  );
  const html = useMemo(() => mdToHtml(md), [md]);

  useEffect(() => {
    onResult?.({ text: html, ext: "html" });
  }, [html, onResult]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Field label="Markdown"><TextArea value={md} onChange={(e) => setMd(e.target.value)} className="min-h-[300px]" /></Field>
      <div className="space-y-2">
        <Field label="Live preview"><div className="md-preview max-h-[340px] min-h-[300px] overflow-auto rounded-xl border border-white/10 bg-[#0d1424] px-4 py-3 text-sm text-slate-200" dangerouslySetInnerHTML={{ __html: html }} /></Field>
        <div className="flex gap-2">
          <CopyButton text={html} label="Copy HTML" />
          <CopyButton text={md} label="Copy Markdown" />
        </div>
      </div>
    </div>
  );
}
