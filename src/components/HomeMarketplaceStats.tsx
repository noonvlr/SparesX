"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/ui/cn";

type HomeMarketplaceStatsProps = {
  listedCount: number;
  soldCount: number;
};

function useCountUp(target: number, durationMs = 1100) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || target <= 0) {
      setValue(target);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

/**
 * Hero marketplace counters — solid cards, count-up + soft highlight pulse.
 */
export default function HomeMarketplaceStats({
  listedCount,
  soldCount,
}: HomeMarketplaceStatsProps) {
  const listed = useCountUp(listedCount);
  const sold = useCountUp(soldCount, 1300);

  return (
    <dl
      className={cn(
        "mt-10 sm:mt-12 mx-auto grid max-w-lg grid-cols-2 gap-3 sm:gap-4",
        "home-stats-enter",
      )}
    >
      <div className="home-stat-card group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6 sm:py-5 shadow-[var(--shadow-sm)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[var(--brand)] home-stat-bar"
        />
        <dt className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Live listings
        </dt>
        <dd className="mt-1.5 flex items-baseline gap-1.5">
          <span className="home-stat-number text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)] tabular-nums">
            {listed.toLocaleString("en-IN")}
          </span>
        </dd>
      </div>

      <div className="home-stat-card home-stat-card--sold group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--brand-muted)] bg-[var(--brand-soft)] px-4 py-4 sm:px-6 sm:py-5 shadow-[var(--shadow-sm)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[var(--brand)] home-stat-bar home-stat-bar--delayed"
        />
        <dt className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--brand-hover)]">
          Parts sold
        </dt>
        <dd className="mt-1.5 flex items-baseline gap-1.5">
          <span className="home-stat-number home-stat-number--brand text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--brand)] tabular-nums">
            {sold.toLocaleString("en-IN")}
          </span>
        </dd>
      </div>
    </dl>
  );
}
