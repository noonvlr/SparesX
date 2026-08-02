"use client";

import { cn } from "@/lib/ui/cn";

/**
 * Reserved ad placement. Renders nothing until ads are enabled via env,
 * so layout stays stable and slots can be filled later without redesign.
 *
 * Usage: <AdSlot id="home-mid" className="my-6" />
 */
export default function AdSlot({
  id,
  className,
  /** Desktop recommended size hint for future creatives */
  size = "leaderboard",
}: {
  id: string;
  className?: string;
  size?: "leaderboard" | "rectangle" | "mobile-banner";
}) {
  const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
  if (!enabled) {
    return (
      <div
        data-ad-slot={id}
        data-ad-size={size}
        className={cn("hidden", className)}
        aria-hidden
      />
    );
  }

  const minH =
    size === "rectangle"
      ? "min-h-[250px]"
      : size === "mobile-banner"
        ? "min-h-[50px]"
        : "min-h-[90px]";

  return (
    <aside
      data-ad-slot={id}
      data-ad-size={size}
      className={cn(
        "w-full flex items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-3)] text-xs text-[var(--muted)]",
        minH,
        className,
      )}
      aria-label="Advertisement"
    >
      {/* Wire AdSense / house ads here when enabled */}
      Ad
    </aside>
  );
}
