"use client";

import { useTheme } from "next-themes";
import { Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-9 bg-slate-200 dark:bg-slate-700/50 rounded-md animate-pulse"></div>
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-slate-700/50 rounded-md transition-colors"
      aria-label="Toggle Dark Mode"
    >
      <div className="flex items-center gap-3">
        <Moon size={16} />
        <span>Dark Mode</span>
      </div>

      <div
        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-slate-300 dark:bg-btnDark"
      >
        <span
          key={resolvedTheme}
          className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 animate-bubble-off dark:animate-bubble-on"
        />
      </div>
    </button>
  );
}