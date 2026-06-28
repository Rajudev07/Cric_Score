"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useDarkMode } from "@/lib/hooks/useDarkMode";
import type { Theme } from "@/lib/theme/themeManager";
import { cn } from "@/lib/utils";

const MODE_LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

function nextTheme(current: Theme): Theme {
  if (current === "light") return "dark";
  if (current === "dark") return "system";
  return "light";
}

export default function ThemeToggle() {
  const { theme, setTheme } = useDarkMode();

  const ariaLabel =
    theme === "light"
      ? "Switch to dark mode"
      : theme === "dark"
        ? "Switch to light mode"
        : "Using system theme";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme(theme))}
      aria-label={ariaLabel}
      title={MODE_LABELS[theme]}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
      )}
    >
      {theme === "light" ? (
        <Sun className="h-5 w-5" aria-hidden />
      ) : theme === "dark" ? (
        <Moon className="h-5 w-5" aria-hidden />
      ) : (
        <Laptop className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}
