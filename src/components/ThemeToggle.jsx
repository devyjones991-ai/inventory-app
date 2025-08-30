import React, { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";

const THEME_KEY = "theme";
const DEFAULT_THEME = "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    try {
      const stored =
        typeof localStorage !== "undefined" && localStorage.getItem(THEME_KEY);
      if (stored === "light" || stored === "dark") return stored;
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_KEY, theme);
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  return (
    <Button
      size="sm"
      className="transition-none"
      onClick={toggleTheme}
      aria-label={t("common.themeToggle")}
    >
      {theme === "light" ? (
        <MoonIcon className="w-4 h-4" />
      ) : (
        <SunIcon className="w-4 h-4" />
      )}
    </Button>
  );
}
