"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPage } from "@/components/layout";
import { Card, Badge, PageHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { authFetch } from "@/lib/auth/clientAuth";
import { AdminNavDirectory } from "@/components/admin/AdminNav";

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
      <AdminPage title="Dashboard">
        <Alert tone="danger">{error}</Alert>
      </AdminPage>
    );
  }

  if (!stats) {
    return (
      <AdminPage title="Dashboard">
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--muted)]">
          <Spinner /> Loading…
        </div>
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

  const primary = [
    {
      label: "Users",
      value: stats.userCount,
      href: "/admin/users",
      hint: `${stats.technicianCount ?? 0} technicians`,
    },
    {
      label: "Products",
      value: stats.productCount,
      href: "/admin/products",
      hint: stats.pendingProducts
        ? `${stats.pendingProducts} pending`
        : "All clear",
      warn: (stats.pendingProducts ?? 0) > 0,
    },
    {
      label: "Support",
      value: stats.unreadSupport,
      href: "/admin/support",
      hint: "Unread tickets",
      warn: (stats.unreadSupport ?? 0) > 0,
    },
    {
      label: "Visitors",
      value: stats.visitors?.last30 ?? 0,
      href: "/admin/reports",
      hint: `${stats.visitors?.today ?? 0} today`,
    },
  ];

  const secondary = [
    { label: "Open requests", value: stats.openRequests, href: "/admin/requests" },
    {
      label: "Chat threads",
      value: stats.conversationCount,
      href: "/admin/chat",
      badge: stats.messageCount ? `${stats.messageCount} msgs` : null,
    },
    { label: "Blocked", value: stats.blockedUsers, href: "/admin/users" },
  ];

  return (
    <AdminPage>
      <PageHeader
        title="Dashboard"
        description="What needs attention, then the rest of the control panel."
      />

      {attention.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Needs attention
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {attention.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="rounded-[var(--radius)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-4 py-3 transition-colors hover:border-[var(--warning)]"
              >
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{item.detail}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Overview
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {primary.map((card) => (
            <Link key={card.label} href={card.href} className="block">
              <Card
                hover
                padding="md"
                className={
                  card.warn
                    ? "border-[var(--warning)]/40 bg-[var(--warning-soft)]"
                    : undefined
                }
              >
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                  {card.label}
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--ink)]">
                  {card.value ?? 0}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">{card.hint}</p>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {secondary.map((row) => (
            <Link
              key={row.label}
              href={row.href}
              className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm hover:border-[var(--brand-muted)]"
            >
              <span className="text-[var(--ink-secondary)]">{row.label}</span>
              <span className="flex items-center gap-2 font-semibold tabular-nums text-[var(--ink)]">
                {row.value ?? 0}
                {"badge" in row && row.badge ? (
                  <Badge tone="neutral">{row.badge}</Badge>
                ) : null}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          All tools
        </h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Grouped by job. Same map as the sidebar and All tools page.
        </p>
        <AdminNavDirectory supportUnread={stats.unreadSupport ?? 0} />
      </section>
    </AdminPage>
  );
}
