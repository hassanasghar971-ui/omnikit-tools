"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EN_DICT } from "@/lib/locales/en";
import {
  isRtl,
  LOCALES,
  resolveLocale,
  type Dict,
  type Locale,
} from "@/lib/locale-meta";

/**
 * Light-speed i18n:
 * - The English baseline (~2KB) ships with the base bundle, so first paint
 *   and SSR hydration need no translation payload.
 * - The full 26-dictionary registry lazy-loads on mount — only after the
 *   user's locale is detected — keeping initial JS execution minimal.
 * - Race-proof: rapid language switches invalidate stale loads via a
 *   sequence token. Any failure self-heals to the English baseline.
 */

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string>) => string;
  dir: "ltr" | "rtl";
  ready: boolean;
}

const STORAGE_KEY = "omnikit-locale";

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => undefined,
  t: (key) => EN_DICT[key] ?? key,
  dir: "ltr",
  ready: false,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [dict, setDict] = useState<Dict>(EN_DICT);
  const [ready, setReady] = useState(false);
  const loadSeq = useRef(0);

  const applyLocale = useCallback(async (next: Locale) => {
    const seq = ++loadSeq.current;
    setLocaleState(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
      document.documentElement.dir = isRtl(next) ? "rtl" : "ltr";
    }
    if (next === "en") {
      setDict(EN_DICT);
      setReady(true);
      return;
    }
    try {
      // Lazy-load the 26-dictionary registry — keeps the base bundle lean.
      const { DICTIONARIES } = await import("@/lib/locales");
      if (seq !== loadSeq.current) return; // superseded by a newer selection
      setDict(DICTIONARIES[next] ?? EN_DICT);
    } catch {
      if (seq !== loadSeq.current) return;
      setDict(EN_DICT); // self-healing fallback
    } finally {
      if (seq === loadSeq.current) setReady(true);
    }
  }, []);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
      // Self-healing: discard corrupt or unsupported stored values.
      if (stored && !LOCALES.includes(stored as Locale)) {
        window.localStorage.removeItem(STORAGE_KEY);
        stored = null;
      }
    } catch {
      stored = null;
    }
    const detected = resolveLocale(
      stored ?? (typeof navigator !== "undefined" ? navigator.language : null),
    );
    void applyLocale(detected);
    return () => {
      // Intentional: the cleanup must bump the LATEST token so any
      // in-flight dictionary load resolves as stale (race protection).
      // eslint-disable-next-line react-hooks/exhaustive-deps
      loadSeq.current++;
    };
  }, [applyLocale]);

  const setLocale = useCallback(
    (next: Locale) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* private mode — in-memory only */
      }
      void applyLocale(next);
    },
    [applyLocale],
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      let value = dict[key] ?? EN_DICT[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          value = value.replaceAll(`{${k}}`, v);
        }
      }
      return value;
    },
    [dict],
  );

  return (
    <I18nContext.Provider
      value={{ locale, setLocale, t, dir: isRtl(locale) ? "rtl" : "ltr", ready }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
