"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, type ReactNode } from "react";

/**
 * Wraps the app with next-themes.
 * Uses `data-theme` so all CSS tokens in globals.css switch together.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const enable = () => root.classList.add("theme-animate");
    // Defer so the first paint (anti-FOUC script) does not animate.
    const id = window.setTimeout(enable, 50);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      storageKey="sparesx-theme"
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
