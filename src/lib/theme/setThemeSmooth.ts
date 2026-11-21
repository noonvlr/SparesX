import { flushSync } from "react-dom";

type SetThemeFn = (theme: string) => void;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function supportsViewTransitions(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof (
      document as Document & { startViewTransition?: (cb: () => void) => unknown }
    ).startViewTransition === "function"
  );
}

function resolveThemeAttr(next: string): "light" | "dark" {
  if (next === "dark" || next === "light") return next;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Apply resolved theme attrs immediately so paint/VT see the new tokens. */
function applyThemeDom(next: string): void {
  const resolved = resolveThemeAttr(next);
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;
}

/**
 * Apply a theme change with the smoothest path available:
 * 1) View Transitions API crossfade (no partial-element flicker)
 * 2) CSS color transitions fallback
 * 3) Instant when reduced motion is preferred
 */
export function setThemeSmooth(setTheme: SetThemeFn, next: string): void {
  if (typeof document === "undefined") {
    setTheme(next);
    return;
  }

  const root = document.documentElement;

  const apply = () => {
    applyThemeDom(next);
    flushSync(() => {
      setTheme(next);
    });
  };

  if (prefersReducedMotion()) {
    apply();
    return;
  }

  if (supportsViewTransitions()) {
    root.classList.add("theme-vt");
    const transition = (
      document as Document & {
        startViewTransition: (cb: () => void) => { finished: Promise<void> };
      }
    ).startViewTransition(apply);

    void transition.finished.finally(() => {
      root.classList.remove("theme-vt");
    });
    return;
  }

  root.classList.add("theme-switching");
  apply();
  window.setTimeout(() => {
    root.classList.remove("theme-switching");
  }, 480);
}
