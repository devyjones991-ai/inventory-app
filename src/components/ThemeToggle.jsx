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
    // Проверяем сохраненную тему или системную
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);

    // Применяем тему
    document.documentElement.setAttribute(
      "data-theme",
      shouldBeDark ? "dark" : "light",
    );
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
    small: "w-10 h-3", // 2.5rem x 0.75rem
    default: "w-14 h-4", // 3.5rem x 1rem
    large: "w-18 h-5", // 4.5rem x 1.25rem
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
