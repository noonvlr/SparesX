"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ADMIN_NAV_GROUPS,
  isAdminNavActive,
  type AdminNavItem,
} from "@/lib/admin/nav";
import { cn } from "@/lib/ui/cn";
import { Badge } from "@/components/ui/Card";

export function AdminNavLink({
  item,
  supportUnread = 0,
  compact = false,
  onNavigate,
}: {
  item: AdminNavItem;
  supportUnread?: number;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() || "";
  const active = isAdminNavActive(pathname, item.href);
  const badge =
    item.badgeKey === "support" && supportUnread > 0 ? supportUnread : 0;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius)] transition-colors",
        compact
          ? "px-3 py-2"
          : "border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 shadow-[var(--shadow-sm)] hover:border-[var(--brand-muted)]",
        active
          ? compact
            ? "bg-[var(--brand-soft)] text-[var(--brand-hover)]"
            : "border-[var(--brand-muted)] bg-[var(--brand-soft)] text-[var(--brand-hover)]"
          : compact
            ? "text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]"
            : "text-[var(--ink)]",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="truncate">{item.label}</span>
          {badge > 0 ? (
            <Badge
              tone="success"
              className="min-w-[1.15rem] justify-center border-0 bg-[var(--success)] px-1 py-0 text-[10px] text-white"
            >
              {badge > 99 ? "99+" : badge}
            </Badge>
          ) : null}
        </span>
        {!compact ? (
          <span className="mt-0.5 block text-xs leading-snug text-[var(--muted)]">
            {item.desc}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/** Desktop sidebar groups (compact labels). */
export function AdminSidebarNav({
  supportUnread = 0,
}: {
  supportUnread?: number;
}) {
  return (
    <nav aria-label="Admin" className="space-y-5 px-2 py-3">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.id}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <AdminNavLink
                  item={item}
                  supportUnread={supportUnread}
                  compact
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Grouped directory (dashboard / control center / mobile overflow). */
export function AdminNavDirectory({
  supportUnread = 0,
}: {
  supportUnread?: number;
}) {
  return (
    <div className="space-y-8">
      {ADMIN_NAV_GROUPS.map((group) => (
        <section key={group.id}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            {group.label}
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => (
              <AdminNavLink
                key={item.href}
                item={item}
                supportUnread={supportUnread}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
