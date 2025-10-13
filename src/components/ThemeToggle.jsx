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
    small: "w-12 h-6",
    default: "w-16 h-8",
    large: "w-20 h-10",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-foreground">
          {isDark ? "Темная" : "Светлая"}
        </span>
      )}

      <div className={`toggle-switch ${sizeClasses[size]}`}>
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
