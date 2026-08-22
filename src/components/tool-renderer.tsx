"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import type { ToolMeta } from "@/config/tools-registry";
import type { ToolProps } from "@/components/tools/dev";
import type { ToolResult } from "@/components/universal-action-bar";
import { matchEngine } from "@/lib/engine";
import { Button, Field, OutputPanel, Panel, TextArea } from "@/components/ui";

/* ================= bespoke component mapping ================= */

import {
  Base64Tool, JsonFormatter, JwtDecoder, NumberBaseConverter, QrCodeGenerator,
  RegexTester, TimestampConverter, UrlCodec, UuidGenerator,
} from "@/components/tools/dev";
import {
  CaseConverter, FindReplace, LoremIpsumGenerator, SlugGenerator,
  SpeechToText, TextDiff, TextReverser, TextToSpeech, WordCounter,
} from "@/components/tools/text";
import {
  DataEncryption, HashGenerator, KeyPairGenerator, PasswordGenerator,
  PasswordLeakChecker, PasswordStrength, TotpGenerator,
} from "@/components/tools/security";
import { ColorConverter, UnitConverter } from "@/components/tools/converters";
import {
  BmiCalculator, CompoundInterest, LoanCalculator, PercentageCalculator, TipCalculator,
} from "@/components/tools/finance";
import {
  BorderRadiusGenerator, BoxShadowGenerator, GradientGenerator, HttpStatusChecker,
  ImageMetadata, ImageResizer, ImageToBase64, IpLookup, KeywordDensity,
  MetaTagPreview, RobotsTxtGenerator, UrlParser, UserAgentParser,
  ColorPaletteExtractor,
} from "@/components/tools/misc";
import {
  AudioSpectrum, BpmCounter, ColorBlindnessSimulator, Metronome, WordCloudGenerator,
} from "@/components/tools/media";
import {
  CountdownTimer, MarkdownEditor, PomodoroTimer, Stopwatch, WorldClock,
} from "@/components/tools/productivity";
import { PdfMetadataGenerator, TextToPdf } from "@/components/tools/pdf";

type Renderer = ComponentType<any>;

const SLUG_TO_COMPONENT: Record<string, { C: Renderer; variant?: string; mode?: string }> = {
  // Developer
  "json-formatter": { C: JsonFormatter },
  "base64-encoder": { C: Base64Tool, mode: "encode" },
  "base64-decoder": { C: Base64Tool, mode: "decode" },
  "regex-tester": { C: RegexTester },
  "uuid-generator": { C: UuidGenerator },
  "jwt-decoder": { C: JwtDecoder },
  "number-base-converter": { C: NumberBaseConverter },
  "qr-code-generator": { C: QrCodeGenerator },
  "url-encoder": { C: UrlCodec, mode: "encode" },
  "url-decoder": { C: UrlCodec, mode: "decode" },
  "timestamp-converter": { C: TimestampConverter },
  "epoch-converter": { C: TimestampConverter },
  // Text
  "word-counter": { C: WordCounter },
  "case-converter": { C: CaseConverter },
  "lorem-ipsum-generator": { C: LoremIpsumGenerator },
  "slug-generator": { C: SlugGenerator },
  "text-reverser": { C: TextReverser },
  "find-and-replace-tool": { C: FindReplace },
  "text-diff-checker": { C: TextDiff },
  "text-compare-tool": { C: TextDiff },
  "text-to-speech-converter": { C: TextToSpeech },
  "speech-to-text-converter": { C: SpeechToText },
  "text-statistics-analyzer": { C: WordCounter },
  // Security
  "password-generator": { C: PasswordGenerator },
  "wifi-password-generator": { C: PasswordGenerator, variant: "wifi" },
  "pin-generator": { C: PasswordGenerator, variant: "pin" },
  "passphrase-generator": { C: PasswordGenerator, variant: "passphrase" },
  "password-strength-checker": { C: PasswordStrength },
  "password-analyzer": { C: PasswordStrength },
  "hash-generator": { C: HashGenerator },
  "md5-hash-generator": { C: HashGenerator, variant: "md5" },
  "sha-1-hash-generator": { C: HashGenerator, variant: "sha-1" },
  "sha-256-hash-generator": { C: HashGenerator, variant: "sha-256" },
  "sha-512-hash-generator": { C: HashGenerator, variant: "sha-512" },
  "crc32-checksum-calculator": { C: HashGenerator, variant: "crc32" },
  "password-leak-checker": { C: PasswordLeakChecker },
  "totp-code-generator": { C: TotpGenerator },
  "otp-generator": { C: TotpGenerator },
  "key-pair-generator": { C: KeyPairGenerator },
  "data-encryption-tool": { C: DataEncryption, mode: "encrypt" },
  "data-decryption-tool": { C: DataEncryption, mode: "decrypt" },
  "secure-note-encrypter": { C: DataEncryption, mode: "encrypt" },
  // Converters
  "color-converter": { C: ColorConverter },
  "hex-to-rgb": { C: ColorConverter, variant: "hex-to-rgb" },
  "rgb-to-hex": { C: ColorConverter, variant: "rgb-to-hex" },
  "hex-to-hsl": { C: ColorConverter, variant: "hex-to-hsl" },
  "hsl-to-hex": { C: ColorConverter, variant: "hsl-to-hex" },
  "rgb-to-hsl": { C: ColorConverter, variant: "rgb-to-hsl" },
  "hsl-to-rgb": { C: ColorConverter, variant: "hsl-to-rgb" },
  "hex-to-cmyk": { C: ColorConverter, variant: "hex-to-cmyk" },
  "cmyk-to-hex": { C: ColorConverter, variant: "cmyk-to-hex" },
  "rgb-to-cmyk": { C: ColorConverter, variant: "rgb-to-cmyk" },
  "cmyk-to-rgb": { C: ColorConverter, variant: "cmyk-to-rgb" },
  "rgb-to-hsv": { C: ColorConverter, variant: "rgb-to-hsv" },
  "hsv-to-rgb": { C: ColorConverter, variant: "hsv-to-rgb" },
  "unit-converter": { C: UnitConverter },
  "length-converter": { C: UnitConverter, variant: "length-converter" },
  "weight-converter": { C: UnitConverter, variant: "weight-converter" },
  "temperature-converter": { C: UnitConverter, variant: "temperature-converter" },
  "area-converter": { C: UnitConverter, variant: "area-converter" },
  "volume-converter": { C: UnitConverter, variant: "volume-converter" },
  "speed-converter": { C: UnitConverter, variant: "speed-converter" },
  "data-storage-converter": { C: UnitConverter, variant: "data-storage-converter" },
  "time-converter": { C: UnitConverter, variant: "time-converter" },
  "energy-converter": { C: UnitConverter, variant: "energy-converter" },
  "pressure-converter": { C: UnitConverter, variant: "pressure-converter" },
  "power-converter": { C: UnitConverter, variant: "power-converter" },
  "frequency-converter": { C: UnitConverter, variant: "frequency-converter" },
  "angle-converter": { C: UnitConverter, variant: "angle-converter" },
  "cooking-unit-converter": { C: UnitConverter, variant: "cooking-unit-converter" },
  "metric-to-imperial-converter": { C: UnitConverter, variant: "metric-to-imperial-converter" },
  "imperial-to-metric-converter": { C: UnitConverter, variant: "imperial-to-metric-converter" },
  "kilometers-to-miles": { C: UnitConverter, variant: "kilometers-to-miles" },
  "miles-to-kilometers": { C: UnitConverter, variant: "miles-to-kilometers" },
  "meters-to-feet": { C: UnitConverter, variant: "meters-to-feet" },
  "feet-to-meters": { C: UnitConverter, variant: "feet-to-meters" },
  "centimeters-to-inches": { C: UnitConverter, variant: "centimeters-to-inches" },
  "inches-to-centimeters": { C: UnitConverter, variant: "inches-to-centimeters" },
  "kilograms-to-pounds": { C: UnitConverter, variant: "kilograms-to-pounds" },
  "pounds-to-kilograms": { C: UnitConverter, variant: "pounds-to-kilograms" },
  "grams-to-ounces": { C: UnitConverter, variant: "grams-to-ounces" },
  "ounces-to-grams": { C: UnitConverter, variant: "ounces-to-grams" },
  "liters-to-gallons": { C: UnitConverter, variant: "liters-to-gallons" },
  "gallons-to-liters": { C: UnitConverter, variant: "gallons-to-liters" },
  "celsius-to-fahrenheit": { C: UnitConverter, variant: "celsius-to-fahrenheit" },
  "fahrenheit-to-celsius": { C: UnitConverter, variant: "fahrenheit-to-celsius" },
  "celsius-to-kelvin": { C: UnitConverter, variant: "celsius-to-kelvin" },
  "kelvin-to-celsius": { C: UnitConverter, variant: "kelvin-to-celsius" },
  "fahrenheit-to-kelvin": { C: UnitConverter, variant: "fahrenheit-to-kelvin" },
  "kelvin-to-fahrenheit": { C: UnitConverter, variant: "kelvin-to-fahrenheit" },
  "mph-to-kph": { C: UnitConverter, variant: "mph-to-kph" },
  "kph-to-mph": { C: UnitConverter, variant: "kph-to-mph" },
  "knots-to-mph": { C: UnitConverter, variant: "knots-to-mph" },
  "mb-to-gb": { C: UnitConverter, variant: "mb-to-gb" },
  "gb-to-tb": { C: UnitConverter, variant: "gb-to-tb" },
  "bytes-to-kb": { C: UnitConverter, variant: "bytes-to-kb" },
  "bits-to-bytes": { C: UnitConverter, variant: "bits-to-bytes" },
  "megabits-to-megabytes": { C: UnitConverter, variant: "megabits-to-megabytes" },
  "mbps-to-mbps": { C: UnitConverter, variant: "mbps-to-mbps" },
  "unix-timestamp-converter": { C: TimestampConverter },
  "date-to-unix-timestamp": { C: TimestampConverter },
  "unix-to-date": { C: TimestampConverter },
  "utc-converter": { C: TimestampConverter },
  // Finance
  "loan-calculator": { C: LoanCalculator },
  "mortgage-calculator": { C: LoanCalculator },
  "auto-loan-calculator": { C: LoanCalculator },
  "personal-loan-calculator": { C: LoanCalculator },
  "emi-calculator": { C: LoanCalculator },
  "amortization-schedule-generator": { C: LoanCalculator },
  "compound-interest-calculator": { C: CompoundInterest },
  "simple-interest-calculator": { C: CompoundInterest, variant: "simple" },
  "investment-calculator": { C: CompoundInterest },
  "retirement-calculator": { C: CompoundInterest },
  "savings-calculator": { C: CompoundInterest },
  "sip-calculator": { C: CompoundInterest },
  "inflation-calculator": { C: CompoundInterest },
  "fire-calculator": { C: CompoundInterest },
  "retirement-savings-calculator": { C: CompoundInterest },
  "tip-calculator": { C: TipCalculator },
  "bmi-calculator": { C: BmiCalculator },
  "percentage-calculator": { C: PercentageCalculator },
  "sales-tax-calculator": { C: PercentageCalculator },
  "vat-calculator": { C: PercentageCalculator },
  "gst-calculator": { C: PercentageCalculator },
  "discount-calculator": { C: PercentageCalculator },
  "percentage-change-calculator": { C: PercentageCalculator },
  "markup-calculator": { C: PercentageCalculator },
  "margin-calculator": { C: PercentageCalculator },
  // Image
  "image-to-base64": { C: ImageToBase64 },
  "image-resizer": { C: ImageResizer },
  "image-metadata-viewer": { C: ImageMetadata },
  "color-palette-extractor": { C: ColorPaletteExtractor },
  // SEO
  "meta-tag-preview": { C: MetaTagPreview },
  "serp-preview-tool": { C: MetaTagPreview },
  "keyword-density-checker": { C: KeywordDensity },
  "robots-txt-generator": { C: RobotsTxtGenerator },
  // Network
  "ip-address-lookup": { C: IpLookup },
  "what-is-my-ip": { C: IpLookup },
  "user-agent-parser": { C: UserAgentParser },
  "http-status-code-checker": { C: HttpStatusChecker },
  "url-parser": { C: UrlParser },
  // CSS
  "gradient-generator": { C: GradientGenerator },
  "box-shadow-generator": { C: BoxShadowGenerator },
  "border-radius-generator": { C: BorderRadiusGenerator },
  // Media
  "color-blindness-simulator": { C: ColorBlindnessSimulator },
  "word-cloud-generator": { C: WordCloudGenerator },
  "metronome": { C: Metronome },
  "music-bpm-counter": { C: BpmCounter },
  "audio-spectrum-visualizer": { C: AudioSpectrum },
  // Productivity
  "pomodoro-timer": { C: PomodoroTimer },
  "focus-timer": { C: PomodoroTimer },
  "break-timer": { C: PomodoroTimer },
  "work-session-timer": { C: PomodoroTimer },
  "ambient-sound-timer": { C: PomodoroTimer },
  "study-timer": { C: PomodoroTimer },
  "task-timer": { C: PomodoroTimer },
  "countdown-timer": { C: CountdownTimer },
  "markdown-to-html": { C: MarkdownEditor },
  "markdown-editor": { C: MarkdownEditor },
  "stopwatch": { C: Stopwatch },
  "world-clock": { C: WorldClock },
  // PDF
  "text-to-pdf": { C: TextToPdf },
  "pdf-metadata-generator": { C: PdfMetadataGenerator },
};

/* ================= engine tool UI ================= */

export function EngineTool({ tool, onResult }: { tool: ToolMeta; onResult?: (r: ToolResult) => void }) {
  const engine = useMemo(() => matchEngine(tool.name), [tool.name]);
  const [input, setInput] = useState("");
  const [second, setSecond] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!engine) return;
    try {
      const res = engine.transform(input, second || undefined);
      setOutput(res.output);
      setError(res.error ?? null);
    } catch (e) {
      setOutput("");
      setError((e as Error).message);
    }
  }, [input, second, engine]);

  useEffect(() => {
    onResult?.({ text: error ? `Error: ${error}` : output, ext: engine?.ext ?? "txt" });
  }, [output, error, engine, onResult]);

  if (!engine) return null;

  const sample = input.trim() ? null : (
    <Button variant="ghost" onClick={() => {
      const defaults: Record<string, string> = {
        "fmt.json": '{"name":"omnikit","tools":750,"privacy":"on-device"}',
        "json2yaml": '{"name":"omnikit","tools":750}',
        "yaml2json": "name: omnikit\ntools: 750\n",
        "json2csv": '[{"name":"omnikit","tools":750}]',
        "csv2json": "name,tools\nomnikit,750\n",
        "md2html": "# Hello\n\n**bold** and *italic*",
        "slug.gen": "How to Export PDF Results from OmniKit Tools",
        "stats.text": "OmniKit Tools runs everything on-device. Try counting this sentence.",
        "gen.uuid": "",
        "gen.mock": "",
      };
      if (defaults[engine.id]) setInput(defaults[engine.id]);
    }}>Load sample</Button>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{engine.description}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Field label={engine.inputLabel}><TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder={engine.inputPlaceholder} className="min-h-[180px]" /></Field>
          {engine.secondLabel ? (
            <Field label={engine.secondLabel}><input value={second} onChange={(e) => setSecond(e.target.value)} placeholder={engine.secondPlaceholder} className="w-full rounded-lg border border-white/10 bg-[#0d1424] px-3 py-2 text-sm font-mono text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500/50" /></Field>
          ) : null}
          {sample}
        </div>
        <div className="space-y-2">
          <Field label={engine.outputLabel}>
            {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-mono text-sm text-rose-300">{error}</div> : <OutputPanel value={output} />}
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ================= workspace fallback ================= */

export function WorkspaceTool({ tool, onResult }: { tool: ToolMeta; onResult?: (r: ToolResult) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const ops: Array<[string, (s: string) => string]> = [
    ["UPPERCASE", (s) => s.toUpperCase()],
    ["lowercase", (s) => s.toLowerCase()],
    ["Title Case", (s) => s.toLowerCase().replace(/(^|\s)(\S)/g, (_, sp: string, c: string) => sp + c.toUpperCase())],
    ["Reverse", (s) => s.split("").reverse().join("")],
    ["Sort lines", (s) => s.split("\n").sort((a, b) => a.localeCompare(b)).join("\n")],
    ["Dedupe lines", (s) => Array.from(new Set(s.split("\n"))).join("\n")],
    ["Strip HTML", (s) => s.replace(/<[^>]+>/g, " ")],
    ["Trim lines", (s) => s.split("\n").map((l) => l.trim()).join("\n")],
  ];

  useEffect(() => {
    onResult?.({ text: output, ext: "txt" });
  }, [output, onResult]);

  return (
    <div className="space-y-4">
      <Panel className="border-cyan-500/20 bg-cyan-500/[0.04] p-4">
        <p className="text-sm leading-relaxed text-slate-300">
          <span className="font-semibold text-cyan-300">{tool.name}</span> — a fast, private workspace that runs entirely in
          your browser. Paste anything below, transform it with the operations, and export the result from the action bar.
          Nothing is uploaded, and nothing is stored.
        </p>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Field label="Input"><TextArea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste or type anything…" className="min-h-[180px]" /></Field>
          <div className="flex flex-wrap gap-2">
            {ops.map(([label, fn]) => (
              <Button key={label} variant="soft" className="text-xs" onClick={() => setOutput(fn(input))}>{label}</Button>
            ))}
          </div>
        </div>
        <Field label="Output"><OutputPanel value={output} /></Field>
      </div>
    </div>
  );
}

/* ================= dispatcher ================= */

export function ToolRenderer({ tool, onResult }: { tool: ToolMeta; onResult?: (r: ToolResult) => void }) {
  const mapped = SLUG_TO_COMPONENT[tool.slug];
  if (mapped) {
    const { C, variant, mode } = mapped;
    return <C onResult={onResult} variant={variant} mode={mode} />;
  }
  if (matchEngine(tool.name)) {
    return <EngineTool tool={tool} onResult={onResult} />;
  }
  return <WorkspaceTool tool={tool} onResult={onResult} />;
}
