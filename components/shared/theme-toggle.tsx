"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.add("theme-transition");
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("fursa-theme", nextDark ? "dark" : "light");
    setIsDark(nextDark);
    window.setTimeout(() => document.documentElement.classList.remove("theme-transition"), 250);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-primary-600"
      aria-label={isDark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
      title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
