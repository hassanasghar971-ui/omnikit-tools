"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DICTIONARIES,
  isRtl,
  resolveLocale,
  type Dict,
  type Locale,
} from "@/lib/locales";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string>) => string;
  dir: "ltr" | "rtl";
  ready: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => undefined,
  t: (key) => key,
  dir: "ltr",
  ready: false,
});

const STORAGE_KEY = "omnikit-locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [dict, setDict] = useState<Dict>(DICTIONARIES.en);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const detected = resolveLocale(
      stored ?? navigator.language ?? "en",
    );
    setLocaleState(detected);
    setDict(DICTIONARIES[detected]);
    setReady(true);
    document.documentElement.lang = detected;
    document.documentElement.dir = isRtl(detected) ? "rtl" : "ltr";
    // Self-healing: clear corrupt locale storage
    if (stored && !(stored in DICTIONARIES)) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    return () => {
      mounted = false;
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setDict(DICTIONARIES[next]);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage may be unavailable in private mode */
    }
    document.documentElement.lang = next;
    document.documentElement.dir = isRtl(next) ? "rtl" : "ltr";
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      let value = dict[key] ?? DICTIONARIES.en[key] ?? key;
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
    <I18nContext.Provider value={{ locale, setLocale, t, dir: isRtl(locale) ? "rtl" : "ltr", ready }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
