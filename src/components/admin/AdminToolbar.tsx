"use client";

import { cn } from "@/lib/ui/cn";
import { Button } from "@/components/ui/Button";

/** Filter / search chrome shared across admin list pages. */
export function AdminToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 space-y-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminFilterRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
    </div>
  );
}

export function AdminStatusChip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "primary" : "outline"}
      onClick={onClick}
      className={cn("rounded-full", className)}
    >
      {children}
    </Button>
  );
}

/** Compact KPI strip above filters. */
export function AdminStatStrip({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <div
      className={cn(
        "mb-5 grid gap-2",
        items.length <= 2
          ? "grid-cols-2"
          : items.length === 3
            ? "grid-cols-1 sm:grid-cols-3"
            : "grid-cols-2 lg:grid-cols-4",
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {item.label}
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ink)] sm:text-2xl">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
