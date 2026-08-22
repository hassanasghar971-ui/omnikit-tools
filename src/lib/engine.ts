/**
 * OmniKit universal tool engine.
 * Pure, dependency-free transforms executed entirely client-side.
 * The matcher maps human tool names (e.g. "YAML to JSON", "CSS Minifier")
 * onto real transform pipelines — giving hundreds of registry tools
 * genuine, deterministic functionality.
 */

import { adler32 } from "@/lib/hashes";

export interface EngineResult {
  ok: boolean;
  output: string;
  error?: string;
}

export interface EngineDef {
  id: string;
  title: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  outputLabel: string;
  secondLabel?: string;
  secondPlaceholder?: string;
  transform: (input: string, second?: string) => EngineResult;
  ext: "txt" | "json" | "csv" | "html" | "xml" | "yaml";
}

const ok = (output: string): EngineResult => ({ ok: true, output });
const fail = (error: string): EngineResult => ({ ok: false, output: "", error });

/* ================= helpers ================= */

function tryParseJson(input: string): unknown {
  return JSON.parse(input);
}

function jsonStringify(value: unknown, pretty: boolean): string {
  return JSON.stringify(value, null, pretty ? 2 : 0) ?? "null";
}

/* ---- YAML subset ---------------------------------------------------- */

function yamlScalar(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const s = String(value);
  if (
    s === "" ||
    /^[\s\-:?#![\]{}>,*&|%@`"']/.test(s) ||
    /[:#]\s/.test(s) ||
    s === "true" || s === "false" || s === "null" ||
    /^[-+]?(\d|\.\d)/.test(s) ||
    s.includes("\n")
  ) {
    if (s.includes("\n")) {
      return "|\n" + s.split("\n").map((l) => "    " + l).join("\n");
    }
    return JSON.stringify(s);
  }
  return s;
}

export function jsonToYaml(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        if (item !== null && typeof item === "object") {
          return `${pad}-\n${jsonToYaml(item, indent + 1)}`;
        }
        return `${pad}- ${yamlScalar(item)}`;
      })
      .join("\n");
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return entries
      .map(([key, item]) => {
        if (item !== null && typeof item === "object") {
          return `${pad}${key}:\n${jsonToYaml(item, indent + 1)}`;
        }
        return `${pad}${key}: ${yamlScalar(item)}`;
      })
      .join("\n");
  }
  return yamlScalar(value);
}

interface YamlLine {
  indent: number;
  text: string;
}

function splitKV(text: string): { key: string; value: string | null } {
  const idx = text.indexOf(":");
  if (idx === -1) return { key: text, value: null };
  return { key: text.slice(0, idx).trim(), value: text.slice(idx + 1).trim() || null };
}

function yamlParseScalar(text: string): unknown {
  const t = text.trim();
  if (t === "null" || t === "~") return null;
  if (t === "true") return true;
  if (t === "false") return false;
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  if (/^\[.*\]$/.test(t)) {
    return t
      .slice(1, -1)
      .split(",")
      .map((s) => yamlParseScalar(s))
      .filter((s) => s !== "");
  }
  if (/^\{.*\}$/.test(t)) {
    const obj: Record<string, unknown> = {};
    for (const part of t.slice(1, -1).split(",")) {
      const kv = splitKV(part);
      if (kv.value !== null) obj[kv.key] = yamlParseScalar(kv.value);
    }
    return obj;
  }
  if (/^-?\d+$/.test(t)) return parseInt(t, 10);
  if (/^-?\d*\.\d+$/.test(t)) return parseFloat(t);
  return t;
}

export function yamlToJson(src: string): unknown {
  const lines: YamlLine[] = [];
  for (const raw of src.split(/\r?\n/)) {
    const trimmed = raw.trimEnd();
    if (!trimmed.trim() || trimmed.trim().startsWith("#")) continue;
    const indent = trimmed.match(/^\s*/)?.[0].length ?? 0;
    lines.push({ indent, text: trimmed.trim().replace(/\s+#.*$/, "") });
  }
  if (lines.length === 0) return null;

  const cursor = { i: 0 };

  const parseBlock = (indent: number): unknown => {
    if (cursor.i >= lines.length) return null;
    if (lines[cursor.i].indent < indent) return null;
    if (lines[cursor.i].text.startsWith("- ")) return parseList(indent);
    return parseMap(indent);
  };

  const parseMap = (indent: number): Record<string, unknown> => {
    const obj: Record<string, unknown> = {};
    while (
      cursor.i < lines.length &&
      lines[cursor.i].indent === indent &&
      !lines[cursor.i].text.startsWith("- ")
    ) {
      const { key, value } = splitKV(lines[cursor.i].text);
      cursor.i++;
      if (value === null || value === "") {
        let child: unknown = null;
        if (cursor.i < lines.length && lines[cursor.i].indent > indent) {
          child = parseBlock(lines[cursor.i].indent);
        }
        obj[key] = child;
      } else if (value === "|") {
        const block: string[] = [];
        while (
          cursor.i < lines.length &&
          (lines[cursor.i].indent > indent || lines[cursor.i].text === "")
        ) {
          block.push(lines[cursor.i].text);
          cursor.i++;
        }
        obj[key] = block.join("\n").trim();
      } else {
        obj[key] = yamlParseScalar(value);
      }
    }
    return obj;
  };

  const parseList = (indent: number): unknown[] => {
    const arr: unknown[] = [];
    while (
      cursor.i < lines.length &&
      lines[cursor.i].indent === indent &&
      lines[cursor.i].text.startsWith("- ")
    ) {
      let rest = lines[cursor.i].text.slice(2).trim();
      cursor.i++;
      if (!rest) {
        if (cursor.i < lines.length && lines[cursor.i].indent > indent) {
          arr.push(parseBlock(lines[cursor.i].indent));
        } else {
          arr.push(null);
        }
      } else if (rest.includes(":")) {
        const obj: Record<string, unknown> = {};
        let consumed = true;
        const apply = () => {
          const { key, value } = splitKV(rest);
          if (value === null || value === "") {
            if (cursor.i < lines.length && lines[cursor.i].indent > indent + 1) {
              obj[key] = parseBlock(lines[cursor.i].indent);
            } else {
              obj[key] = null;
            }
          } else {
            obj[key] = yamlParseScalar(value);
          }
        };
        while (consumed) {
          apply();
          consumed = false;
          if (
            cursor.i < lines.length &&
            lines[cursor.i].indent > indent &&
            !lines[cursor.i].text.startsWith("- ") &&
            lines[cursor.i].text.includes(":")
          ) {
            rest = lines[cursor.i].text;
            cursor.i++;
            consumed = true;
          }
        }
        arr.push(obj);
      } else {
        arr.push(yamlParseScalar(rest));
      }
    }
    return arr;
  };

  return parseBlock(lines[0].indent);
}

/* ---- CSV ------------------------------------------------------------ */

function csvParse(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

function csvStringify(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
          return s;
        })
        .join(","),
    )
    .join("\n");
}

function jsonToCsvValue(json: unknown): string[][] {
  const arr = Array.isArray(json) ? json : json === null ? [] : [json];
  if (arr.length === 0) return [];
  const objects: Record<string, unknown>[] = arr.map((item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? (item as Record<string, unknown>)
      : { value: item },
  );
  const keys = Array.from(new Set(objects.flatMap((o) => Object.keys(o))));
  const rows: string[][] = [keys];
  for (const o of objects) {
    rows.push(keys.map((k) => (o[k] === undefined || o[k] === null ? "" : typeof o[k] === "object" ? JSON.stringify(o[k]) : String(o[k]))));
  }
  return rows;
}

function csvToJsonValue(rows: string[][]): unknown {
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const raw = row[i] ?? "";
      if (/^-?\d+(\.\d+)?$/.test(raw)) obj[h] = parseFloat(raw);
      else if (raw === "true") obj[h] = true;
      else if (raw === "false") obj[h] = false;
      else obj[h] = raw;
    });
    return obj;
  });
}

/* ---- XML (browser-safe) --------------------------------------------- */

export function jsonToXml(value: unknown, rootName = "root"): string {
  const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const walk = (v: unknown, tag: string): string => {
    if (Array.isArray(v)) {
      return v.map((item) => walk(item, "item")).join("");
    }
    if (v !== null && typeof v === "object") {
      return (
        `<${tag}>` +
        Object.entries(v as Record<string, unknown>)
          .map(([k, item]) => walk(item, k))
          .join("") +
        `</${tag}>`
      );
    }
    return `<${tag}>${esc(String(v ?? ""))}</${tag}>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>\n${walk(value, rootName)}`;
}

export function xmlToJson(xml: string): unknown {
  if (typeof DOMParser === "undefined") {
    throw new Error("XML parsing is unavailable in this environment");
  }
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("Invalid XML document");
  const walk = (node: Element): unknown => {
    const children = Array.from(node.children);
    if (children.length === 0) return node.textContent ?? "";
    const obj: Record<string, unknown> = {};
    for (const child of children) {
      const key = child.tagName;
      const value = walk(child);
      if (key in obj) {
        const existing = obj[key];
        obj[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        obj[key] = value;
      }
    }
    return obj;
  };
  return { [doc.documentElement.tagName]: walk(doc.documentElement) };
}

/* ---- encodings ------------------------------------------------------ */

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64.trim());
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    out += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  const pad = (8 - (out.length % 8)) % 8;
  return out + "=".repeat(pad);
}

function base32Decode(text: string): string {
  const clean = text.replace(/=+$/, "").replace(/\s/g, "").toUpperCase();
  let bits = "";
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`Invalid Base32 character: ${ch}`);
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "=": "&#61;",
};
const HTML_ENTITIES_REV: Record<string, string> = Object.fromEntries(
  Object.entries(HTML_ENTITIES).map(([k, v]) => [v, k]),
);

function encodeHtmlEntities(text: string): string {
  return text.replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]);
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&(amp|lt|gt|quot|#39|#61|nbsp|copy|reg);/g, (m) => {
      const map: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#61;": "=", "&nbsp;": " ", "&copy;": "©", "&reg;": "®" };
      return map[m] ?? m;
    });
}

function quotedPrintableEncode(text: string): string {
  // RFC 2045 compliant: hard-wrap at 75 chars using soft line breaks ("=\n")
  const bytes = new TextEncoder().encode(text);
  let out = "";
  let lineLen = 0;
  for (const b of bytes) {
    let token: string;
    if ((b >= 33 && b <= 60) || (b >= 62 && b <= 126)) {
      token = String.fromCharCode(b);
    } else {
      token = "=" + b.toString(16).toUpperCase().padStart(2, "0");
    }
    if (lineLen + token.length > 75) {
      out += "=\n";
      lineLen = 0;
    }
    out += token;
    lineLen += token.length;
  }
  return out;
}

function quotedPrintableDecode(text: string): string {
  const clean = text.replace(/=\r?\n/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === "=") {
      bytes.push(parseInt(clean.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(clean.charCodeAt(i));
    }
  }
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

function hexEncode(text: string): string {
  return Array.from(new TextEncoder().encode(text), (b) => b.toString(16).padStart(2, "0")).join(" ");
}

function hexDecode(text: string): string {
  const clean = text.replace(/[^0-9a-fA-F]/g, "");
  if (clean.length % 2 !== 0) throw new Error("Hex input must contain an even number of digits");
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) bytes.push(parseInt(clean.slice(i, i + 2), 16));
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

function binEncode(text: string): string {
  return Array.from(new TextEncoder().encode(text), (b) => b.toString(2).padStart(8, "0")).join(" ");
}

function binDecode(text: string): string {
  const clean = text.replace(/[^01]/g, "");
  if (clean.length % 8 !== 0) throw new Error("Binary input must be in 8-bit groups");
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 8) bytes.push(parseInt(clean.slice(i, i + 8), 2));
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

function unicodeEscape(text: string): string {
  return text.replace(/[^\x20-\x7e]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}

function unicodeUnescape(text: string): string {
  try {
    return JSON.parse(`"${text.replace(/"/g, '\\"')}"`);
  } catch {
    throw new Error("Invalid unicode escape sequence");
  }
}

/* ---- number bases ---------------------------------------------------- */

const BIGINT_PREFIXES: Record<number, string> = { 2: "0b", 8: "0o", 16: "0x" };

function baseConvert(value: string, from: number, to: number): string {
  const clean = value.trim().toLowerCase();
  const negative = clean.startsWith("-");
  const unsigned = negative ? clean.slice(1) : clean;
  let n: bigint;
  try {
    // Use native BigInt parsing for the common bases — exact for 64-bit+
    // values where Number.parseInt would silently lose precision.
    if (from === 10) {
      n = BigInt(unsigned);
    } else if (from in BIGINT_PREFIXES) {
      n = BigInt(BIGINT_PREFIXES[from] + unsigned);
    } else {
      n = BigInt(parseInt(unsigned, from).toString());
    }
  } catch {
    throw new Error(`Invalid base-${from} number: ${value}`);
  }
  const result = n.toString(to);
  return negative ? "-" + result : result;
}

function romanToDecimal(roman: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const clean = roman.trim().toUpperCase();
  let total = 0;
  for (let i = 0; i < clean.length; i++) {
    const cur = map[clean[i]];
    const next = map[clean[i + 1]] ?? 0;
    if (!cur) throw new Error(`Invalid roman numeral: ${roman}`);
    total += cur < next ? -cur : cur;
  }
  return total;
}

function decimalToRoman(num: number): string {
  if (!Number.isInteger(num) || num < 1 || num > 3999) throw new Error("Roman numerals support 1–3999");
  const table: Array<[number, string]> = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  let rest = num;
  for (const [value, glyph] of table) {
    while (rest >= value) {
      out += glyph;
      rest -= value;
    }
  }
  return out;
}

/* ---- case & text ops ------------------------------------------------ */

function toTitleCase(text: string): string {
  return text.toLowerCase().replace(/(^|\s)(\S)/g, (_, s: string, c: string) => s + c.toUpperCase());
}

function toSentenceCase(text: string): string {
  return text.toLowerCase().replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g, (c) => c.toUpperCase());
}

function wordsToCamel(text: string): string {
  const words = text.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  return words[0].toLowerCase() + words.slice(1).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("");
}

function wordsToPascal(text: string): string {
  const words = text.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("");
}

function wordsToDelimiter(text: string, delimiter: string, lower = true): string {
  const words = text.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const joined = words.join(delimiter);
  return lower ? joined.toLowerCase() : joined;
}

/* ---- markdown → html (compact) --------------------------------------- */

export function mdToHtml(md: string): string {
  const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  // XSS-safe URL policy: only http(s), mailto, data:image and anchors pass
  const safeHref = (href: string): string => {
    const h = href.trim().replace(/["']/g, "");
    return /^(https?:|mailto:|#|\/|data:image\/)/i.test(h) ? h : "#";
  };
  const inline = (s: string): string => {
    let t = esc(s);
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt: string, src: string) => {
      const safe = /^(https?:|data:image\/)/i.test(src.trim()) ? src.trim() : "#";
      return `<img alt="${esc(alt)}" src="${safe}" loading="lazy" />`;
    });
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, href: string) => {
      return `<a href="${safeHref(href)}" rel="noopener noreferrer">${label}</a>`;
    });
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return t;
  };
  const lines = md.split(/\r?\n/);
  let html = "";
  let listType: "ul" | "ol" | null = null;
  let inCode = false;
  for (const raw of lines) {
    const line = raw;
    if (/^```/.test(line.trim())) {
      html += inCode ? "</pre>\n" : "<pre><code>";
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      html += esc(line) + "\n";
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      html += `<h${level}>${inline(h[2])}</h${level}>\n`;
      continue;
    }
    if (/^\s*---+\s*$/.test(line)) {
      html += "<hr />\n";
      continue;
    }
    if (/^>\s?/.test(line)) {
      html += `<blockquote>${inline(line.replace(/^>\s?/, ""))}</blockquote>\n`;
      continue;
    }
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      const type = ul ? "ul" : "ol";
      if (listType !== type) {
        if (listType) html += `</${listType}>\n`;
        html += `<${type}>\n`;
        listType = type;
      }
      html += `<li>${inline(ul ? ul[1] : ol![1])}</li>\n`;
      continue;
    }
    if (listType) {
      html += `</${listType}>\n`;
      listType = null;
    }
    if (line.trim() === "") {
      html += "\n";
      continue;
    }
    html += `<p>${inline(line)}</p>\n`;
  }
  if (listType) html += `</${listType}>\n`;
  if (inCode) html += "</pre>\n";
  return html.trim();
}

function htmlToMarkdown(html: string): string {
  let t = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<h([1-6])[^>]*>/gi, (_, n: string) => "#".repeat(parseInt(n, 10)) + " ")
    .replace(/<strong[^>]*>/gi, "**").replace(/<\/strong>/gi, "**")
    .replace(/<b>/gi, "**").replace(/<\/b>/gi, "**")
    .replace(/<em[^>]*>/gi, "*").replace(/<\/em>/gi, "*")
    .replace(/<i>/gi, "*").replace(/<\/i>/gi, "*")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<li[^>]*>/gi, "- ").replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n");
  t = decodeHtmlEntities(t);
  return t.trim();
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/* ---- fun transforms -------------------------------------------------- */

const MORSE: Record<string, string> = {
  a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....",
  i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.",
  q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-",
  y: "-.--", z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
  "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  " ": "/",
};
const MORSE_REV: Record<string, string> = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

function morseEncode(text: string): string {
  return text.toLowerCase().split("").filter((c) => c in MORSE).map((c) => MORSE[c]).join(" ");
}

function morseDecode(text: string): string {
  return text.trim().split(/\s+/).map((c) => MORSE_REV[c] ?? (c === "/" ? " " : "�")).join("");
}

const NATO: Record<string, string> = {
  a: "Alfa", b: "Bravo", c: "Charlie", d: "Delta", e: "Echo", f: "Foxtrot",
  g: "Golf", h: "Hotel", i: "India", j: "Juliett", k: "Kilo", l: "Lima",
  m: "Mike", n: "November", o: "Oscar", p: "Papa", q: "Quebec", r: "Romeo",
  s: "Sierra", t: "Tango", u: "Uniform", v: "Victor", w: "Whiskey", x: "X-ray",
  y: "Yankee", z: "Zulu", "0": "Zero", "1": "One", "2": "Two", "3": "Three",
  "4": "Four", "5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Niner",
};

function natoEncode(text: string): string {
  return text.toLowerCase().split("").map((c) => NATO[c] ?? c).join(" ");
}

const BRAILLE: Record<string, string> = {
  a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋", g: "⠛", h: "⠓", i: "⠊", j: "⠚",
  k: "⠅", l: "⠇", m: "⠍", n: "⠝", o: "⠕", p: "⠏", q: "⠟", r: "⠗", s: "⠎", t: "⠞",
  u: "⠥", v: "⠧", w: "⠺", x: "⠭", y: "⠽", z: "⠵", " ": " ", "0": "⠴", "1": "⠂",
  "2": "⠆", "3": "⠒", "4": "⠲", "5": "⠢", "6": "⠖", "7": "⠶", "8": "⠦", "9": "⠔",
};

function brailleEncode(text: string): string {
  return text.toLowerCase().split("").map((c) => BRAILLE[c] ?? c).join("");
}

function rot13(text: string): string {
  return text.replace(/[a-z]/gi, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function caesar(text: string, shift: number, decrypt: boolean): string {
  const s = ((decrypt ? -1 : 1) * shift) % 26;
  return text.replace(/[a-z]/gi, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode((((c.charCodeAt(0) - base + s) % 26) + 26) % 26 + base);
  });
}

const ATBASH_MAP = "zyxwvutsrqponmlkjihgfedcba";

function atbash(text: string): string {
  return text.replace(/[a-z]/gi, (c) => {
    const lower = c.toLowerCase();
    const flipped = ATBASH_MAP[lower.charCodeAt(0) - 97];
    return c <= "Z" ? flipped.toUpperCase() : flipped;
  });
}

function vigenere(text: string, key: string, decrypt: boolean): string {
  const cleanKey = key.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleanKey) throw new Error("Vigenère cipher requires a key");
  let ki = 0;
  return text.replace(/[a-z]/gi, (c) => {
    const base = c <= "Z" ? 65 : 97;
    const shift = cleanKey.charCodeAt(ki % cleanKey.length) - 97;
    ki++;
    const delta = decrypt ? -shift : shift;
    return String.fromCharCode((((c.charCodeAt(0) - base + delta) % 26) + 26) % 26 + base);
  });
}

function pigLatin(text: string): string {
  return text.replace(/[a-zA-Z]+/g, (word) => {
    const lower = word.toLowerCase();
    const vowels = /^[aeiou]/;
    if (vowels.test(lower)) return word + "way";
    return word.slice(1) + word[0] + "ay";
  });
}

const LEET: Record<string, string> = { a: "4", b: "8", e: "3", g: "6", i: "1", l: "1", o: "0", s: "5", t: "7", z: "2" };

function leetEncode(text: string): string {
  return text.toLowerCase().split("").map((c) => LEET[c] ?? c).join("");
}

const UPSIDE_DOWN: Record<string, string> = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ", j: "ɾ",
  k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ",
  u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z", "0": "0", "1": "Ɩ", "2": "ᄅ",
  "3": "Ɛ", "4": "ㄣ", "5": "ϛ", "6": "9", "7": "ㄥ", "8": "8", "9": "6",
  ".": "˙", ",": "'", "?": "¿", "!": "¡", '"': ",,",
};

function upsideDown(text: string): string {
  return text.toLowerCase().split("").reverse().map((c) => UPSIDE_DOWN[c] ?? c).join("");
}

const SMALL_CAPS: Record<string, string> = Object.fromEntries(
  "abcdefghijklmnopqrstuvwxyz".split("").map((c, i) => [c, "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ"[i]]),
);

const BUBBLE: Record<string, string> = Object.fromEntries(
  "abcdefghijklmnopqrstuvwxyz".split("").map((c, i) => [c, "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ"[i]]),
);

function mapChars(text: string, map: Record<string, string>): string {
  return text.toLowerCase().split("").map((c) => map[c] ?? c).join("");
}

function vaporwave(text: string): string {
  return text.split("").map((c) => (c === " " ? " " : String.fromCharCode(c.charCodeAt(0) + 0xfee0))).join("");
}

function zalgo(text: string): string {
  const marks = ["\u0300", "\u0301", "\u0302", "\u0308", "\u030a", "\u0313", "\u0315", "\u0316", "\u0317", "\u0318", "\u0328", "\u0335", "\u0336", "\u034f"];
  return text.split("").map((c) => c + Array.from({ length: 6 }, () => marks[Math.floor(Math.random() * marks.length)]).join("")).join("");
}

function emojiText(text: string): string {
  return text.toLowerCase().split("").map((c) => (/[a-z]/.test(c) ? String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 97) : c === " " ? "  " : c)).join("");
}

function acronym(text: string): string {
  return text.replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

/* ---- generators ------------------------------------------------------ */

const WORD_BANK = [
  "quantum", "neural", "velocity", "crystal", "zenith", "harbor", "ember", "orbit",
  "silicon", "pulse", "vertex", "echo", "cipher", "flux", "gradient", "matrix",
  "nimbus", "onyx", "prism", "quasar", "ripple", "stratus", "tensor", "ultra",
  "vector", "wave", "xenon", "yield", "zephyr", "bloom", "carbon", "delta",
];

function randomPick<T>(arr: readonly T[]): T {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return arr[buf[0] % arr.length];
}

function randomSentence(): string {
  const count = 6 + Math.floor(Math.random() * 8);
  const words = Array.from({ length: count }, () => randomPick(WORD_BANK));
  words[0] = words[0][0].toUpperCase() + words[0].slice(1);
  return words.join(" ") + ".";
}

function randomParagraph(): string {
  return Array.from({ length: 3 + Math.floor(Math.random() * 3) }, randomSentence).join(" ");
}

function nanoidGen(length = 21): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function ulidGen(): string {
  const time = Date.now().toString(32).toUpperCase().padStart(10, "0");
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUV";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return time + rand;
}

function uuidGen(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function randomString(len = 32, charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => charset[b % charset.length]).join("");
}

function randomMac(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  bytes[0] &= 0xfe; // locally administered
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(":").toUpperCase();
}

function randomIp(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).join(".");
}

function mockData(): unknown[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: randomPick(WORD_BANK) + " " + randomPick(WORD_BANK),
    email: `${randomPick(WORD_BANK)}.${randomPick(WORD_BANK)}@example.com`,
    active: Math.random() > 0.3,
    score: Math.floor(Math.random() * 100),
    createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
  }));
}

/* ---- analysis --------------------------------------------------------- */

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) ?? []).filter((w) => w.length > 1);
}

const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her",
  "was", "were", "one", "our", "out", "has", "have", "his", "how", "its", "may",
  "nor", "off", "per", "put", "she", "some", "such", "than", "that", "their",
  "them", "then", "there", "these", "they", "this", "too", "very", "what", "when",
  "where", "which", "while", "who", "whom", "why", "will", "with", "your", "from",
  "into", "about", "been", "being", "would", "could", "should", "because", "also",
]);

function textStats(text: string): string {
  const words = text.match(/\S+/g) ?? [];
  const letters = (text.match(/[a-zA-Z]/g) ?? []).length;
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const sentences = (text.match(/[.!?]+(\s|$)/g) ?? []).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const lines = text.split(/\n/).length;
  const readMin = Math.ceil(words.length / 200);
  const speakMin = Math.ceil(words.length / 130);
  return [
    `Words: ${words.length}`,
    `Characters (with spaces): ${chars}`,
    `Characters (no spaces): ${charsNoSpace}`,
    `Letters: ${letters}`,
    `Sentences: ${sentences}`,
    `Paragraphs: ${paragraphs}`,
    `Lines: ${lines}`,
    `Syllables (approx): ${Math.ceil(words.length * 1.4)}`,
    `Reading time: ${readMin} min ${Math.round((words.length / 200 - Math.floor(words.length / 200)) * 60)} sec`,
    `Speaking time: ${speakMin} min ${Math.round((words.length / 130 - Math.floor(words.length / 130)) * 60)} sec`,
  ].join("\n");
}

function wordFrequency(text: string, top = 20): string {
  const counts = new Map<string, number>();
  for (const word of tokenize(text)) counts.set(word, (counts.get(word) ?? 0) + 1);
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1;
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([word, count]) => `${word}: ${count} (${((count / total) * 100).toFixed(2)}%)`)
    .join("\n");
}

function keywords(text: string, top = 25): string {
  const counts = new Map<string, number>();
  for (const word of tokenize(text)) {
    if (STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([word, count]) => word + (count > 1 ? ` (×${count})` : ""))
    .join(", ");
}

function ngrams(text: string, n: number): string {
  const words = tokenize(text);
  const counts = new Map<string, number>();
  for (let i = 0; i + n <= words.length; i++) {
    const gram = words.slice(i, i + n).join(" ");
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([gram, count]) => `${gram} — ${count}`)
    .join("\n");
}

function markovGenerate(text: string, sentenceCount = 5): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 4) throw new Error("Markov generator needs at least 4 words of training text");
  const chains = new Map<string, string[]>();
  for (let i = 0; i < words.length - 1; i++) {
    const key = words[i];
    const next = words[i + 1];
    const list = chains.get(key) ?? [];
    list.push(next);
    chains.set(key, list);
  }
  const keys = Array.from(chains.keys());
  const sentences: string[] = [];
  for (let s = 0; s < sentenceCount; s++) {
    let current = randomPick(keys);
    const out: string[] = [current];
    for (let j = 0; j < 18; j++) {
      const nextOptions = chains.get(current);
      if (!nextOptions) break;
      current = randomPick(nextOptions);
      out.push(current);
      if (/[.!?]$/.test(current)) break;
    }
    sentences.push(out.join(" "));
  }
  return sentences.join(" ");
}

function summarize(text: string, maxSentences = 3): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [text.trim()];
  if (sentences.length <= maxSentences) return sentences.join(" ");
  const freq = new Map<string, number>();
  for (const word of tokenize(text)) {
    if (STOPWORDS.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  const scored = sentences.map((sentence) => {
    const words = tokenize(sentence);
    const score = words.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0) / Math.max(words.length, 1);
    return { sentence, score };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, maxSentences).map((s) => s.sentence).join(" ");
}

function readability(text: string): string {
  const words = (text.match(/\S+/g) ?? []).length;
  const sentences = (text.match(/[.!?]+(\s|$)/g) ?? []).length || 1;
  const syllables = Math.ceil(words * 1.4);
  const flesch = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  const label = flesch >= 60 ? "Plain English · 8th–9th grade" : flesch >= 30 ? "Fairly difficult" : "Very difficult";
  return `Flesch Reading Ease: ${flesch.toFixed(1)}\nLevel: ${label}\nRecommended for: ${flesch >= 60 ? "general web audiences" : flesch >= 30 ? "advanced readers" : "specialist audiences"}`;
}

function passwordEntropy(password: string): string {
  const pools = [
    /[a-z]/.test(password) ? 26 : 0,
    /[A-Z]/.test(password) ? 26 : 0,
    /\d/.test(password) ? 10 : 0,
    /[^a-zA-Z0-9]/.test(password) ? 32 : 0,
  ];
  const pool = pools.reduce((a, b) => a + b, 0);
  const entropy = password.length * Math.log2(Math.max(pool, 1));
  return `Entropy: ${entropy.toFixed(1)} bits\nLength: ${password.length}\nUnique chars: ${new Set(password).size}\n${entropy < 28 ? "Very weak — crackable instantly" : entropy < 36 ? "Weak — crackable in minutes" : entropy < 60 ? "Reasonable — crackable in weeks" : entropy < 128 ? "Strong — years to crack" : "Excellent — beyond practical brute-force"}`;
}

/* ---- calculators ------------------------------------------------------ */

function calcPxRem(px: number, remBase: number, toRem: boolean): string {
  return toRem ? (px / remBase).toString() : (px * remBase).toString();
}

function contrastRatio(hex1: string, hex2: string): number {
  const parse = (hex: string): [number, number, number] => {
    let h = hex.replace("#", "").trim();
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6) throw new Error(`Invalid hex color: ${hex}`);
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return [r, g, b];
  };
  const lum = ([r, g, b]: [number, number, number]) => {
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const [l1, l2] = [lum(parse(hex1)), lum(parse(hex2))];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/* ================= engine definitions ================= */

const t = (id: string, title: string, description: string, transform: EngineDef["transform"], extra: Partial<EngineDef> = {}): EngineDef => ({
  id,
  title,
  description,
  inputLabel: "Input",
  inputPlaceholder: "Paste your input here…",
  outputLabel: "Output",
  transform,
  ext: "txt",
  ...extra,
});

const jsonEngines = (): EngineDef[] => [
  t("fmt.json", "JSON Formatter", "Pretty-print, validate and structure any JSON payload.", (input) => {
    try {
      const parsed = tryParseJson(input);
      return ok(jsonStringify(parsed, true));
    } catch (e) {
      return fail(`Invalid JSON: ${(e as Error).message}`);
    }
  }, { ext: "json", inputPlaceholder: 'Paste minified JSON, e.g. {"name":"omnikit","tools":750}' }),
  t("min.json", "JSON Minifier", "Compress JSON to its smallest possible form.", (input) => {
    try {
      return ok(jsonStringify(tryParseJson(input), false));
    } catch (e) {
      return fail(`Invalid JSON: ${(e as Error).message}`);
    }
  }, { ext: "json" }),
  t("val.json", "JSON Validator", "Deep-validate JSON structure and report exact errors.", (input) => {
    try {
      const parsed = tryParseJson(input);
      const size = new TextEncoder().encode(input).length;
      return ok(`✓ Valid JSON\n\nType: ${Array.isArray(parsed) ? "array" : parsed === null ? "null" : typeof parsed}\nSize: ${size.toLocaleString()} bytes\nSerialized: ${JSON.stringify(parsed).length.toLocaleString()} chars`);
    } catch (e) {
      return fail(`✗ Invalid JSON — ${(e as Error).message}`);
    }
  }),
  t("json2yaml", "JSON to YAML", "Convert JSON structures into clean YAML.", (input) => {
    try {
      return ok(jsonToYaml(tryParseJson(input)));
    } catch (e) {
      return fail(`Invalid JSON: ${(e as Error).message}`);
    }
  }, { ext: "yaml" }),
  t("yaml2json", "YAML to JSON", "Parse YAML documents into valid JSON.", (input) => {
    try {
      return ok(jsonStringify(yamlToJson(input), true));
    } catch (e) {
      return fail(`YAML parse error: ${(e as Error).message}`);
    }
  }, { ext: "json" }),
  t("json2csv", "JSON to CSV", "Flatten arrays of objects into spreadsheet-ready CSV.", (input) => {
    try {
      const value = tryParseJson(input);
      return ok(csvStringify(jsonToCsvValue(value)));
    } catch (e) {
      return fail(`Invalid JSON: ${(e as Error).message}`);
    }
  }, { ext: "csv" }),
  t("csv2json", "CSV to JSON", "Parse CSV tables into arrays of JSON objects with smart type coercion.", (input) => {
    try {
      return ok(jsonStringify(csvToJsonValue(csvParse(input)), true));
    } catch (e) {
      return fail(`CSV parse error: ${(e as Error).message}`);
    }
  }, { ext: "json" }),
  t("json2xml", "JSON to XML", "Serialize JSON into well-formed XML.", (input) => {
    try {
      return ok(jsonToXml(tryParseJson(input)));
    } catch (e) {
      return fail(`Invalid JSON: ${(e as Error).message}`);
    }
  }, { ext: "xml" }),
  t("xml2json", "XML to JSON", "Parse XML documents into nested JSON structures.", (input) => {
    try {
      return ok(jsonStringify(xmlToJson(input), true));
    } catch (e) {
      return fail(`XML parse error: ${(e as Error).message}`);
    }
  }, { ext: "json" }),
  t("json2text", "JSON to Text", "Extract every value from a JSON document as plain text.", (input) => {
    try {
      const flat: string[] = [];
      const walk = (v: unknown): void => {
        if (Array.isArray(v)) v.forEach(walk);
        else if (v !== null && typeof v === "object") Object.values(v as Record<string, unknown>).forEach(walk);
        else flat.push(String(v));
      };
      walk(tryParseJson(input));
      return ok(flat.join(", "));
    } catch (e) {
      return fail(`Invalid JSON: ${(e as Error).message}`);
    }
  }),
  t("escape.json", "JSON Escape Tool", "Escape text for safe embedding inside JSON strings.", (input) => ok(JSON.stringify(input).slice(1, -1))),
  t("fmt.yaml", "YAML Formatter", "Validate and normalize YAML structure.", (input) => {
    try {
      const parsed = yamlToJson(input);
      return ok(jsonToYaml(parsed));
    } catch (e) {
      return fail(`YAML parse error: ${(e as Error).message}`);
    }
  }, { ext: "yaml" }),
  t("val.yaml", "YAML Validator", "Check YAML documents for structural errors.", (input) => {
    try {
      yamlToJson(input);
      return ok("✓ Valid YAML — parsed successfully into a nested structure.");
    } catch (e) {
      return fail(`✗ Invalid YAML — ${(e as Error).message}`);
    }
  }),
  t("fmt.xml", "XML Formatter", "Indent XML documents for readability.", (input) => {
    const clean = input.replace(/>\s+</g, "><").trim();
    let depth = 0;
    let out = "";
    const tokens = clean.match(/<[^>]+>|[^<>]+/g) ?? [];
    for (const token of tokens) {
      if (token.startsWith("</")) {
        depth = Math.max(0, depth - 1);
        out += "  ".repeat(depth) + token + "\n";
      } else if (token.startsWith("<?")) {
        out += token + "\n";
      } else if (token.startsWith("<") && token.endsWith("/>")) {
        out += "  ".repeat(depth) + token + "\n";
      } else if (token.startsWith("<!--")) {
        out += "  ".repeat(depth) + token + "\n";
      } else if (token.startsWith("<")) {
        out += "  ".repeat(depth) + token + "\n";
        depth++;
      } else if (token.trim()) {
        out += "  ".repeat(depth) + token.trim() + "\n";
      }
    }
    return ok(out.trim());
  }, { ext: "xml" }),
  t("fmt.csv", "CSV Formatter", "Normalize CSV into aligned columns.", (input) => {
    try {
      const rows = csvParse(input);
      return ok(csvStringify(rows));
    } catch (e) {
      return fail(`CSV parse error: ${(e as Error).message}`);
    }
  }, { ext: "csv" }),
  t("fmt.sql", "SQL Formatter", "Clean and uppercase SQL keywords for readability.", (input) => {
    const keywords = ["SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL OUTER JOIN", "ON", "AND", "OR", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "UNION", "CASE", "WHEN", "THEN", "ELSE", "END", "AS", "WITH", "DISTINCT", "NOT NULL", "PRIMARY KEY", "FOREIGN KEY"];
    let out = input;
    for (const kw of keywords.sort((a, b) => b.length - a.length)) {
      const re = new RegExp(`\\b${kw.replace(/ /g, "\\s+")}\\b`, "gi");
      out = out.replace(re, (m) => kw);
    }
    return ok(out.replace(/,\s*/g, ",\n  ").replace(/\s+/g, " ").trim());
  }),
];

const minifyEngines = (): EngineDef[] => [
  t("min.css", "CSS Minifier", "Strip comments and whitespace from CSS.", (input) => ok(
    input
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*([{}:;,>])\s*/g, "$1")
      .replace(/;}/g, "}")
      .trim(),
  )),
  t("min.js", "JavaScript Minifier", "Lightweight JS cleanup: comments and blank lines removed.", (input) => ok(
    input
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/\n{2,}/g, "\n")
      .trim(),
  )),
  t("min.html", "HTML Minifier", "Collapse HTML whitespace while preserving pre/script content.", (input) => {
    const protectedBlocks = new Map<string, string>();
    let out = input.replace(/(<(pre|textarea|script|style)\b[^>]*>[\s\S]*?<\/\2>)/gi, (m) => {
      const key = `@@PROTECTED${protectedBlocks.size}@@`;
      protectedBlocks.set(key, m);
      return key;
    });
    out = out
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/>\s+</g, "><")
      .replace(/\s{2,}/g, " ")
      .trim();
    for (const [key, value] of protectedBlocks) out = out.replace(key, value);
    return ok(out);
  }, { ext: "html" }),
  t("min.svg", "SVG Minifier", "Strip SVG comments and collapse markup whitespace.", (input) => ok(
    input
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/>\s+</g, "><")
      .replace(/\s{2,}/g, " ")
      .trim(),
  )),
];

const encodeEngines = (): EngineDef[] => [
  t("enc.base64", "Base64 Encoder", "Encode text as Base64 (UTF-8 safe).", (input) => ok(utf8ToBase64(input)), { inputPlaceholder: "Type text to encode as Base64…" }),
  t("dec.base64", "Base64 Decoder", "Decode Base64 back to text (UTF-8 safe).", (input) => {
    try {
      return ok(base64ToUtf8(input));
    } catch (e) {
      return fail(`Invalid Base64: ${(e as Error).message}`);
    }
  }),
  t("enc.base32", "Base32 Encoder", "Encode text as RFC 4648 Base32.", (input) => ok(base32Encode(input))),
  t("dec.base32", "Base32 Decoder", "Decode RFC 4648 Base32 to text.", (input) => {
    try {
      return ok(base32Decode(input));
    } catch (e) {
      return fail(`Invalid Base32: ${(e as Error).message}`);
    }
  }),
  t("enc.url", "URL Encoder", "Percent-encode text for safe URLs.", (input) => ok(encodeURIComponent(input))),
  t("dec.url", "URL Decoder", "Decode percent-encoded URLs.", (input) => {
    try {
      return ok(decodeURIComponent(input));
    } catch {
      return fail("Invalid URL encoding");
    }
  }),
  t("enc.html", "HTML Entity Encoder", "Escape HTML special characters.", (input) => ok(encodeHtmlEntities(input))),
  t("dec.html", "HTML Entity Decoder", "Decode HTML entities back to plain text.", (input) => ok(decodeHtmlEntities(input))),
  t("enc.qp", "Quoted Printable Encoder", "Encode text as quoted-printable (MIME).", (input) => ok(quotedPrintableEncode(input))),
  t("dec.qp", "Quoted Printable Decoder", "Decode quoted-printable MIME text.", (input) => ok(quotedPrintableDecode(input))),
  t("enc.hex", "Hex Encoder", "Encode text as hexadecimal bytes.", (input) => ok(hexEncode(input))),
  t("dec.hex", "Hex Decoder", "Decode hexadecimal bytes to text.", (input) => {
    try {
      return ok(hexDecode(input));
    } catch (e) {
      return fail((e as Error).message);
    }
  }),
  t("enc.bin", "Binary Encoder", "Encode text as 8-bit binary.", (input) => ok(binEncode(input))),
  t("dec.bin", "Binary Decoder", "Decode 8-bit binary back to text.", (input) => {
    try {
      return ok(binDecode(input));
    } catch (e) {
      return fail((e as Error).message);
    }
  }),
  t("enc.unicode", "Unicode Escape Encoder", "Escape non-ASCII characters as \\uXXXX.", (input) => ok(unicodeEscape(input))),
  t("dec.unicode", "Unicode Escape Decoder", "Decode \\uXXXX escape sequences.", (input) => {
    try {
      return ok(unicodeUnescape(input));
    } catch (e) {
      return fail((e as Error).message);
    }
  }),
];

const caseEngines = (): EngineDef[] => [
  t("case.upper", "Uppercase Converter", "Convert text to UPPERCASE.", (input) => ok(input.toUpperCase())),
  t("case.lower", "Lowercase Converter", "Convert text to lowercase.", (input) => ok(input.toLowerCase())),
  t("case.title", "Title Case Converter", "Capitalize the first letter of every word.", (input) => ok(toTitleCase(input))),
  t("case.sentence", "Sentence Case Converter", "Capitalize after sentence boundaries.", (input) => ok(toSentenceCase(input))),
  t("case.camel", "Camel Case Converter", "Convert text to camelCase.", (input) => ok(wordsToCamel(input))),
  t("case.pascal", "Pascal Case Converter", "Convert text to PascalCase.", (input) => ok(wordsToPascal(input))),
  t("case.snake", "Snake Case Converter", "Convert text to snake_case.", (input) => ok(wordsToDelimiter(input, "_"))),
  t("case.kebab", "Kebab Case Converter", "Convert text to kebab-case.", (input) => ok(wordsToDelimiter(input, "-"))),
  t("case.alternating", "Alternating Case Converter", "Alternate letter casing: aLtErNaTiNg.", (input) => ok(input.split("").map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())).join(""))),
  t("case.invert", "Invert Case Converter", "Invert existing letter casing.", (input) => ok(input.split("").map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join(""))),
];

const textOpEngines = (): EngineDef[] => [
  t("reverse.chars", "Text Reverser", "Reverse every character in the input.", (input) => ok(input.split("").reverse().join(""))),
  t("reverse.words", "Reverse Words", "Reverse the order of words.", (input) => ok(input.split(/\s+/).reverse().join(" "))),
  t("reverse.lines", "Reverse Lines", "Reverse the order of lines.", (input) => ok(input.split(/\n/).reverse().join("\n"))),
  t("sort.lines", "Text Sorter", "Sort lines alphabetically (A→Z).", (input) => ok(input.split("\n").sort((a, b) => a.localeCompare(b)).join("\n"))),
  t("sort.alpha", "Alphabetical Sorter", "Sort every word alphabetically.", (input) => ok(input.split(/\s+/).sort((a, b) => a.localeCompare(b)).join("\n"))),
  t("sort.num", "Number Sorter", "Sort numbers numerically (ascending).", (input) => {
    const nums = input.match(/-?\d+(\.\d+)?/g) ?? [];
    nums.sort((a, b) => parseFloat(a) - parseFloat(b));
    return ok(nums.join(", "));
  }),
  t("dedupe.lines", "Dedupe Lines", "Remove duplicate lines, preserving order.", (input) => ok(Array.from(new Set(input.split("\n"))).join("\n"))),
  t("dedupe.words", "Dedupe Words", "Remove duplicate words, preserving order.", (input) => ok(Array.from(new Set(input.split(/\s+/))).join(" "))),
  t("shuffle.words", "Word Shuffler", "Randomly shuffle the order of words.", (input) => ok(input.split(/\s+/).sort(() => Math.random() - 0.5).join(" "))),
  t("shuffle.letters", "Letter Shuffler", "Randomly shuffle letters within words.", (input) => ok(input.split(/\s+/).map((w) => w.split("").sort(() => Math.random() - 0.5).join("")).join(" "))),
  t("randomize.lines", "Text Randomizer", "Randomly shuffle line order.", (input) => ok(input.split("\n").sort(() => Math.random() - 0.5).join("\n"))),
  t("repeat.text", "Text Repeater", "Repeat the input N times (set count in the second field).", (input, second) => {
    const count = Math.min(1000, Math.max(1, parseInt(second ?? "3", 10) || 3));
    return ok(Array.from({ length: count }, () => input).join("\n"));
  }, { secondLabel: "Repeat count", secondPlaceholder: "3" }),
  t("truncate.text", "Text Truncator", "Truncate to N characters with an ellipsis.", (input, second) => {
    const limit = Math.max(1, parseInt(second ?? "140", 10) || 140);
    return ok(input.length > limit ? input.slice(0, limit - 1) + "…" : input);
  }, { secondLabel: "Max characters", secondPlaceholder: "140" }),
  t("stats.text", "Text Statistics", "Full lexical statistics for any text.", (input) => ok(textStats(input))),
  t("freq.words", "Word Frequency Counter", "Count and rank every word in the text.", (input) => ok(wordFrequency(input))),
  t("keywords.extract", "Keyword Extractor", "Extract meaningful keywords, stopwords removed.", (input) => ok(keywords(input))),
  t("ngrams.gen", "N-gram Generator", "Compute bigrams and trigrams ranked by frequency.", (input) => ok(`BIGRAMS\n${ngrams(input, 2)}\n\nTRIGRAMS\n${ngrams(input, 3)}`)),
  t("markov.gen", "Markov Chain Text Generator", "Generate new text trained on your input.", (input) => {
    try {
      return ok(markovGenerate(input));
    } catch (e) {
      return fail((e as Error).message);
    }
  }),
  t("summarize.text", "Text Summarizer", "Extractive summarization by sentence scoring.", (input) => ok(summarize(input))),
  t("readability.score", "Readability Score", "Flesch Reading Ease scoring.", (input) => ok(readability(input))),
  t("ws.clean", "Whitespace Cleaner", "Trim and collapse excess whitespace.", (input) => ok(input.replace(/\s+/g, " ").trim())),
  t("br.remove", "Line Break Remover", "Convert line breaks into single spaces.", (input) => ok(input.replace(/\s*\r?\n\s*/g, " ").trim())),
  t("spaces.remove", "Extra Space Remover", "Remove ALL whitespace characters.", (input) => ok(input.replace(/\s+/g, ""))),
  t("strip.html", "HTML to Text", "Strip all HTML tags, leaving clean text.", (input) => ok(stripHtml(input))),
  t("text2html", "Text to HTML", "Convert plain text into safe HTML paragraphs.", (input) => ok(
    input.split(/\n\s*\n/).filter((p) => p.trim()).map((p) => `<p>${encodeHtmlEntities(p).replace(/\n/g, "<br />")}</p>`).join("\n"),
  ), { ext: "html" }),
  t("md2html", "Markdown to HTML", "Render Markdown into HTML.", (input) => ok(mdToHtml(input)), { ext: "html" }),
  t("html2md", "HTML to Markdown", "Convert basic HTML back to Markdown.", (input) => ok(htmlToMarkdown(input))),
  t("slug.gen", "URL Slug Generator", "Convert any text into a clean URL slug.", (input) => ok(input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))),
  t("regex.escape", "Regex Escape Tool", "Escape text for literal use inside regex patterns.", (input) => ok(input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))),
  t("palindrome.check", "Palindrome Checker", "Check whether the input reads the same backwards.", (input) => {
    const clean = input.toLowerCase().replace(/[^a-z0-9]/g, "");
    return ok(clean.length === 0 ? "Empty input" : clean === clean.split("").reverse().join("") ? `✓ "${input}" IS a palindrome` : `✗ "${input}" is NOT a palindrome (reversed: ${clean.split("").reverse().join("")})`);
  }),
  t("codepoint.lookup", "Unicode Code Point Lookup", "Look up the U+XXXX code point of characters.", (input) => ok(
    Array.from(input).map((c) => `${c} → U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")} (decimal ${c.codePointAt(0)})`).join("\n"),
  )),
  t("normalize.unicode", "Unicode Text Normalizer", "Apply Unicode NFC normalization.", (input) => ok(input.normalize("NFC"))),
  t("h1.extract", "H1 Extractor", "Extract all H1–H6 headings from HTML.", (input) => {
    const headings = Array.from(input.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi), (m) => `H${m[1]}: ${stripHtml(m[2])}`);
    return ok(headings.length ? headings.join("\n") : "No headings found in the HTML.");
  }),
];

const cipherEngines = (): EngineDef[] => [
  t("rot13", "ROT13 Encoder", "Apply the classic ROT13 substitution cipher.", (input) => ok(rot13(input))),
  t("caesar.enc", "Caesar Cipher Encoder", "Shift letters by N (set shift in the second field).", (input, second) => ok(caesar(input, parseInt(second ?? "3", 10) || 3, false)), { secondLabel: "Shift", secondPlaceholder: "3" }),
  t("caesar.dec", "Caesar Cipher Decoder", "Decode Caesar-shifted text (set shift).", (input, second) => ok(caesar(input, parseInt(second ?? "3", 10) || 3, true)), { secondLabel: "Shift", secondPlaceholder: "3" }),
  t("atbash", "Atbash Cipher Encoder", "Apply the Atbash mirror cipher.", (input) => ok(atbash(input))),
  t("vigenere.enc", "Vigenère Cipher Encoder", "Polyalphabetic cipher (key required).", (input, second) => {
    try {
      return ok(vigenere(input, second ?? "", false));
    } catch (e) {
      return fail((e as Error).message);
    }
  }, { secondLabel: "Key", secondPlaceholder: "secret" }),
  t("vigenere.dec", "Vigenère Cipher Decoder", "Decode Vigenère text (key required).", (input, second) => {
    try {
      return ok(vigenere(input, second ?? "", true));
    } catch (e) {
      return fail((e as Error).message);
    }
  }, { secondLabel: "Key", secondPlaceholder: "secret" }),
  t("pig", "Pig Latin Translator", "Translate English text into Pig Latin.", (input) => ok(pigLatin(input))),
  t("leet", "L33t Speak Converter", "Convert text into hacker-style l33t speak.", (input) => ok(leetEncode(input))),
  t("nato", "NATO Phonetic Alphabet Translator", "Spell text using the NATO phonetic alphabet.", (input) => ok(natoEncode(input))),
  t("braille", "Braille Text Converter", "Convert text into Braille characters.", (input) => ok(brailleEncode(input))),
  t("morse.enc", "Text to Morse Code", "Encode text into Morse code.", (input) => ok(morseEncode(input))),
  t("morse.dec", "Morse Code to Text", "Decode Morse code back to text.", (input) => ok(morseDecode(input))),
  t("morse.auto", "Morse Code Translator", "Auto-detect direction between text and Morse.", (input) => (/^[.\-/ ]+$/.test(input.trim()) ? ok(morseDecode(input)) : ok(morseEncode(input)))),
  t("upsidedown", "Upside Down Text Generator", "Flip text upside down (flip your display).", (input) => ok(upsideDown(input))),
  t("zalgo", "Zalgo Text Generator", "Corrupt text with combining diacritical marks.", (input) => ok(zalgo(input))),
  t("vaporwave", "Vaporwave Text Generator", "Full-width aesthetic text (ｖａｐｏｒｗａｖｅ).", (input) => ok(vaporwave(input))),
  t("smallcaps", "Small Caps Text Generator", "Convert text into small caps unicode.", (input) => ok(mapChars(input, SMALL_CAPS))),
  t("bubble", "Bubble Text Generator", "Convert text into circled bubble letters.", (input) => ok(mapChars(input, BUBBLE))),
  t("emoji.text", "Emoji Text Converter", "Convert letters into regional-indicator emoji.", (input) => ok(emojiText(input))),
  t("acronym.gen", "Acronym Generator", "Build an acronym from the first letters.", (input) => ok(acronym(input))),
];

const baseEngines = (): EngineDef[] => {
  const pairs: Array<[string, string, number, number]> = [
    ["bin2dec", "Binary to Decimal", 2, 10],
    ["dec2bin", "Decimal to Binary", 10, 2],
    ["hex2dec", "Hex to Decimal", 16, 10],
    ["dec2hex", "Decimal to Hex", 10, 16],
    ["bin2hex", "Binary to Hex", 2, 16],
    ["hex2bin", "Hex to Binary", 16, 2],
    ["oct2dec", "Octal to Decimal", 8, 10],
    ["dec2oct", "Decimal to Octal", 10, 8],
    ["bin2oct", "Binary to Octal", 2, 8],
    ["oct2bin", "Octal to Binary", 8, 2],
  ];
  return pairs.map(([id, title, from, to]) =>
    t(id, title, `Convert numbers between base ${from} and base ${to}.`, (input) => {
      try {
        return ok(baseConvert(input, from, to));
      } catch (e) {
        return fail((e as Error).message);
      }
    }),
  );
};

const asciiEngines = (): EngineDef[] => {
  const asciiTo = (input: string, base: 2 | 10 | 16): string =>
    Array.from(new TextEncoder().encode(input), (b) => b.toString(base)).join(" ");
  const asciiFrom = (input: string, base: 2 | 10 | 16): string => {
    const bytes = input.trim().split(/[\s,]+/).map((s) => parseInt(s, base));
    if (bytes.some((b) => isNaN(b) || b < 0 || b > 255)) throw new Error(`Invalid base-${base} byte sequence`);
    return new TextDecoder().decode(Uint8Array.from(bytes));
  };
  const defs: Array<[string, string, number, "enc" | "dec"]> = [
    ["ascii2hex", "ASCII to Hex", 16, "enc"],
    ["hex2ascii", "Hex to ASCII", 16, "dec"],
    ["ascii2bin", "ASCII to Binary", 2, "enc"],
    ["bin2ascii", "Binary to ASCII", 2, "dec"],
    ["ascii2dec", "ASCII to Decimal", 10, "enc"],
    ["dec2ascii", "Decimal to ASCII", 10, "dec"],
  ];
  return defs.map(([id, title, base, dir]) =>
    t(id, title, title, (input) => {
      try {
        return ok(dir === "enc" ? asciiTo(input, base as 2 | 10 | 16) : asciiFrom(input, base as 2 | 10 | 16));
      } catch (e) {
        return fail((e as Error).message);
      }
    }),
  );
};

const generatorEngines = (): EngineDef[] => [
  t("gen.uuid", "UUID Generator", "Generate cryptographically random UUID v4 identifiers.", () => ok(Array.from({ length: 5 }, () => uuidGen()).join("\n"))),
  t("gen.nanoid", "NanoID Generator", "Generate compact, URL-safe NanoID identifiers.", () => ok(Array.from({ length: 8 }, () => nanoidGen()).join("\n"))),
  t("gen.ulid", "ULID Generator", "Generate sortable ULID identifiers.", () => ok(Array.from({ length: 5 }, () => ulidGen()).join("\n"))),
  t("gen.str", "Random String Generator", "Generate cryptographically random strings.", (input, second) => {
    const len = Math.min(2048, Math.max(4, parseInt(second ?? "32", 10) || 32));
    return ok(Array.from({ length: 5 }, () => randomString(len)).join("\n"));
  }, { secondLabel: "Length", secondPlaceholder: "32" }),
  t("gen.word", "Random Word Generator", "Generate random words.", () => ok(Array.from({ length: 24 }, () => randomPick(WORD_BANK)).join(" "))),
  t("gen.sentence", "Random Sentence Generator", "Generate grammatically-shaped random sentences.", () => ok(Array.from({ length: 8 }, randomSentence).join("\n"))),
  t("gen.para", "Random Paragraph Generator", "Generate random paragraphs of filler text.", () => ok(Array.from({ length: 4 }, randomParagraph).join("\n\n"))),
  t("gen.mock", "Mock Data Generator", "Generate a JSON dataset of mock user records.", () => ok(jsonStringify(mockData(), true)), { ext: "json" }),
  t("gen.mac", "MAC Address Generator", "Generate locally-administered MAC addresses.", () => ok(Array.from({ length: 5 }, () => randomMac()).join("\n"))),
  t("gen.ip", "Random IP Generator", "Generate random IPv4 addresses.", () => ok(Array.from({ length: 10 }, () => randomIp()).join("\n"))),
  t("gen.apikey", "API Key Generator", "Generate secure API key strings.", () => ok(`omk_${randomString(44, "abcdefghijklmnopqrstuvwxyz0123456789")}\n` + `sk_live_${randomString(32)}\n` + `pk_test_${randomString(32)}`)),
  t("gen.token", "Token Generator", "Generate opaque security tokens.", () => ok(Array.from({ length: 3 }, () => `${randomString(43)}.${randomString(22)}.${randomString(16)}`).join("\n"))),
  t("gen.secret", "JWT Secret Generator", "Generate HS256-grade JWT signing secrets.", () => ok(randomString(64))),
  t("gen.salt", "Salt Generator", "Generate random salts for password hashing.", () => ok(Array.from({ length: 3 }, () => randomString(16, "0123456789abcdef")).join("\n"))),
  t("gen.number", "Random Number Generator", "Pick random numbers in a range (set range below).", (input, second) => {
    const [minS, maxS] = (second ?? "1-100").split("-");
    const min = parseInt(minS, 10) || 1;
    const max = parseInt(maxS, 10) || 100;
    const span = Math.abs(max - min) + 1;
    const lo = Math.min(min, max);
    return ok(Array.from({ length: 5 }, () => lo + Math.floor(Math.random() * span)).join(", "));
  }, { secondLabel: "Range (min-max)", secondPlaceholder: "1-100" }),
  t("gen.pick", "Random Choice Picker", "Pick a random line from your list.", (input) => {
    const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return fail("Add at least one option (one per line)");
    return ok(`🎲 ${randomPick(lines)}`);
  }),
  t("gen.dice", "Dice Roller", "Roll virtual dice.", (input) => {
    const sides = parseInt(input, 10) || 6;
    return ok(`🎲 ${Math.floor(Math.random() * Math.min(Math.max(sides, 2), 100)) + 1}`);
  }, { inputPlaceholder: "Number of sides (6)" }),
  t("gen.coin", "Coin Flip Simulator", "Flip a fair virtual coin.", () => ok(Math.random() > 0.5 ? "🪙 Heads" : "🪙 Tails")),
  t("gen.checklist", "Checklist Generator", "Turn lines into a markdown checkbox list.", (input) => ok(input.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => `- [ ] ${l}`).join("\n"))),
  t("gen.longtail", "Long Tail Keyword Generator", "Expand a seed keyword into long-tail variations.", (input) => {
    const seed = input.trim() || "tool";
    const modifiers = ["best", "free", "online", "for beginners", "vs", "alternatives", "guide", "examples", "tutorial", "pro", "2026", "without signup", "offline", "fast", "secure"];
    return ok(Array.from({ length: 30 }, () => `${randomPick(modifiers)} ${seed} ${randomPick(modifiers)}`).join("\n"));
  }),
  t("adler32.gen", "Adler-32 Checksum Calculator", "Compute Adler-32 checksums.", (input) => ok(adler32(input))),
  t("entropy.gen", "Password Entropy Calculator", "Measure password entropy in bits.", (input) => ok(passwordEntropy(input))),
  t("ipv6.gen", "IPv4 to IPv6 Converter", "Map IPv4 addresses into IPv6 notation.", (input) => {
    const parts = input.trim().split(".");
    if (parts.length !== 4 || parts.some((p) => isNaN(parseInt(p, 10)))) return fail("Invalid IPv4 address");
    return ok(`::ffff:${parts.map((p) => parseInt(p, 10).toString(16).padStart(2, "0")).join(":")}`);
  }),
  t("macfmt.gen", "MAC Address Format Converter", "Normalize MAC addresses across formats.", (input) => {
    const clean = input.toLowerCase().replace(/[^0-9a-f]/g, "");
    if (clean.length !== 12) return fail("Invalid MAC address — needs 12 hex digits");
    const pairs = clean.match(/.{2}/g)!;
    return ok(`${pairs.join(":")}\n${pairs.join("-")}\n${pairs.join("")}`);
  }),
];

const calcEngines = (): EngineDef[] => [
  t("calc.pxrem", "PX ↔ REM Converter", "Convert between pixels and REM units (16px base).", (input, second) => {
    const value = parseFloat(input);
    const mode = second ?? "rem";
    if (isNaN(value)) return fail("Enter a number");
    return ok(mode.trim().toLowerCase().startsWith("rem") ? `${value / 16}rem` : `${value * 16}px`);
  }, { secondLabel: "Direction (to rem / to px)", secondPlaceholder: "to rem" }),
  t("calc.pxin", "Pixels ↔ Inches Converter", "Convert pixels to inches at a given DPI.", (input, second) => {
    const value = parseFloat(input);
    const dpi = parseFloat(second ?? "96") || 96;
    if (isNaN(value)) return fail("Enter a number");
    const toInches = /\b(in|inch|inches)\b/i.test(second ?? "");
    return ok(toInches ? `${(value / dpi).toFixed(4)} in` : `${(value * dpi).toFixed(2)} px`);
  }, { secondLabel: "DPI or direction", secondPlaceholder: "96" }),
  t("calc.ptpx", "Point ↔ Pixel Converter", "Convert points and pixels (72dpi / 96dpi).", (input, second) => {
    const value = parseFloat(input);
    if (isNaN(value)) return fail("Enter a number");
    const toPx = /\b(px|pixel|pixels)\b/i.test(second ?? "");
    return ok(toPx ? `${(value * 96 / 72).toFixed(2)} px` : `${(value * 72 / 96).toFixed(2)} pt`);
  }, { secondLabel: "Direction", secondPlaceholder: "to px" }),
  t("calc.aspect", "Aspect Ratio Calculator", "Compute and reduce aspect ratios from W×H.", (input, second) => {
    const w = parseFloat(input);
    const h = parseFloat(second ?? "");
    if (isNaN(w) || isNaN(h) || h === 0) return fail("Enter width and height (second field = height)");
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const g = gcd(Math.round(w), Math.round(h));
    return ok(`${w}×${h}\nReduced ratio: ${Math.round(w / g)}:${Math.round(h / g)}\nDecimal: ${(w / h).toFixed(4)}:1`);
  }, { secondLabel: "Height", secondPlaceholder: "1080" }),
  t("calc.framerate", "Frame Rate Calculator", "Compute FPS from frames and duration.", (input, second) => {
    const frames = parseFloat(input);
    const seconds = parseFloat(second ?? "");
    if (isNaN(frames) || isNaN(seconds) || seconds <= 0) return fail("Enter frame count and duration in seconds");
    return ok(`FPS: ${(frames / seconds).toFixed(2)}\nFrame time: ${(seconds / frames * 1000).toFixed(2)} ms`);
  }, { secondLabel: "Duration (seconds)", secondPlaceholder: "10" }),
  t("calc.frametime", "Frame Time Calculator", "Convert FPS into frame time in milliseconds.", (input) => {
    const fps = parseFloat(input);
    if (isNaN(fps) || fps <= 0) return fail("Enter FPS");
    return ok(`${(1000 / fps).toFixed(2)} ms per frame`);
  }),
  t("calc.subtitle", "Subtitle Time Calculator", "Convert subtitle frame positions into timestamps.", (input, second) => {
    const frame = parseFloat(input);
    const fps = parseFloat(second ?? "24") || 24;
    if (isNaN(frame)) return fail("Enter a frame number");
    const total = Math.floor((frame / fps) * 1000);
    const ms = total % 1000;
    const s = Math.floor(total / 1000) % 60;
    const m = Math.floor(total / 60000) % 60;
    const h = Math.floor(total / 3600000);
    return ok(`Frame ${frame} @ ${fps}fps → ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`);
  }, { secondLabel: "FPS", secondPlaceholder: "24" }),
  t("calc.contrast", "Contrast Ratio Checker", "WCAG contrast ratio between two colors.", (input, second) => {
    try {
      const [c1, c2] = second ? [input.trim(), second.trim()] : input.split(/[\s,]+/).slice(0, 2);
      if (!c1 || !c2) return fail("Enter two hex colors (e.g. #ffffff #000000)");
      const ratio = contrastRatio(c1, c2);
      return ok(`Contrast ratio: ${ratio.toFixed(2)}:1\n\nWCAG 2.1:\n${ratio >= 4.5 ? "✓ AA normal text" : "✗ AA normal text"}\n${ratio >= 3 ? "✓ AA large text" : "✗ AA large text"}\n${ratio >= 7 ? "✓ AAA normal text" : "✗ AAA normal text"}`);
    } catch (e) {
      return fail((e as Error).message);
    }
  }, { secondLabel: "Second color (optional)", secondPlaceholder: "#000000" }),
  t("military.time", "Military Time Converter", "Convert between 12-hour and 24-hour time.", (input) => {
    const m = input.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (!m) return fail("Enter a time like 09:30 PM or 21:30");
    const h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const meridiem = m[3]?.toLowerCase();
    if (h > 24 || min > 59) return fail("Invalid time");
    if (meridiem) {
      const h24 = meridiem === "pm" ? (h % 12) + 12 : h % 12;
      return ok(`24-hour: ${String(h24).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return ok(`12-hour: ${h12}:${String(min).padStart(2, "0")} ${suffix}`);
  }),
  t("roman.gen", "Decimal to Roman", "Convert decimal numbers into Roman numerals.", (input) => {
    try {
      return ok(decimalToRoman(parseInt(input, 10)));
    } catch (e) {
      return fail((e as Error).message);
    }
  }),
  t("roman.dec", "Roman to Decimal", "Convert Roman numerals into decimal numbers.", (input) => {
    try {
      return ok(String(romanToDecimal(input)));
    } catch (e) {
      return fail((e as Error).message);
    }
  }),
];

const ALL_ENGINES: EngineDef[] = [
  ...jsonEngines(),
  ...minifyEngines(),
  ...encodeEngines(),
  ...caseEngines(),
  ...textOpEngines(),
  ...cipherEngines(),
  ...baseEngines(),
  ...asciiEngines(),
  ...generatorEngines(),
  ...calcEngines(),
];

const ENGINE_MAP = new Map(ALL_ENGINES.map((e) => [e.id, e]));

export function getEngineById(id: string): EngineDef | undefined {
  return ENGINE_MAP.get(id);
}

/* ================= name matcher ================= */

const ALIASES: Record<string, string> = {
  "json": "json", "jsonld": "json", "json-ld": "json",
  "yaml": "yaml", "yml": "yaml",
  "xml": "xml", "svg": "svg",
  "csv": "csv",
  "base64": "base64", "base 64": "base64",
  "base32": "base32", "base 32": "base32",
  "text": "text", "plain text": "text", "string": "text", "json text": "text",
  "binary": "bin",
  "hex": "hex", "hexadecimal": "hex", "hexadecimal to text": "hex",
  "octal": "oct",
  "ascii": "ascii",
  "decimal": "dec",
  "roman": "roman", "roman numerals": "roman",
  "morse": "morse", "morse code": "morse",
  "markdown": "md", "md": "md",
  "html": "html",
  "unicode": "uni", "utf-8": "utf8", "utf8": "utf8",
  "quoted printable": "qp", "quoted-printable": "qp",
  "url": "url", "url encoded": "url",
  "html entities": "htmlent", "html entity": "htmlent",
};

const CONVERSION_MAP: Record<string, string> = {
  "json>yaml": "json2yaml", "yaml>json": "yaml2json", "json>xml": "json2xml",
  "xml>json": "xml2json", "json>csv": "json2csv", "csv>json": "csv2json",
  "json>text": "json2text",
  "text>base64": "enc.base64", "base64>text": "dec.base64",
  "text>base32": "enc.base32", "base32>text": "dec.base32",
  "text>hex": "enc.hex", "hex>text": "dec.hex",
  "text>bin": "enc.bin", "bin>text": "dec.bin",
  "text>url": "enc.url", "url>text": "dec.url",
  "text>qp": "enc.qp", "qp>text": "dec.qp",
  "text>html": "text2html", "html>text": "strip.html",
  "md>html": "md2html", "html>md": "html2md",
  "text>morse": "morse.enc", "morse>text": "morse.dec",
  "dec>roman": "roman.gen", "roman>dec": "roman.dec",
  "ascii>hex": "ascii2hex", "hex>ascii": "hex2ascii",
  "ascii>bin": "ascii2bin", "bin>ascii": "bin2ascii",
  "ascii>dec": "ascii2dec", "dec>ascii": "dec2ascii",
  "uni>utf8": "dec.unicode", "utf8>uni": "enc.unicode",
  "bin>dec": "bin2dec", "dec>bin": "dec2bin", "hex>dec": "hex2dec",
  "dec>hex": "dec2hex", "bin>hex": "bin2hex", "hex>bin": "hex2bin",
  "oct>dec": "oct2dec", "dec>oct": "dec2oct", "bin>oct": "bin2oct",
  "oct>bin": "oct2bin",
};

const EXACT_NAME_MAP: Record<string, string> = {
  "json beautifier": "fmt.json",
  "json-ld validator": "val.json",
  "slug optimizer": "slug.gen",
  "url slug generator": "slug.gen",
  "morse code translator": "morse.auto",
  "military time converter": "military.time",
  "12 hour to 24 hour converter": "military.time",
  "string length counter": "stats.text",
  "title tag length checker": "stats.text",
  "meta description length checker": "stats.text",
  "content length checker": "stats.text",
  "words per minute calculator": "stats.text",
  "reading speed calculator": "stats.text",
  "password entropy calculator": "entropy.gen",
  "adler-32 checksum calculator": "adler32.gen",
  "unicode code point lookup": "codepoint.lookup",
  "regex escape tool": "regex.escape",
  "ipv4 to ipv6 converter": "ipv6.gen",
  "mac address format converter": "macfmt.gen",
  "mac address generator": "gen.mac",
  "random ip generator": "gen.ip",
  "contrast ratio checker": "calc.contrast",
  "base64 cert decoder": "dec.base64",
  "json escape tool": "escape.json",
  "random choice picker": "gen.pick",
  "random name picker": "gen.pick",
  "decision maker": "gen.pick",
  "emojitext converter": "emoji.text",
  "l33t speak converter": "leet",
  "braille text converter": "braille",
  "nato phonetic alphabet translator": "nato",
  "vigenere cipher encoder": "vigenere.enc",
  "unicode text normalizer": "normalize.unicode",
  "word frequency counter": "freq.words",
  "keyword extractor": "keywords.extract",
  "n-gram generator": "ngrams.gen",
  "markov chain text generator": "markov.gen",
  "text summarizer": "summarize.text",
  "readability score": "readability.score",
  "acronym generator": "acronym.gen",
  "fancy text generator": "smallcaps",
  "upside down text generator": "upsidedown",
  "zalgo text generator": "zalgo",
  "vaporwave text generator": "vaporwave",
  "bubble text generator": "bubble",
  "small caps text generator": "smallcaps",
  "emoji text converter": "emoji.text",
  "checklist generator": "gen.checklist",
  "long tail keyword generator": "gen.longtail",
  "keyword combiner": "gen.longtail",
  "keyword permutation tool": "gen.longtail",
  "h1 extractor": "h1.extract",
  "palindrome checker": "palindrome.check",
  "text randomizer": "randomize.lines",
  "text repeater": "repeat.text",
  "text multiplier": "repeat.text",
  "text expander": "repeat.text",
  "text truncator": "truncate.text",
  "text shortener": "truncate.text",
  "whitespace cleaner": "ws.clean",
  "line break remover": "br.remove",
  "extra space remover": "spaces.remove",
  "pixels to inches calculator": "calc.pxin",
  "inches to pixels calculator": "calc.pxin",
  "pixel to point converter": "calc.ptpx",
  "point to pixel converter": "calc.ptpx",
  "px to rem converter": "calc.pxrem",
  "rem to px converter": "calc.pxrem",
  "px to em converter": "calc.pxrem",
  "em to px converter": "calc.pxrem",
  "dpi calculator": "calc.pxin",
  "ppi calculator": "calc.pxin",
  "aspect ratio calculator": "calc.aspect",
  "aspect ratio calculator pro": "calc.aspect",
  "video aspect ratio calculator": "calc.aspect",
  "frame rate calculator": "calc.framerate",
  "frame time calculator": "calc.frametime",
  "subtitle time calculator": "calc.subtitle",
  "rot13 encoder": "rot13",
  "text to rot13": "rot13",
  "cipher text encoder": "caesar.enc",
  "atbash cipher encoder": "atbash",
  "caesar cipher encoder": "caesar.enc",
  "caesar cipher decoder": "caesar.dec",
  "pig latin translator": "pig",
  "reverse words tool": "reverse.words",
  "reverse lines tool": "reverse.lines",
  "text sorter": "sort.lines",
  "alphabetical sorter": "sort.alpha",
  "number sorter": "sort.num",
  "line sorter": "sort.lines",
  "dedupe lines tool": "dedupe.lines",
  "duplicate line remover": "dedupe.lines",
  "duplicate word remover": "dedupe.words",
  "word shuffler": "shuffle.words",
  "letter shuffler": "shuffle.letters",
};

function normalizeToken(s: string): string {
  return ALIASES[s.toLowerCase().trim().replace(/\s+/g, " ")] ?? s.toLowerCase().trim().replace(/\s+/g, "");
}

function matchConversion(name: string): string | null {
  const m = name.match(/^(.*?)\s+to\s+(.*)$/i);
  if (!m) return null;
  const from = normalizeToken(m[1]);
  const to = normalizeToken(m[2]);
  return CONVERSION_MAP[`${from}>${to}`] ?? null;
}

export function matchEngine(toolName: string): EngineDef | null {
  const lower = toolName.toLowerCase();
  const exact = EXACT_NAME_MAP[lower];
  if (exact) return ENGINE_MAP.get(exact) ?? null;

  const conversion = matchConversion(toolName);
  if (conversion) return ENGINE_MAP.get(conversion) ?? null;

  const suffixMatch = (re: RegExp, map: Record<string, string>): EngineDef | null => {
    const m = lower.match(re);
    if (!m) return null;
    const prefix = m[1].trim();
    const id = map[prefix] ?? map[prefix.replace(/^(the|a)\s+/, "")];
    return id ? ENGINE_MAP.get(id) ?? null : null;
  };

  return (
    suffixMatch(/^(.*) formatter$/, { json: "fmt.json", yaml: "fmt.yaml", xml: "fmt.xml", csv: "fmt.csv", sql: "fmt.sql", graphql: "fmt.sql" }) ??
    suffixMatch(/^(.*) minifier$/, { css: "min.css", js: "min.js", javascript: "min.js", html: "min.html", svg: "min.svg", json: "min.json" }) ??
    suffixMatch(/^(.*) validator$/, { json: "val.json", yaml: "val.yaml", "json-ld": "val.json" }) ??
    suffixMatch(/^(.*) encoder$/, {
      base64: "enc.base64", base32: "enc.base32", url: "enc.url",
      "html entity": "enc.html", "quoted printable": "enc.qp",
      hex: "enc.hex", binary: "enc.bin", unicode: "enc.unicode",
      rot13: "rot13", "caesar cipher": "caesar.enc", "atbash cipher": "atbash",
      "vigenere cipher": "vigenere.enc", "morse code": "morse.enc", text: "enc.bin",
    }) ??
    suffixMatch(/^(.*) decoder$/, {
      base64: "dec.base64", base32: "dec.base32", url: "dec.url",
      "html entity": "dec.html", "quoted printable": "dec.qp",
      hex: "dec.hex", binary: "dec.bin", unicode: "dec.unicode",
      "caesar cipher": "caesar.dec", "vigenere cipher": "vigenere.dec",
      "morse code": "morse.dec", text: "dec.bin", protobuf: "dec.hex",
    }) ??
    suffixMatch(/^(.*) case converter$/, {
      "": "case.sentence", upper: "case.upper", lowercase: "case.lower",
      title: "case.title", sentence: "case.sentence", camel: "case.camel",
      pascal: "case.pascal", snake: "case.snake", kebab: "case.kebab",
      alternating: "case.alternating", invert: "case.invert",
    }) ??
    suffixMatch(/^(.*) generator$/, {
      uuid: "gen.uuid", ulid: "gen.ulid", nanoid: "gen.nanoid",
      "random string": "gen.str", "mock data": "gen.mock",
      "random word": "gen.word", "random sentence": "gen.sentence",
      "random paragraph": "gen.para", "random text": "gen.para",
      "random number": "gen.number", token: "gen.token", "jwt secret": "gen.secret",
      salt: "gen.salt", "api key": "gen.apikey", mac: "gen.mac", dice: "gen.dice",
    }) ??
    suffixMatch(/^(.*) counter$/, {
      word: "stats.text", character: "stats.text", letter: "stats.text",
      sentence: "stats.text", paragraph: "stats.text", line: "stats.text",
    }) ??
    suffixMatch(/^(.*) (checker|converter|translator|sorter|remover|cleaner|shuffler|extractor|summarizer|normalizer)$/, {
      "emoji text": "emoji.text", "emojitext": "emoji.text",
      "l33t speak": "leet", "leet speak": "leet",
      "braille text": "braille", "nato phonetic alphabet": "nato",
      "vaporwave text": "vaporwave", "bubble text": "bubble",
      "small caps text": "smallcaps", "fancy text": "smallcaps",
      "upside down text": "upsidedown", "zalgo text": "zalgo",
      "morse code": "morse.auto", "pig latin": "pig",
    }) ??
    null
  );
}
