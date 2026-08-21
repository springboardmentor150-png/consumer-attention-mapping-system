"use client";

import { useCallback } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

/** The theme currently applied to the document. */
export function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Flips the interface theme.
 *
 * The class lives on <html>, put there before first paint by ThemeScript,
 * and every themed style keys off it in CSS. Nothing is mirrored into React
 * state as a result: there is no value that could disagree with the DOM,
 * and no server/client mismatch to hydrate around.
 */
export function useTheme() {
  const setTheme = useCallback((next: Theme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing: the theme still applies for this session.
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(currentTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { setTheme, toggle };
}
