import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import { buttonVariants } from "@/components/ui/button-variants";

type HomeMarketplaceStatsProps = {
  listedCount: number;
  openRequestsCount: number;
};

/**
 * Hero marketplace counters — only shown when there is real activity.
 * Counts are rendered on the server so Googlebot never sees a "0 / 0" flash.
 */
export default function HomeMarketplaceStats({
  listedCount,
  openRequestsCount,
}: HomeMarketplaceStatsProps) {
  if (listedCount <= 0 && openRequestsCount <= 0) {
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
    <div
      className={cn(
        "mt-10 sm:mt-12 mx-auto grid max-w-lg grid-cols-2 gap-3 sm:gap-4",
        "home-stats-enter",
      )}
    >
      <Link
        href="/products"
        className="home-stat-card group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6 sm:py-5 shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--brand-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[var(--brand)] home-stat-bar"
        />
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Live listings
        </p>
        <p className="mt-1.5 home-stat-number text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)] tabular-nums">
          {listedCount.toLocaleString("en-IN")}
        </p>
        <p className="mt-2 text-xs font-semibold text-[var(--brand)] group-hover:text-[var(--brand-hover)]">
          Browse parts
        </p>
      </Link>

      <Link
        href="/requests"
        className="home-stat-card home-stat-card--sold group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--brand-muted)] bg-[var(--brand-soft)] px-4 py-4 sm:px-6 sm:py-5 shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[var(--brand)] home-stat-bar home-stat-bar--delayed"
        />
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--brand-hover)]">
          Open requests
        </p>
        <p className="mt-1.5 home-stat-number home-stat-number--brand text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--brand)] tabular-nums">
          {openRequestsCount.toLocaleString("en-IN")}
        </p>
        <p className="mt-2 text-xs font-semibold text-[var(--brand-hover)] group-hover:text-[var(--brand)]">
          Browse requests
        </p>
      </Link>
    </div>
  );
}
