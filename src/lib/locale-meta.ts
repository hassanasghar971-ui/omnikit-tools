/**
 * Locale metadata & detection — intentionally dictionary-free.
 * This module is tiny (<2KB) and safe for the base client bundle:
 * importing it never drags the 26 translation payloads along.
 * Urdu and Hindi are excluded by policy.
 */

export type Locale =
  | "en"
  | "zh-CN"
  | "zh-TW"
  | "es"
  | "ar"
  | "fr"
  | "bn"
  | "pt"
  | "ru"
  | "ja"
  | "de"
  | "jv"
  | "ko"
  | "vi"
  | "it"
  | "tr"
  | "fa"
  | "ta"
  | "pl"
  | "uk"
  | "ro"
  | "nl"
  | "hu"
  | "el"
  | "sv"
  | "th";

export const LOCALES: Locale[] = [
  "en", "zh-CN", "zh-TW", "es", "ar", "fr", "bn", "pt", "ru", "ja", "de",
  "jv", "ko", "vi", "it", "tr", "fa", "ta", "pl", "uk", "ro", "nl", "hu",
  "el", "sv", "th",
];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  es: "Español",
  ar: "العربية",
  fr: "Français",
  bn: "বাংলা",
  pt: "Português",
  ru: "Русский",
  ja: "日本語",
  de: "Deutsch",
  jv: "Basa Jawa",
  ko: "한국어",
  vi: "Tiếng Việt",
  it: "Italiano",
  tr: "Türkçe",
  fa: "فارسی",
  ta: "தமிழ்",
  pl: "Polski",
  uk: "Українська",
  ro: "Română",
  nl: "Nederlands",
  hu: "Magyar",
  el: "Ελληνικά",
  sv: "Svenska",
  th: "ไทย",
};

export type Dict = Record<string, string>;

export function resolveLocale(raw?: string | null): Locale {
  if (!raw) return "en";
  const lang = raw.toLowerCase();
  if (lang.startsWith("zh")) {
    return lang.includes("tw") || lang.includes("hk") || lang.includes("hant")
      ? "zh-TW"
      : "zh-CN";
  }
  const two = lang.slice(0, 2);
  const map: Record<string, Locale> = {
    en: "en", es: "es", de: "de", fr: "fr", pt: "pt", ja: "ja", ar: "ar",
    ru: "ru", ro: "ro", bn: "bn", jv: "jv", ko: "ko", vi: "vi", it: "it",
    tr: "tr", fa: "fa", ta: "ta", pl: "pl", uk: "uk", nl: "nl", hu: "hu",
    el: "el", sv: "sv", th: "th",
  };
  return map[two] ?? "en";
}

export function isRtl(locale: Locale): boolean {
  return locale === "ar" || locale === "fa";
}
