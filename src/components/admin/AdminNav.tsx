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
import { AdminIcon } from "@/components/admin/AdminIcons";

export function AdminNavLink({
  item,
  supportUnread = 0,
  compact = false,
  collapsed = false,
  onNavigate,
}: {
  item: AdminNavItem;
  supportUnread?: number;
  compact?: boolean;
  collapsed?: boolean;
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
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-[var(--admin-radius-sm)] transition-colors",
        collapsed ? "justify-center px-2 py-2.5" : "px-2.5 py-2",
        compact || collapsed
          ? active
            ? "bg-[var(--brand-soft)] text-[var(--brand-hover)]"
            : "text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]"
          : cn(
              "border border-[var(--admin-border)] bg-[var(--admin-card)] px-3.5 py-3 shadow-[var(--shadow-sm)]",
              active
                ? "border-[var(--brand-muted)] bg-[var(--brand-soft)] text-[var(--brand-hover)]"
                : "text-[var(--ink)] hover:border-[var(--brand-muted)]",
            ),
      )}
      aria-current={active ? "page" : undefined}
    >
      {active && (compact || collapsed) ? (
        <span
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--brand)]"
          aria-hidden
        />
      ) : null}
      <AdminIcon
        name={item.icon}
        className={cn(
          active ? "opacity-100" : "opacity-70 group-hover:opacity-100",
        )}
      />
      {!collapsed ? (
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[13px] font-medium leading-none">
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
            <span className="mt-1 block text-xs leading-snug text-[var(--muted)]">
              {item.desc}
            </span>
          ) : null}
        </span>
      ) : badge > 0 ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--success)] px-1 text-[9px] font-semibold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

/** Desktop / drawer sidebar groups. */
export function AdminSidebarNav({
  supportUnread = 0,
  collapsed = false,
  onNavigate,
}: {
  supportUnread?: number;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Admin" className={cn("space-y-5", collapsed ? "px-1.5 py-3" : "px-2 py-3")}>
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.id}>
          {!collapsed ? (
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              {group.label}
            </p>
          ) : (
            <div className="mx-auto mb-1.5 h-px w-6 bg-[var(--divider)]" aria-hidden />
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <AdminNavLink
                  item={item}
                  supportUnread={supportUnread}
                  compact
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Grouped directory cards (dashboard / control center). */
export function AdminNavDirectory({
  supportUnread = 0,
}: {
  supportUnread?: number;
}) {
  return (
    <div className="space-y-8">
      {ADMIN_NAV_GROUPS.map((group) => (
        <section key={group.id}>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
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
