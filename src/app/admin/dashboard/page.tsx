"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPage } from "@/components/layout";
import { Card, Badge, PageHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { authFetch } from "@/lib/auth/clientAuth";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.message && !data.userCount && data.userCount !== 0) {
          setError(data.message);
          return;
        }
        setStats(data);
      })
      .catch(() => setError("Failed to load dashboard"));
  }, []);

  if (error) {
    return (
      <AdminPage title="Admin Dashboard">
        <Alert tone="danger">{error}</Alert>
      </AdminPage>
    );
  }

  if (!stats) {
    return (
      <AdminPage title="Admin Dashboard">
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--muted)]">
          <Spinner /> Loading…
        </div>
      </AdminPage>
    );
  }

  const cards = [
    {
      label: "Total users",
      value: stats.userCount,
      href: "/admin/users",
      soft: "bg-[var(--brand-soft)]",
      labelClass: "text-[var(--brand-hover)]",
    },
    {
      label: "Technicians",
      value: stats.technicianCount,
      href: "/admin/users",
      soft: "bg-[var(--success-soft)]",
      labelClass: "text-[var(--success)]",
    },
    {
      label: "Products",
      value: stats.productCount,
      href: "/admin/products",
      soft: "bg-[var(--info-soft)]",
      labelClass: "text-[var(--info)]",
      badge: stats.pendingProducts
        ? `${stats.pendingProducts} pending`
        : null,
      badgeTone: "warning" as const,
    },
    {
      label: "Open requests",
      value: stats.openRequests,
      href: "/admin/requests",
      soft: "bg-[var(--warning-soft)]",
      labelClass: "text-[var(--warning)]",
    },
    {
      label: "Support unread",
      value: stats.unreadSupport,
      href: "/admin/support",
      soft: "bg-[var(--danger-soft)]",
      labelClass: "text-[var(--danger)]",
    },
    {
      label: "Chat threads",
      value: stats.conversationCount,
      href: "/admin/chat",
      soft: "bg-[var(--info-soft)]",
      labelClass: "text-[var(--info)]",
      badge: stats.messageCount
        ? `${stats.messageCount} messages`
        : null,
      badgeTone: "neutral" as const,
    },
    {
      label: "Blocked users",
      value: stats.blockedUsers,
      href: "/admin/users",
      soft: "bg-[var(--danger-soft)]",
      labelClass: "text-[var(--danger)]",
    },
  ];

  const links = [
    { href: "/admin/products", title: "Products", desc: "Approve, edit, feature, delete" },
    { href: "/admin/requests", title: "Requests", desc: "Fulfill, close, or remove posts" },
    { href: "/admin/users", title: "Users", desc: "Create, block, reset, delete" },
    { href: "/admin/device-management", title: "Devices", desc: "Types, brands, models, parts" },
    { href: "/admin/support", title: "Support", desc: "Reply to user tickets" },
    { href: "/admin/chat", title: "Chat disputes", desc: "Read chats for dispute review" },
    { href: "/admin/broadcast", title: "Bulk messaging", desc: "Filter users & send in-app chat" },
    { href: "/admin/categories", title: "Categories", desc: "Manage part categories" },
    { href: "/admin/reports", title: "Reports", desc: "Platform counts overview" },
    { href: "/admin/site-settings", title: "Site settings", desc: "SMS provider & OTP credentials" },
    { href: "/admin/updates", title: "Site updates", desc: "Dashboard changelog & bug thanks" },
    { href: "/admin/settings", title: "Control center", desc: "All admin tools in one place" },
  ];

  return (
    <AdminPage>
      <PageHeader
        title="Admin Dashboard"
        description="Full control over catalog, requests, users, devices, support, and chats"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="block">
            <Card
              hover
              padding="md"
              className={`${card.soft} border-[var(--border)]`}
            >
              <div
                className={`${card.labelClass} text-xs font-medium uppercase tracking-wide`}
              >
                {card.label}
              </div>
              <div className="text-4xl font-bold mt-2 text-[var(--ink)]">
                {card.value ?? 0}
              </div>
              {card.badge && (
                <Badge tone={card.badgeTone || "neutral"} className="mt-2">
                  {card.badge}
                </Badge>
              )}
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-bold text-[var(--ink)] mb-3">Quick actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="block">
            <Card hover padding="md">
              <p className="font-semibold text-[var(--ink)]">{link.title}</p>
              <p className="text-sm text-[var(--muted)] mt-1">{link.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </AdminPage>
  );
}
