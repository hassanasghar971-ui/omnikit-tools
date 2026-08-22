"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, CopyButton, Field, Input, OutputPanel, Panel, Select, TextArea } from "@/components/ui";
import type { ToolProps } from "@/components/tools/dev";

/* ---------------- Color Blindness Simulator ---------------- */

const FILTERS: Record<string, { label: string; matrix: number[] }> = {
  protanopia: { label: "Protanopia (red-blind)", matrix: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758] },
  deuteranopia: { label: "Deuteranopia (green-blind)", matrix: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7] },
  tritanopia: { label: "Tritanopia (blue-blind)", matrix: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525] },
  achromatopsia: { label: "Achromatopsia (total)", matrix: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114] },
};

export function ColorBlindnessSimulator({ onResult }: ToolProps) {
  const [filter, setFilter] = useState("protanopia");
  const [src, setSrc] = useState("");
  const [out, setOut] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const apply = () => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const m = FILTERS[filter].matrix;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
        data[i] = Math.min(255, (m[0] * r + m[1] * g + m[2] * b) * 255);
        data[i + 1] = Math.min(255, (m[3] * r + m[4] * g + m[5] * b) * 255);
        data[i + 2] = Math.min(255, (m[6] * r + m[7] * g + m[8] * b) * 255);
      }
      ctx.putImageData(imageData, 0, 0);
      setOut(canvas.toDataURL("image/png"));
    };
    img.src = src;
  };

  useEffect(() => {
    apply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, src]);

  useEffect(() => {
    onResult?.({ text: `Simulated ${FILTERS[filter].label}`, dataUrl: out || undefined, ext: "png", fileName: "color-blind-simulation.png" });
  }, [out, filter, onResult]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Field label="Simulation">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-64">
            {Object.entries(FILTERS).map(([id, f]) => <option key={id} value={id}>{f.label}</option>)}
          </Select>
        </Field>
        <label className="mt-5 flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:border-cyan-500/40">
          🖼 Choose image
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setError(null);
            const reader = new FileReader();
            reader.onload = () => setSrc(String(reader.result));
            reader.readAsDataURL(f);
          }} />
        </label>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {out ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Fixed-size boxes → zero layout shift while canvases decode */}
          <div className="grid h-64 w-full place-items-center overflow-hidden rounded-xl border border-white/10 bg-[#0d1424]">
            <img src={src} alt="Original" className="h-full w-full object-contain" />
          </div>
          <div className="grid h-64 w-full place-items-center overflow-hidden rounded-xl border border-white/10 bg-[#0d1424]">
            <img src={out} alt={`${FILTERS[filter].label} simulation`} className="h-full w-full object-contain" />
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Upload an image to see how it renders for different color vision deficiencies. Processing is 100% local canvas math.</p>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

/* ---------------- Word Cloud Generator ---------------- */

export function WordCloudGenerator({ onResult }: ToolProps) {
  const [text, setText] = useState("OmniKit tools json pdf image seo finance security converters text productivity network media css developer privacy offline speed wasm worker crypto hash password timer");
  const [words, setWords] = useState<Array<{ word: string; size: number; rotate: number; color: string }>>([]);

  const colors = ["#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#f43f5e", "#a3e635"];

  useEffect(() => {
    const tokens = (text.toLowerCase().match(/[a-z0-9-]+/g) ?? []).filter((w) => w.length > 1);
    const counts = new Map<string, number>();
    for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
    const max = Math.max(...counts.values(), 1);
    setWords(
      Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 60)
        .map(([word, count]) => ({
          word,
          size: 12 + Math.round((count / max) * 28),
          rotate: Math.random() > 0.7 ? (Math.random() > 0.5 ? 90 : -90) : 0,
          color: colors[Math.floor(Math.random() * colors.length)],
        })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    onResult?.({ text: words.map((w) => w.word).join(" "), ext: "txt" });
  }, [words, onResult]);

  return (
    <div className="space-y-4">
      <TextArea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[90px]" placeholder="Paste text or space-separated keywords…" />
      <Panel className="flex min-h-[280px] flex-wrap content-center items-center justify-center gap-x-4 gap-y-2 p-8">
        {words.length ? words.map((w, i) => (
          <span key={i} style={{ fontSize: w.size, color: w.color, transform: `rotate(${w.rotate}deg)` }} className="transition-transform hover:scale-110">
            {w.word}
          </span>
        )) : <p className="text-sm text-slate-500">Add some words…</p>}
      </Panel>
    </div>
  );
}

/* ---------------- Metronome ---------------- */

export function Metronome({ onResult }: ToolProps) {
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [beats, setBeats] = useState(4);
  const [beat, setBeat] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!playing) return;
    let next = 0;
    let localBeat = 0;
    let stop = false;
    const tick = () => {
      if (stop) return;
      const ac = audioRef.current ?? new AudioContext();
      audioRef.current = ac;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.frequency.value = localBeat % beats === 0 ? 1200 : 900;
      gain.gain.setValueAtTime(0.4, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
      osc.connect(gain).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.07);
      setBeat(localBeat % beats);
      localBeat++;
      next += 60 / bpm;
      const drift = next * 1000 - ac.currentTime * 1000;
      window.setTimeout(tick, Math.max(50, 1000 * 60 / bpm + drift * 0.5));
    };
    const initial = window.setTimeout(tick, 0);
    return () => {
      stop = true;
      clearTimeout(initial);
      // Release the shared AudioContext on stop/pause — recreated lazily
      // on the next start, so we never accumulate live contexts.
      const ac = audioRef.current;
      audioRef.current = null;
      if (ac) {
        void ac.close().catch(() => undefined);
      }
    };
  }, [playing, bpm, beats]);

  useEffect(() => {
    onResult?.({ text: playing ? `Metronome running at ${bpm} BPM · ${beats}/4` : `Metronome stopped · ${bpm} BPM`, ext: "txt" });
  }, [bpm, playing, beats, onResult]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-end gap-3">
          {Array.from({ length: beats }).map((_, i) => (
            <div
              key={i}
              className={`w-4 rounded-t transition-all duration-100 ${beat === i && playing ? "bg-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.8)]" : "bg-white/15"}`}
              style={{ height: i === 0 ? 48 : 36 }}
            />
          ))}
        </div>
        <p className="font-mono text-5xl font-bold text-cyan-300">{bpm}</p>
        <p className="-mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">BPM</p>
      </div>
      <div>
        <input type="range" min={40} max={240} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400" />
        <div className="mt-1 flex justify-between text-[10px] text-slate-600"><span>40</span><span>120</span><span>240</span></div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={() => setPlaying((p) => !p)}>{playing ? "■ Stop" : "▶ Start"}</Button>
        <Select value={beats} onChange={(e) => setBeats(Number(e.target.value))} className="w-24">
          {[2, 3, 4, 6].map((b) => <option key={b} value={b}>{b}/4</option>)}
        </Select>
      </div>
    </div>
  );
}

/* ---------------- BPM Counter ---------------- */

export function BpmCounter({ onResult }: ToolProps) {
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);

  const tap = () => {
    const now = performance.now();
    setTaps((prev) => {
      const recent = [...prev.filter((t) => now - t < 8000), now];
      if (recent.length < 2) return recent;
      const intervals = recent.slice(1).map((t, i) => t - recent[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setBpm(Math.round(60000 / avg));
      return recent;
    });
  };

  useEffect(() => {
    onResult?.({ text: bpm === null ? "Tap at least twice to measure BPM" : `Measured BPM: ${bpm}`, ext: "txt" });
  }, [bpm, onResult]);

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <button
        onClick={tap}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") tap();
        }}
        className={`h-44 w-44 rounded-full border-4 transition-all active:scale-95 ${bpm === null ? "border-white/15 bg-white/5" : "border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_48px_-8px_rgba(6,182,212,0.5)]"}`}
      >
        <span className="block font-mono text-3xl font-bold text-cyan-300">{bpm ?? "—"}</span>
        <span className="mt-1 block text-xs uppercase tracking-[0.3em] text-slate-500">{bpm === null ? "Tap here" : "BPM"}</span>
      </button>
      <p className="text-xs text-slate-500">Tap the pad to the beat (or press Space). BPM averages your last 8 seconds of taps.</p>
      <Button variant="ghost" onClick={() => { setTaps([]); setBpm(null); }}>Reset</Button>
    </div>
  );
}

/* ---------------- Audio Spectrum Visualizer ---------------- */

export function AudioSpectrum({ onResult }: ToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let ac: AudioContext | null = null;
    let raf = 0;
    let source: MediaStreamAudioSourceNode | null = null;
    const stop = () => {
      cancelAnimationFrame(raf);
      if (ac) void ac.close().catch(() => undefined);
      ac = null;
      source = null;
    };

    if (status !== "running") {
      stop();
      return;
    }

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        ac = new AudioContext();
        source = ac.createMediaStreamSource(stream);
        const analyser = ac.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const draw = () => {
          const canvas = canvasRef.current;
          if (!canvas || !ac) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          analyser.getByteFrequencyData(data);
          const w = canvas.width;
          const h = canvas.height;
          ctx.fillStyle = "#0d1424";
          ctx.fillRect(0, 0, w, h);
          const bars = 48;
          const barW = w / bars;
          for (let i = 0; i < bars; i++) {
            const v = data[Math.floor((i / bars) * data.length * 0.7)] / 255;
            const bh = Math.max(2, v * h);
            const hue = 190 - i * 1.5;
            ctx.fillStyle = `hsl(${hue}, 90%, ${55 + v * 20}%)`;
            ctx.fillRect(i * barW + 1, h - bh, barW - 2, bh);
          }
          raf = requestAnimationFrame(draw);
        };
        draw();
        setErrorMsg("");
      } catch {
        setStatus("error");
        setErrorMsg("Microphone access denied or unavailable. This visualizer needs mic permission — audio is analyzed locally and never recorded or transmitted.");
        stop();
      }
    })();

    return stop;
  }, [status]);

  useEffect(() => {
    onResult?.({ text: status === "running" ? "Live spectrum active — analyzing microphone input locally" : status === "error" ? errorMsg : "Press start to begin live spectrum analysis", ext: "txt" });
  }, [status, errorMsg, onResult]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={() => setStatus(status === "running" ? "idle" : "running")}>{status === "running" ? "■ Stop" : "🎙 Start live spectrum"}</Button>
        {status === "running" ? <span className="flex items-center gap-2 text-xs text-cyan-300"><span className="live-dot h-2 w-2 rounded-full bg-cyan-400" /> Analyzing microphone input</span> : null}
      </div>
      {status === "error" ? <p className="text-sm text-amber-300">{errorMsg}</p> : null}
      <canvas ref={canvasRef} width={640} height={200} className="w-full rounded-2xl border border-white/10" />
    </div>
  );
}
