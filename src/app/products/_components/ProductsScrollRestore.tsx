"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const STORAGE_KEY = "sparesx:products-scroll";

/**
 * Saves /products scroll position and restores it when returning via Back
 * (e.g. after opening a product detail). Does not change visual layout.
 */
export default function ProductsScrollRestore() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlKey = `${pathname}?${searchParams.toString()}`;
  const restoredFor = useRef<string | null>(null);

  useEffect(() => {
    if (pathname !== "/products") return;

    let cancelled = false;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { key?: string; y?: number };
        if (
          saved.key === urlKey &&
          typeof saved.y === "number" &&
          restoredFor.current !== urlKey
        ) {
          restoredFor.current = urlKey;
          requestAnimationFrame(() => {
            if (!cancelled) window.scrollTo(0, saved.y || 0);
          });
        }
      }
    } catch {
      // ignore
    }

    const persist = () => {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ key: urlKey, y: window.scrollY }),
        );
      } catch {
        // ignore
      }
    };

    window.addEventListener("scroll", persist, { passive: true });
    window.addEventListener("pagehide", persist);
    return () => {
      cancelled = true;
      persist();
      window.removeEventListener("scroll", persist);
      window.removeEventListener("pagehide", persist);
    };
  }, [pathname, urlKey]);

  return null;
}
