"use client";

import { useTheme } from "next-themes";
import { Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-full h-9 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200'} rounded-md animate-pulse`}></div>
    );
  }

  const isDarkMode = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDarkMode ? "light" : "dark")}
      className={`w-full flex items-center justify-between px-4 py-2 text-sm font-semibold ${theme === 'dark' ? 'text-gray-300 hover:bg-slate-700/50': 'text-slate-700 hover:bg-slate-100'} rounded-md transition-colors`}
      aria-label="Toggle Dark Mode"
    >
      <div className="flex items-center gap-3">
        <Moon size={16} />
        <span>Dark Mode</span>
      </div>

      <div
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out
          ${isDarkMode ? "bg-btnDark" : "bg-slate-300"}
        `}
      >
        <span
          key={isDarkMode ? "dark-knob" : "light-knob"}
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0
            ${isDarkMode ? "animate-bubble-on" : "animate-bubble-off"}
          `}
        />
      </div>
    </button>
  );
}