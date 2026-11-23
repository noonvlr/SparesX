"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminSidebarNav } from "@/components/admin/AdminNav";
import { authFetch, getCachedRole } from "@/lib/auth/clientAuth";
import { cn } from "@/lib/ui/cn";

/**
 * Admin workspace chrome: sticky sidebar on large screens.
 * Mobile relies on bottom nav + grouped More sheet in AppShell.
 */
export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supportUnread, setSupportUnread] = useState(0);

  useEffect(() => {
    if (getCachedRole() && getCachedRole() !== "admin") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/admin/support/unread-count");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.unreadCount === "number") {
          setSupportUnread(data.unreadCount);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[90rem] gap-0 lg:gap-6 lg:px-4 xl:px-6">
      <aside
        className={cn(
          "sticky top-[calc(var(--nav-h)+0.75rem)] z-20 hidden h-[calc(100dvh-var(--nav-h)-1.5rem)] w-56 shrink-0 flex-col overflow-y-auto overscroll-contain rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] lg:flex xl:w-60",
        )}
      >
        <div className="border-b border-[var(--divider)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Admin
          </p>
          <Link
            href="/admin/dashboard"
            className="mt-0.5 block text-sm font-semibold text-[var(--ink)] hover:text-[var(--brand)]"
          >
            Control panel
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto pb-4">
          <AdminSidebarNav supportUnread={supportUnread} />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
