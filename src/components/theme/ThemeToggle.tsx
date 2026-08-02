"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/ui/cn";

type Mode = "light" | "dark" | "system";

function IconSun({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="4" strokeWidth="1.75" />
      <path
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 14.5A8.5 8.5 0 1110.5 3 7 7 0 0021 14.5z"
      />
    </svg>
  );
}

function IconSystem({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <rect x="3" y="4" width="18" height="14" rx="2" strokeWidth="1.75" />
      <path strokeWidth="1.75" strokeLinecap="round" d="M8 20h8M12 18v2" />
    </svg>
  );
}

const OPTIONS: { value: Mode; label: string; icon: typeof IconSun }[] = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "system", label: "System", icon: IconSystem },
];

export function ThemeToggle({
  className,
  size = "md",
  showLabels = false,
}: {
  className?: string;
  size?: "sm" | "md";
  /** Show text labels next to icons (profile / more menus). */
  showLabels?: boolean;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const active = (mounted ? theme : "system") as Mode;
  const btn = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  if (showLabels) {
    return (
      <div
        role="group"
        aria-label="Color theme"
        className={cn("flex flex-col gap-0.5", className)}
      >
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const selected = active === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={selected}
              className={cn(
                "flex items-center gap-2.5 w-full rounded-[var(--radius)] px-3 py-2.5 text-sm transition-colors duration-[var(--duration-normal)]",
                selected
                  ? "bg-[var(--brand-soft)] text-[var(--brand-hover)] font-semibold"
                  : "text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-transform duration-[var(--duration-normal)]",
                  selected && "scale-110",
                  !selected && "opacity-[var(--icon-opacity-inactive)]",
                )}
              />
              <span>{label}</span>
              {value === "system" && mounted && resolvedTheme ? (
                <span className="ml-auto text-tiny text-[var(--muted)] capitalize">
                  {resolvedTheme}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Color theme"
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-3)] p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-label={`${label} theme`}
            aria-pressed={selected}
            title={label}
            className={cn(
              "inline-flex items-center justify-center rounded-full transition-all duration-[var(--duration-normal)]",
              btn,
              selected
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)]"
                : "text-[var(--muted)] hover:text-[var(--ink-secondary)]",
            )}
          >
            <Icon
              className={cn(
                icon,
                "transition-transform duration-[var(--duration-normal)]",
                selected && "scale-110 rotate-0",
                !mounted && "opacity-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/** Compact single control that cycles light → dark → system. */
export function ThemeCycleButton({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const order: Mode[] = ["light", "dark", "system"];
  const current = (mounted ? theme || "system" : "system") as Mode;
  const next = order[(order.indexOf(current) + 1) % order.length];

  const Icon =
    !mounted
      ? IconSystem
      : current === "dark" || (current === "system" && resolvedTheme === "dark")
        ? IconMoon
        : current === "light"
          ? IconSun
          : IconSystem;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius)] text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)] transition-colors duration-[var(--duration-normal)]",
        className,
      )}
      aria-label={`Theme: ${current}. Click for ${next}`}
      title={`Theme: ${current}`}
    >
      <Icon
        className={cn(
          "h-5 w-5 transition-transform duration-[var(--duration-normal)]",
          mounted && "rotate-0 scale-100",
        )}
      />
    </button>
  );
}
