"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-10 w-10" />;

  const isDark = theme === "dark";

  return (
    <div className="relative group">
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="relative p-2.5 rounded-xl bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-300 border border-border overflow-hidden"
        aria-label="Toggle Theme"
      >
        {/* Sliding icon container */}
        <div className={`transition-all duration-500 ${isDark ? "rotate-0 scale-100" : "rotate-180 scale-0 absolute inset-0 flex items-center justify-center"}`}>
          {isDark && <Sun className="h-5 w-5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />}
        </div>
        <div className={`transition-all duration-500 ${!isDark ? "rotate-0 scale-100" : "rotate-180 scale-0 absolute inset-0 flex items-center justify-center"}`}>
          {!isDark && <Moon className="h-5 w-5 text-indigo-500" />}
        </div>
      </button>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-foreground text-background text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg">
        {isDark ? "Light mode" : "Dark mode"}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
      </div>
    </div>
  );
}
