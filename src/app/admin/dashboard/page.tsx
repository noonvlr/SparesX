"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPage } from "@/components/layout";
import { Badge } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { authFetch } from "@/lib/auth/clientAuth";
import { AdminNavDirectory } from "@/components/admin/AdminNav";
import {
  AdminPageHeader,
  AdminSection,
  AdminSkeleton,
  AdminStatCard,
} from "@/components/admin/AdminPageChrome";

type DashboardStats = {
  userCount?: number;
  technicianCount?: number;
  productCount?: number;
  pendingProducts?: number;
  openRequests?: number;
  unreadSupport?: number;
  conversationCount?: number;
  messageCount?: number;
  blockedUsers?: number;
  visitors?: { last30?: number; today?: number };
  message?: string;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((data: DashboardStats) => {
        if (data.message && data.userCount === undefined) {
          setError(data.message);
          return;
        }
        setStats(data);
      })
      .catch(() => setError("Failed to load dashboard"));
  }, []);

  if (error) {
    return (
      <AdminPage>
        <AdminPageHeader
          title="Dashboard"
          description="Overview of marketplace activity and platform performance."
        />
        <Alert tone="danger">{error}</Alert>
      </AdminPage>
    );
  }

  if (!stats) {
    return (
      <AdminPage>
        <AdminPageHeader
          title="Dashboard"
          description="Overview of marketplace activity and platform performance."
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[5.5rem] animate-pulse rounded-[var(--admin-radius)] bg-[var(--skeleton)]"
            />
          ))}
        </div>
        <AdminSkeleton rows={5} />
      </AdminPage>
    );
  }

  const attention: { href: string; label: string; detail: string }[] = [];
  if ((stats.pendingProducts ?? 0) > 0) {
    attention.push({
      href: "/admin/products",
      label: "Listings to review",
      detail: `${stats.pendingProducts} pending approval`,
    });
  }
  if ((stats.unreadSupport ?? 0) > 0) {
    attention.push({
      href: "/admin/support",
      label: "Support inbox",
      detail: `${stats.unreadSupport} unread`,
    });
  }
  if ((stats.openRequests ?? 0) > 0) {
    attention.push({
      href: "/admin/requests",
      label: "Open requests",
      detail: `${stats.openRequests} waiting`,
    });
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of marketplace activity and platform performance."
      />

      {attention.length > 0 ? (
        <AdminSection title="Needs attention" description="Actionable items first.">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {attention.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="rounded-[var(--admin-radius)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-4 py-3.5 transition-colors hover:border-[var(--warning)]"
              >
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{item.detail}</p>
              </Link>
            ))}
          </div>
        </AdminSection>
      ) : null}

      <AdminSection title="Key metrics">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <AdminStatCard
            label="Users"
            value={stats.userCount ?? 0}
            hint={`${stats.technicianCount ?? 0} technicians`}
            href="/admin/users"
          />
          <AdminStatCard
            label="Products"
            value={stats.productCount ?? 0}
            hint={
              stats.pendingProducts
                ? `${stats.pendingProducts} pending`
                : "All clear"
            }
            href="/admin/products"
            warn={(stats.pendingProducts ?? 0) > 0}
          />
          <AdminStatCard
            label="Support unread"
            value={stats.unreadSupport ?? 0}
            hint="Open tickets needing reply"
            href="/admin/support"
            warn={(stats.unreadSupport ?? 0) > 0}
          />
          <AdminStatCard
            label="Visitors (30d)"
            value={stats.visitors?.last30 ?? 0}
            hint={`${stats.visitors?.today ?? 0} today`}
            href="/admin/reports"
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            {
              label: "Open requests",
              value: stats.openRequests ?? 0,
              href: "/admin/requests",
            },
            {
              label: "Chat threads",
              value: stats.conversationCount ?? 0,
              href: "/admin/chat",
              badge: stats.messageCount
                ? `${stats.messageCount} msgs`
                : null,
            },
            {
              label: "Blocked users",
              value: stats.blockedUsers ?? 0,
              href: "/admin/users",
            },
          ].map((row) => (
            <Link
              key={row.label}
              href={row.href}
              className="flex items-center justify-between gap-3 rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-3 text-sm hover:border-[var(--brand-muted)]"
            >
              <span className="text-[var(--ink-secondary)]">{row.label}</span>
              <span className="flex items-center gap-2 font-semibold tabular-nums text-[var(--ink)]">
                {row.value}
                {row.badge ? <Badge tone="neutral">{row.badge}</Badge> : null}
              </span>
            </Link>
          ))}
        </div>
      </AdminSection>

      <AdminSection
        title="All tools"
        description="Same map as the sidebar — grouped by job."
      >
        <AdminNavDirectory supportUnread={stats.unreadSupport ?? 0} />
      </AdminSection>
    </AdminPage>
  );
}
