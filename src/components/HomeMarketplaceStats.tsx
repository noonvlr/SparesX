import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import { buttonVariants } from "@/components/ui/button-variants";

type HomeMarketplaceStatsProps = {
  listedCount: number;
  soldCount: number;
};

/**
 * Hero marketplace counters — only shown when there is real activity.
 * Counts are rendered on the server so Googlebot never sees a "0 / 0" flash.
 */
export default function HomeMarketplaceStats({
  listedCount,
  soldCount,
}: HomeMarketplaceStatsProps) {
  if (listedCount <= 0 && soldCount <= 0) {
    return (
      <div className="mt-10 sm:mt-12 mx-auto max-w-lg rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-5 py-5 sm:px-6 sm:py-6 text-center shadow-[var(--shadow-sm)]">
        <p className="text-sm font-semibold text-[var(--ink)]">
          Be one of the first technicians on SparesX
        </p>
        <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
          List a spare part or request what you need — help build the technician
          marketplace.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/technician/products/new"
            className={cn(buttonVariants({ size: "sm" }), "w-full sm:w-auto")}
          >
            List a part
          </Link>
          <Link
            href="/requests?tab=submit"
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "w-full sm:w-auto",
            )}
          >
            Request a part
          </Link>
        </div>
      </div>
    );
  }

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
            {listedCount.toLocaleString("en-IN")}
          </span>
        </dd>
      </div>

      <div className="home-stat-card home-stat-card--sold group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--brand-muted)] bg-[var(--brand-soft)] px-4 py-4 sm:px-6 sm:py-5 shadow-[var(--shadow-sm)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[var(--brand)] home-stat-bar home-stat-bar--delayed"
        />
        <dt className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--brand-hover)]">
          Parts sold / fulfilled
        </dt>
        <dd className="mt-1.5 flex items-baseline gap-1.5">
          <span className="home-stat-number home-stat-number--brand text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--brand)] tabular-nums">
            {soldCount.toLocaleString("en-IN")}
          </span>
        </dd>
      </div>
    </dl>
  );
}
