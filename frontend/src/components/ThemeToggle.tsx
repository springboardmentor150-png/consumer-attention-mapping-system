"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import { cn } from "@/lib/utils";

/**
 * Light/dark switch.
 *
 * Both glyphs are always rendered and cross-faded in CSS, keyed off the
 * `.dark` class on <html>. Because nothing here reads the theme in React,
 * the server and client markup are identical and the icon is correct on the
 * very first paint — no mount flicker, no hydration guard.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle colour theme"
      title="Toggle colour theme"
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-xl",
        "border border-line bg-surface text-ink-muted",
        "transition-colors duration-200 hover:border-line-strong hover:text-ink",
        className
      )}
    >
      {/* Shown in dark mode: the action is "go light". */}
      <Sun
        aria-hidden="true"
        className={cn(
          "absolute h-[18px] w-[18px] transition-all duration-300",
          "-rotate-90 scale-50 opacity-0",
          "dark:rotate-0 dark:scale-100 dark:opacity-100"
        )}
      />

      {/* Shown in light mode: the action is "go dark". */}
      <Moon
        aria-hidden="true"
        className={cn(
          "absolute h-[18px] w-[18px] transition-all duration-300",
          "rotate-0 scale-100 opacity-100",
          "dark:rotate-90 dark:scale-50 dark:opacity-0"
        )}
      />
    </button>
  );
}
