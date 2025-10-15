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
    <div className={`toggle-switch ${sizeClasses[size]} ${className}`}>
      <label className="switch-label">
        <input
          type="checkbox"
          className="checkbox"
          checked={isDark}
          onChange={toggleTheme}
        />
        <span className="slider"></span>
      </label>
    </div>
  );
}
