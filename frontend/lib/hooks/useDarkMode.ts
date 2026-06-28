"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyTheme,
  getResolvedTheme,
  getStoredTheme,
  setTheme as persistTheme,
  type Theme,
} from "@/lib/theme/themeManager";

export function useDarkMode() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const setTheme = useCallback((t: Theme) => {
    persistTheme(t);
    setThemeState(t);
    setResolvedTheme(getResolvedTheme(t));
  }, []);

  useEffect(() => {
    const stored = getStoredTheme();
    const resolved = getResolvedTheme(stored);
    applyTheme(resolved);
    setThemeState(stored);
    setResolvedTheme(resolved);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      const current = getStoredTheme();
      if (current !== "system") return;
      const next = getResolvedTheme("system");
      applyTheme(next);
      setResolvedTheme(next);
    };

    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  return { theme, resolvedTheme, setTheme };
}
