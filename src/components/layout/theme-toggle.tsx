"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasDarkClass = document.documentElement.classList.contains("dark");
    setIsDark(hasDarkClass);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("lumora_theme", "dark");
      } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("lumora_theme", "light");
      } catch {}
    }
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full text-ink transition dark:text-[#EAE6DF]",
          className
        )}
      >
        <span className="h-5 w-5" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative grid h-10 w-10 place-items-center rounded-full text-ink transition duration-300 hover:bg-ink-100 hover:text-ink active:scale-95 dark:text-[#EAE6DF] dark:hover:bg-[#252320] dark:hover:text-[#FDC841] focus-visible:ring-2 focus-visible:ring-[#FDC841]",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-[#FDC841] transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-5 w-5 text-ink-700 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
