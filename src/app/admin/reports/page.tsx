"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminPage } from "@/components/layout";
import { Card, PageHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

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
        description="Live platform counts across marketplace, support, and chat."
      />
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
