"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAdminBreadcrumbs } from "@/lib/admin/nav";
import { cn } from "@/lib/ui/cn";
import { IconChevron } from "@/components/admin/AdminIcons";

export function AdminBreadcrumbs({
  className,
  items,
}: {
  className?: string;
  items?: { href?: string; label: string }[];
}) {
  const pathname = usePathname() || "";
  const crumbs = items ?? getAdminBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-[var(--muted)]">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1 min-w-0">
              {i > 0 ? (
                <IconChevron className="opacity-50 shrink-0" />
              ) : null}
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className="truncate hover:text-[var(--ink)] transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate",
                    last ? "font-medium text-[var(--ink-secondary)]" : undefined,
                  )}
                  aria-current={last ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Standard page header for admin content pages. */
export function AdminPageHeader({
  title,
  description,
  actions,
  breadcrumbs = false,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Off by default — AdminShell topbar already shows breadcrumbs. */
  breadcrumbs?: boolean;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 md:mb-8", className)}>
      {breadcrumbs ? <AdminBreadcrumbs className="mb-3" /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.375rem] md:text-[1.625rem] font-semibold tracking-tight text-[var(--ink)] leading-tight">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-[13px] md:text-sm leading-relaxed text-[var(--muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
  href,
  warn,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  href?: string;
  warn?: boolean;
  className?: string;
}) {
  const inner = (
    <div
      className={cn(
        "rounded-[var(--admin-radius)] border bg-[var(--admin-card)] p-4 transition-colors",
        warn
          ? "border-[var(--warning)]/35 bg-[var(--warning-soft)]"
          : "border-[var(--admin-border)]",
        href ? "hover:border-[var(--brand-muted)]" : undefined,
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1.5 text-[1.75rem] font-semibold tabular-nums tracking-tight text-[var(--ink)] leading-none">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-[var(--admin-radius)]">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function AdminSkeleton({
  className,
  rows = 4,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 animate-pulse rounded-[var(--radius)] bg-[var(--skeleton)]"
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}

export function AdminSection({
  title,
  description,
  children,
  className,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className={cn("mb-8 md:mb-10", className)}>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink)]">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-[var(--muted)]">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
