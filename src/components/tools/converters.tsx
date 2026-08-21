"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, CopyButton, Field, Input, OutputPanel, Panel, Select } from "@/components/ui";
import type { ToolProps } from "@/components/tools/dev";

/* ---------------- Color Converter ---------------- */

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB | null {
  let h = hex.replace("#", "").trim();
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function rgbToHex({ r, g, b }: RGB): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
}

function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): RGB {
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let rgb: RGB = { r: 0, g: 0, b: 0 };
  if (h < 60) rgb = { r: c, g: x, b: 0 };
  else if (h < 120) rgb = { r: x, g: c, b: 0 };
  else if (h < 180) rgb = { r: 0, g: c, b: x };
  else if (h < 240) rgb = { r: 0, g: x, b: c };
  else if (h < 300) rgb = { r: x, g: 0, b: c };
  else rgb = { r: c, g: 0, b: x };
  return { r: Math.round((rgb.r + m) * 255), g: Math.round((rgb.g + m) * 255), b: Math.round((rgb.b + m) * 255) };
}

function rgbToCmyk({ r, g, b }: RGB): { c: number; m: number; y: number; k: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - rn - k) / (1 - k)) * 100),
    m: Math.round(((1 - gn - k) / (1 - k)) * 100),
    y: Math.round(((1 - bn - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function cmykToRgb(c: number, m: number, y: number, k: number): RGB {
  const r = 255 * (1 - c / 100) * (1 - k / 100);
  const g = 255 * (1 - m / 100) * (1 - k / 100);
  const b = 255 * (1 - y / 100) * (1 - k / 100);
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

function rgbToHsv({ r, g, b }: RGB): { h: number; s: number; v: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;
  return { h: Math.round(h), s: max === 0 ? 0 : Math.round((d / max) * 100), v: Math.round(max * 100) };
}

function hsvToRgb(h: number, s: number, v: number): RGB {
  const sn = s / 100, vn = v / 100;
  const c = vn * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vn - c;
  let rgb: RGB = { r: 0, g: 0, b: 0 };
  if (h < 60) rgb = { r: c, g: x, b: 0 };
  else if (h < 120) rgb = { r: x, g: c, b: 0 };
  else if (h < 180) rgb = { r: 0, g: c, b: x };
  else if (h < 240) rgb = { r: 0, g: x, b: c };
  else if (h < 300) rgb = { r: x, g: 0, b: c };
  else rgb = { r: c, g: 0, b: x };
  return { r: Math.round((rgb.r + m) * 255), g: Math.round((rgb.g + m) * 255), b: Math.round((rgb.b + m) * 255) };
}

function parseColor(input: string): RGB | null {
  const trimmed = input.trim();
  if (trimmed.startsWith("#") || /^[0-9a-f]{3,6}$/i.test(trimmed)) return hexToRgb(trimmed);
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgbMatch) return { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) };
  const hslMatch = trimmed.match(/^hsla?\(\s*(\d+)[,\s]+(\d+)%[,\s]+(\d+)%/i);
  if (hslMatch) return hslToRgb(Number(hslMatch[1]), Number(hslMatch[2]), Number(hslMatch[3]));
  const cmykMatch = trimmed.match(/^cmyk\(\s*(\d+)%[,\s]+(\d+)%[,\s]+(\d+)%[,\s]+(\d+)%/i);
  if (cmykMatch) return cmykToRgb(Number(cmykMatch[1]), Number(cmykMatch[2]), Number(cmykMatch[3]), Number(cmykMatch[4]));
  return null;
}

export function ColorConverter({ onResult }: ToolProps) {
  const [input, setInput] = useState("#06b6d4");
  const rgb = useMemo(() => parseColor(input), [input]);
  const outputs = useMemo(() => {
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb);
    const cmyk = rgbToCmyk(rgb);
    const hsv = rgbToHsv(rgb);
    return {
      hex: rgbToHex(rgb),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
      hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
    };
  }, [rgb]);

  useEffect(() => {
    onResult?.({
      text: outputs ? Object.entries(outputs).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join("\n") : "",
      ext: "txt",
    });
  }, [outputs, onResult]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Field label="Color input" hint="hex, rgb(), hsl(), cmyk()">
          <Input value={input} onChange={(e) => setInput(e.target.value)} className="font-mono" placeholder="#06b6d4" />
        </Field>
        <div className="flex gap-2">
          {["#06b6d4", "#f43f5e", "#10b981", "#f59e0b", "rgb(99, 102, 241)", "hsl(340, 90%, 60%)"].map((c) => (
            <button key={c} onClick={() => setInput(c)} className="h-9 w-9 rounded-lg border border-white/20 transition-transform hover:scale-110" style={{ background: c }} aria-label={c} />
          ))}
        </div>
        {rgb ? (
          <div className="rounded-2xl border border-white/10 p-1" style={{ background: `linear-gradient(135deg, ${rgbToHex(rgb)} 60%, #0d1424 60%)` }}>
            <div className="flex h-28 items-end justify-between rounded-xl p-3 text-white" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>
              <span className="font-mono text-xs font-bold">{rgbToHex(rgb)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-rose-300">Could not parse “{input}” — try #06b6d4, rgb(6,182,212) or hsl(189, 94%, 43%)</p>
        )}
      </div>
      <div className="space-y-3">
        {outputs ? (
          Object.entries(outputs).map(([label, value]) => (
            <Panel key={label} className="flex items-center justify-between gap-3 p-3">
              <span className="w-16 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
              <code className="min-w-0 flex-1 truncate font-mono text-sm text-cyan-300">{value}</code>
              <CopyButton text={value} className="shrink-0" />
            </Panel>
          ))
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- Unit Converter ---------------- */

type UnitCat = "length" | "mass" | "temp" | "area" | "volume" | "speed" | "data" | "time" | "energy" | "pressure" | "power" | "frequency" | "angle" | "cooking";

interface UnitEntry { symbol: string; name: string; factor: number }

const UNITS: Record<UnitCat, UnitEntry[]> = {
  length: [
    { symbol: "m", name: "Meters", factor: 1 }, { symbol: "km", name: "Kilometers", factor: 1000 },
    { symbol: "cm", name: "Centimeters", factor: 0.01 }, { symbol: "mm", name: "Millimeters", factor: 0.001 },
    { symbol: "mi", name: "Miles", factor: 1609.344 }, { symbol: "yd", name: "Yards", factor: 0.9144 },
    { symbol: "ft", name: "Feet", factor: 0.3048 }, { symbol: "in", name: "Inches", factor: 0.0254 },
    { symbol: "nmi", name: "Nautical miles", factor: 1852 },
  ],
  mass: [
    { symbol: "kg", name: "Kilograms", factor: 1 }, { symbol: "g", name: "Grams", factor: 0.001 },
    { symbol: "mg", name: "Milligrams", factor: 1e-6 }, { symbol: "t", name: "Metric tons", factor: 1000 },
    { symbol: "lb", name: "Pounds", factor: 0.45359237 }, { symbol: "oz", name: "Ounces", factor: 0.028349523125 },
    { symbol: "st", name: "Stones", factor: 6.35029318 },
  ],
  temp: [],
  area: [
    { symbol: "m2", name: "Square meters", factor: 1 }, { symbol: "km2", name: "Square kilometers", factor: 1e6 },
    { symbol: "ha", name: "Hectares", factor: 1e4 }, { symbol: "ft2", name: "Square feet", factor: 0.09290304 },
    { symbol: "ac", name: "Acres", factor: 4046.8564224 }, { symbol: "mi2", name: "Square miles", factor: 2589988.110336 },
  ],
  volume: [
    { symbol: "l", name: "Liters", factor: 1 }, { symbol: "ml", name: "Milliliters", factor: 0.001 },
    { symbol: "m3", name: "Cubic meters", factor: 1000 }, { symbol: "gal", name: "Gallons (US)", factor: 3.785411784 },
    { symbol: "qt", name: "Quarts (US)", factor: 0.946352946 }, { symbol: "pt", name: "Pints (US)", factor: 0.473176473 },
    { symbol: "cup", name: "Cups (US)", factor: 0.2365882365 }, { symbol: "floz", name: "Fluid ounces (US)", factor: 0.0295735295625 },
  ],
  speed: [
    { symbol: "mps", name: "Meters/second", factor: 1 }, { symbol: "kph", name: "Kilometers/hour", factor: 1 / 3.6 },
    { symbol: "mph", name: "Miles/hour", factor: 0.44704 }, { symbol: "knot", name: "Knots", factor: 0.5144444444 },
    { symbol: "fps", name: "Feet/second", factor: 0.3048 },
  ],
  data: [
    { symbol: "b", name: "Bytes", factor: 1 }, { symbol: "kb", name: "Kilobytes (KB)", factor: 1000 },
    { symbol: "mb", name: "Megabytes (MB)", factor: 1e6 }, { symbol: "gb", name: "Gigabytes (GB)", factor: 1e9 },
    { symbol: "tb", name: "Terabytes (TB)", factor: 1e12 }, { symbol: "kib", name: "Kibibytes (KiB)", factor: 1024 },
    { symbol: "mib", name: "Mebibytes (MiB)", factor: 1024 ** 2 }, { symbol: "gib", name: "Gibibytes (GiB)", factor: 1024 ** 3 },
    { symbol: "bit", name: "Bits", factor: 0.125 }, { symbol: "mbit", name: "Megabits", factor: 125000 },
  ],
  time: [
    { symbol: "s", name: "Seconds", factor: 1 }, { symbol: "min", name: "Minutes", factor: 60 },
    { symbol: "h", name: "Hours", factor: 3600 }, { symbol: "day", name: "Days", factor: 86400 },
    { symbol: "wk", name: "Weeks", factor: 604800 }, { symbol: "yr", name: "Years", factor: 31557600 },
  ],
  energy: [
    { symbol: "j", name: "Joules", factor: 1 }, { symbol: "kj", name: "Kilojoules", factor: 1000 },
    { symbol: "cal", name: "Calories", factor: 4.184 }, { symbol: "kcal", name: "Kilocalories", factor: 4184 },
    { symbol: "wh", name: "Watt-hours", factor: 3600 }, { symbol: "kwh", name: "Kilowatt-hours", factor: 3.6e6 },
    { symbol: "btu", name: "BTU", factor: 1055.05585262 },
  ],
  pressure: [
    { symbol: "pa", name: "Pascals", factor: 1 }, { symbol: "kpa", name: "Kilopascals", factor: 1000 },
    { symbol: "bar", name: "Bar", factor: 100000 }, { symbol: "atm", name: "Atmospheres", factor: 101325 },
    { symbol: "psi", name: "PSI", factor: 6894.757293168 }, { symbol: "mmhg", name: "mmHg", factor: 133.322387415 },
  ],
  power: [
    { symbol: "w", name: "Watts", factor: 1 }, { symbol: "kw", name: "Kilowatts", factor: 1000 },
    { symbol: "mw", name: "Megawatts", factor: 1e6 }, { symbol: "hp", name: "Horsepower", factor: 745.699872 },
  ],
  frequency: [
    { symbol: "hz", name: "Hertz", factor: 1 }, { symbol: "khz", name: "Kilohertz", factor: 1000 },
    { symbol: "mhz", name: "Megahertz", factor: 1e6 }, { symbol: "ghz", name: "Gigahertz", factor: 1e9 },
    { symbol: "rpm", name: "RPM", factor: 1 / 60 },
  ],
  angle: [
    { symbol: "deg", name: "Degrees", factor: 1 }, { symbol: "rad", name: "Radians", factor: 57.29577951308232 },
    { symbol: "grad", name: "Gradians", factor: 0.9 }, { symbol: "arcmin", name: "Arcminutes", factor: 1 / 60 },
  ],
  cooking: [
    { symbol: "ml", name: "Milliliters", factor: 1 }, { symbol: "tsp", name: "Teaspoons (US)", factor: 4.92892159375 },
    { symbol: "tbsp", name: "Tablespoons (US)", factor: 14.78676478125 }, { symbol: "cup", name: "Cups (US)", factor: 236.5882365 },
    { symbol: "floz", name: "Fluid ounces", factor: 29.5735295625 }, { symbol: "g", name: "Grams (water)", factor: 1 },
  ],
};

const CAT_LABELS: Record<UnitCat, string> = {
  length: "Length", mass: "Weight", temp: "Temperature", area: "Area", volume: "Volume",
  speed: "Speed", data: "Data storage", time: "Time", energy: "Energy", pressure: "Pressure",
  power: "Power", frequency: "Frequency", angle: "Angle", cooking: "Cooking",
};

const TEMP_UNITS = [
  { symbol: "c", name: "Celsius (°C)", factor: 0 },
  { symbol: "f", name: "Fahrenheit (°F)", factor: 0 },
  { symbol: "k", name: "Kelvin (K)", factor: 0 },
];

function toCelsius(value: number, from: string): number {
  if (from === "f") return (value - 32) * 5 / 9;
  if (from === "k") return value - 273.15;
  return value;
}
function fromCelsius(value: number, to: string): number {
  if (to === "f") return value * 9 / 5 + 32;
  if (to === "k") return value + 273.15;
  return value;
}

const PRESETS: Record<string, { cat: UnitCat; from: string; to: string }> = {
  "length-converter": { cat: "length", from: "km", to: "mi" },
  "weight-converter": { cat: "mass", from: "kg", to: "lb" },
  "temperature-converter": { cat: "temp", from: "c", to: "f" },
  "area-converter": { cat: "area", from: "m2", to: "ft2" },
  "volume-converter": { cat: "volume", from: "l", to: "gal" },
  "speed-converter": { cat: "speed", from: "kph", to: "mph" },
  "data-storage-converter": { cat: "data", from: "mb", to: "gb" },
  "time-converter": { cat: "time", from: "h", to: "min" },
  "energy-converter": { cat: "energy", from: "j", to: "kj" },
  "pressure-converter": { cat: "pressure", from: "pa", to: "bar" },
  "power-converter": { cat: "power", from: "w", to: "hp" },
  "frequency-converter": { cat: "frequency", from: "hz", to: "khz" },
  "angle-converter": { cat: "angle", from: "deg", to: "rad" },
  "cooking-unit-converter": { cat: "cooking", from: "tbsp", to: "ml" },
  "metric-to-imperial-converter": { cat: "length", from: "m", to: "ft" },
  "imperial-to-metric-converter": { cat: "length", from: "ft", to: "m" },
  "kilometers-to-miles": { cat: "length", from: "km", to: "mi" },
  "miles-to-kilometers": { cat: "length", from: "mi", to: "km" },
  "meters-to-feet": { cat: "length", from: "m", to: "ft" },
  "feet-to-meters": { cat: "length", from: "ft", to: "m" },
  "centimeters-to-inches": { cat: "length", from: "cm", to: "in" },
  "inches-to-centimeters": { cat: "length", from: "in", to: "cm" },
  "kilograms-to-pounds": { cat: "mass", from: "kg", to: "lb" },
  "pounds-to-kilograms": { cat: "mass", from: "lb", to: "kg" },
  "grams-to-ounces": { cat: "mass", from: "g", to: "oz" },
  "ounces-to-grams": { cat: "mass", from: "oz", to: "g" },
  "liters-to-gallons": { cat: "volume", from: "l", to: "gal" },
  "gallons-to-liters": { cat: "volume", from: "gal", to: "l" },
  "celsius-to-fahrenheit": { cat: "temp", from: "c", to: "f" },
  "fahrenheit-to-celsius": { cat: "temp", from: "f", to: "c" },
  "celsius-to-kelvin": { cat: "temp", from: "c", to: "k" },
  "kelvin-to-celsius": { cat: "temp", from: "k", to: "c" },
  "fahrenheit-to-kelvin": { cat: "temp", from: "f", to: "k" },
  "kelvin-to-fahrenheit": { cat: "temp", from: "k", to: "f" },
  "mph-to-kph": { cat: "speed", from: "mph", to: "kph" },
  "kph-to-mph": { cat: "speed", from: "kph", to: "mph" },
  "knots-to-mph": { cat: "speed", from: "knot", to: "mph" },
  "mb-to-gb": { cat: "data", from: "mb", to: "gb" },
  "gb-to-tb": { cat: "data", from: "gb", to: "tb" },
  "bytes-to-kb": { cat: "data", from: "b", to: "kb" },
  "bits-to-bytes": { cat: "data", from: "bit", to: "b" },
  "megabits-to-megabytes": { cat: "data", from: "mbit", to: "mb" },
  "mbps-to-mbps": { cat: "data", from: "mbit", to: "mb" },
};

export function UnitConverter({ variant = "unit-converter", onResult }: ToolProps & { variant?: string }) {
  const preset = PRESETS[variant] ?? { cat: "length" as UnitCat, from: "m", to: "ft" };
  const [cat, setCat] = useState<UnitCat>(preset.cat);
  const [from, setFrom] = useState(preset.from);
  const [to, setTo] = useState(preset.to);
  const [value, setValue] = useState("100");

  const result = useMemo(() => {
    const v = parseFloat(value);
    if (isNaN(v)) return null;
    if (cat === "temp") {
      return fromCelsius(toCelsius(v, from), to);
    }
    const list = UNITS[cat];
    const f = list.find((u) => u.symbol === from);
    const t = list.find((u) => u.symbol === to);
    if (!f || !t) return null;
    return (v * f.factor) / t.factor;
  }, [value, cat, from, to]);

  const fromList = cat === "temp" ? TEMP_UNITS : UNITS[cat];
  const toList = cat === "temp" ? TEMP_UNITS : UNITS[cat];
  const fromName = fromList.find((u) => u.symbol === from)?.name ?? from;
  const toName = toList.find((u) => u.symbol === to)?.name ?? to;

  const formatted = result === null ? "" : Math.abs(result) >= 1e12 || Math.abs(result) < 1e-9 ? result.toExponential(6) : result.toLocaleString(undefined, { maximumFractionDigits: 8 });

  useEffect(() => {
    onResult?.({ text: result === null ? "" : `${value} ${fromName} = ${formatted} ${toName}`, ext: "txt" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formatted, value, fromName, toName, onResult]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Value"><Input value={value} onChange={(e) => setValue(e.target.value)} className="w-40 font-mono" placeholder="100" /></Field>
        <Field label="Category"><Select value={cat} onChange={(e) => setCat(e.target.value as UnitCat)} className="w-48">{(Object.keys(CAT_LABELS) as UnitCat[]).map((c) => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}</Select></Field>
      </div>
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <Field label="From"><Select value={from} onChange={(e) => setFrom(e.target.value)}>{fromList.map((u) => <option key={u.symbol} value={u.symbol}>{u.name}</option>)}</Select></Field>
        <Button variant="ghost" onClick={swap} className="mb-1" aria-label="Swap units">⇄</Button>
        <Field label="To"><Select value={to} onChange={(e) => setTo(e.target.value)}>{toList.map((u) => <option key={u.symbol} value={u.symbol}>{u.name}</option>)}</Select></Field>
      </div>
      <Panel className="p-5 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Result</p>
        <p className="mt-2 font-mono text-2xl font-bold text-cyan-300">
          {formatted ? `${formatted} ${to}` : "—"}
        </p>
        <p className="mt-1 text-xs text-slate-500">{value} {fromName} = {formatted} {toName}</p>
      </Panel>
      {formatted ? <CopyButton text={`${value} ${fromName} = ${formatted} ${toName}`} className="mx-auto" /> : null}
    </div>
  );
}
