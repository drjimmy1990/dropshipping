"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "./Icon";

export const ThemeToggle: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-md text-text-secondary hover:bg-surface-sunken transition-colors duration-150 ${className}`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <Icon
        name={theme === "light" ? "dark_mode" : "light_mode"}
        className="text-lg"
      />
    </button>
  );
};

export default ThemeToggle;
