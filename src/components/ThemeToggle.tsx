import React, { useState, useEffect } from "react";
import "../assets/theme-toggle.css";

interface ThemeToggleProps {
  className?: string;
  size?: "small" | "default" | "large";
}

export default function ThemeToggle({
  className = "",
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

  return (
    <div className={`toggle-switch ${sizeClasses[size]} ${className}`}>
      <label className="switch-label">
        <input
          type="checkbox"
          className="checkbox"
          checked={isDark}
          onChange={toggleTheme}
          aria-label={
            isDark
              ? "Переключить на светлую тему"
              : "Переключить на темную тему"
          }
        />
        <span className="slider"></span>
      </label>
    </div>
  );
}
