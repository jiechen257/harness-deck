import { useEffect, useState } from "react";

import type { Theme } from "../lib/types";

const STORAGE_KEY = "harnessdeck.theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return [theme, setTheme] as const;
}
