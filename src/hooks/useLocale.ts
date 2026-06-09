import { useEffect, useState } from "react";

import type { Locale } from "../lib/types";

const STORAGE_KEY = "harnessdeck.locale";

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "en-US" ? "en-US" : "zh-CN";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  return [locale, setLocale] as const;
}
