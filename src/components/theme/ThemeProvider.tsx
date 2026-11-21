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
    // Defer so the anti-FOUC boot script / first paint does not animate.
    const id = window.setTimeout(() => {
      root.classList.add("theme-animate");
    }, 80);
    return () => {
      window.clearTimeout(id);
      root.classList.remove("theme-animate", "theme-vt", "theme-switching");
    };
  }, []);

  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      storageKey="sparesx-theme"
      // Keep CSS transitions available for the non-VT fallback path.
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
