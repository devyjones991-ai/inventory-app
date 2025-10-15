import React, { useState, useEffect } from "react";
import "../assets/theme-toggle.css";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: "small" | "default" | "large";
}

export default function ThemeToggle({
  className = "",
  showLabel = true,
  size = "default",
}: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Проверяем, что уже установлено в HTML (из скрипта в index.html)
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const isCurrentlyDark = currentTheme === "dark";

    // Синхронизируем состояние с HTML
    setIsDark(isCurrentlyDark);

    // Если тема не установлена, устанавливаем по умолчанию
    if (!currentTheme) {
      const savedTheme = localStorage.getItem("theme");
      const prefersDark =
        typeof window !== "undefined" && window.matchMedia
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
          : false;

      const shouldBeDark =
        savedTheme === "dark" || (!savedTheme && prefersDark);
      setIsDark(shouldBeDark);
      document.documentElement.setAttribute(
        "data-theme",
        shouldBeDark ? "dark" : "light",
      );
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const sizeClasses = {
    small: "w-8 h-8",
    default: "w-10 h-10",
    large: "w-12 h-12",
  };

  const iconSizes = {
    small: "w-4 h-4",
    default: "w-5 h-5",
    large: "w-6 h-6",
  };

  return (
    <button
      onClick={toggleTheme}
      className={`${sizeClasses[size]} ${className} rounded-lg border border-border bg-background p-2 transition-colors hover:bg-accent`}
      aria-label={isDark ? "Переключить на светлую тему" : "Переключить на темную тему"}
      title={isDark ? "Переключить на светлую тему" : "Переключить на темную тему"}
    >
      <div className="relative">
        <svg
          className={`${iconSizes[size]} transition-opacity ${
            isDark ? "opacity-0" : "opacity-100"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <svg
          className={`${iconSizes[size]} absolute top-0 left-0 transition-opacity ${
            isDark ? "opacity-100" : "opacity-0"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>
      {showLabel && (
        <span className="ml-2 text-sm">
          {isDark ? "Темная" : "Светлая"}
        </span>
      )}
    </button>
  );
}
