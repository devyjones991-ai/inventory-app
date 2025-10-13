import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import "../assets/theme-toggle.css";

export default function ThemeToggle({
  className = "",
  showLabel = true,
  size = "default",
}) {
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

      // Применяем тему
      document.documentElement.setAttribute(
        "data-theme",
        shouldBeDark ? "dark" : "light",
      );
    }
  }, []);

  const handleToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    // Сохраняем в localStorage
    localStorage.setItem("theme", newTheme ? "dark" : "light");

    // Применяем тему
    document.documentElement.setAttribute(
      "data-theme",
      newTheme ? "dark" : "light",
    );
  };

  const sizeClasses = {
    small: "w-10 h-3 sm:w-8 sm:h-2.5", // 2.5rem x 0.75rem на десктопе, меньше на мобильных
    default: "w-14 h-4 sm:w-11 sm:h-3.5", // 3.5rem x 1rem на десктопе, меньше на мобильных
    large: "w-18 h-5 sm:w-14 sm:h-4", // 4.5rem x 1.25rem на десктопе, меньше на мобильных
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-foreground leading-none">
          {isDark ? "Темная" : "Светлая"}
        </span>
      )}

      <div className={`toggle-switch ${sizeClasses[size]} flex items-center`}>
        <label className="switch-label">
          <input
            type="checkbox"
            className="checkbox"
            checked={isDark}
            onChange={handleToggle}
            aria-label="Переключить тему"
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
}

ThemeToggle.propTypes = {
  className: PropTypes.string,
  showLabel: PropTypes.bool,
  size: PropTypes.oneOf(["small", "default", "large"]),
};
