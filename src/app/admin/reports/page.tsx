"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminPage } from "@/components/layout";
import { Card, PageHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

type DayPoint = {
  date: string;
  listings: number;
  approved: number;
  requests: number;
  open: number;
};

function MiniBars({
  points,
  valueKey,
  color,
  label,
}: {
  points: DayPoint[];
  valueKey: keyof DayPoint;
  color: string;
  label: string;
}) {
  const max = Math.max(
    1,
    ...points.map((p) => Number(p[valueKey] || 0)),
  );
  const total = points.reduce((sum, p) => sum + Number(p[valueKey] || 0), 0);

  return (
    <Card padding="md">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-[var(--ink)]">{label}</p>
        <p className="text-xs text-[var(--muted)]">{total} in 30 days</p>
      </div>
      <div className="flex items-end gap-[2px] h-28">
        {points.map((p) => {
          const value = Number(p[valueKey] || 0);
          const height = Math.max(2, Math.round((value / max) * 100));
          return (
            <div
              key={`${label}-${p.date}`}
              title={`${p.date}: ${value}`}
              className="flex-1 rounded-t-[2px] opacity-90 hover:opacity-100"
              style={{ height: `${height}%`, background: color }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-[var(--muted)]">
        <span>{points[0]?.date?.slice(5)}</span>
        <span>{points[points.length - 1]?.date?.slice(5)}</span>
      </div>
    </Card>
  );
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      return;
    }
    fetch("/api/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message && data.userCount == null) {
          setError(data.message);
          return;
        }
        setStats(data);
      })
      .catch(() => setError("Failed to load reports"));
  }, []);

  const series: DayPoint[] = useMemo(
    () => (Array.isArray(stats?.series) ? stats.series : []),
    [stats],
  );

  if (error) {
    return (
      <AdminPage title="Reports">
        <Alert tone="danger">{error}</Alert>
      </AdminPage>
    );
  }

  if (!stats) {
    return (
      <AdminPage title="Reports">
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--muted)]">
          <Spinner /> Loading…
        </div>
      </AdminPage>
    );
  }

  const rows = [
    { label: "Total users", value: stats.userCount, href: "/admin/users", soft: "bg-[var(--brand-soft)]" },
    { label: "Technicians", value: stats.technicianCount, href: "/admin/users", soft: "bg-[var(--success-soft)]" },
    { label: "Blocked users", value: stats.blockedUsers, href: "/admin/users", soft: "bg-[var(--danger-soft)]" },
    { label: "Products", value: stats.productCount, href: "/admin/products", soft: "bg-[var(--info-soft)]" },
    {
      label: "Pending products",
      value: stats.pendingProducts,
      href: "/admin/products",
      soft: "bg-[var(--warning-soft)]",
    },
    { label: "Open requests", value: stats.openRequests, href: "/admin/requests", soft: "bg-[var(--warning-soft)]" },
    {
      label: "Support unread",
      value: stats.unreadSupport,
      href: "/admin/support",
      soft: "bg-[var(--danger-soft)]",
    },
    {
      label: "Chat conversations",
      value: stats.conversationCount,
      href: "/admin/chat",
      soft: "bg-[var(--info-soft)]",
    },
    { label: "Chat messages", value: stats.messageCount, href: "/admin/chat", soft: "bg-[var(--brand-soft)]" },
  ];

  return (
    <AdminPage>
      <PageHeader
        title="Reports"
        description="Live platform counts plus a 30-day view of new listings and part requests."
      />

      {series.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <MiniBars
            points={series}
            valueKey="listings"
            color="var(--brand)"
            label="New listings / day"
          />
          <MiniBars
            points={series}
            valueKey="requests"
            color="var(--warning)"
            label="New part requests / day"
          />
          <MiniBars
            points={series}
            valueKey="approved"
            color="var(--success)"
            label="Approved listings created / day"
          />
          <MiniBars
            points={series}
            valueKey="open"
            color="var(--info)"
            label="Open requests created / day"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rows.map((row) => (
          <Link key={row.label} href={row.href} className="block">
            <Card
              hover
              padding="md"
              className={`${row.soft} hover:border-[var(--brand-muted)]`}
            >
              <div className="text-sm text-[var(--muted)]">{row.label}</div>
              <div className="text-3xl font-bold mt-2 text-[var(--ink)]">
                {row.value ?? 0}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AdminPage>
  );
}
