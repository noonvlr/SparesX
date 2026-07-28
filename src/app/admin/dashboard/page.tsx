"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
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
        if (data.message && !data.userCount && data.userCount !== 0) {
          setError(data.message);
          return;
        }
        setStats(data);
      })
      .catch(() => setError("Failed to load dashboard"));
  }, []);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!stats) return <div className="p-8">Loading...</div>;

  const cards = [
    {
      label: "Total users",
      value: stats.userCount,
      href: "/admin/users",
      from: "from-blue-500",
      to: "to-blue-600",
      muted: "text-blue-100",
    },
    {
      label: "Technicians",
      value: stats.technicianCount,
      href: "/admin/users",
      from: "from-emerald-500",
      to: "to-emerald-600",
      muted: "text-emerald-100",
    },
    {
      label: "Products",
      value: stats.productCount,
      href: "/admin/products",
      from: "from-violet-500",
      to: "to-violet-600",
      muted: "text-violet-100",
      badge: stats.pendingProducts
        ? `${stats.pendingProducts} pending`
        : null,
    },
    {
      label: "Open requests",
      value: stats.openRequests,
      href: "/admin/requests",
      from: "from-amber-500",
      to: "to-amber-600",
      muted: "text-amber-100",
    },
    {
      label: "Support unread",
      value: stats.unreadSupport,
      href: "/admin/support",
      from: "from-rose-500",
      to: "to-rose-600",
      muted: "text-rose-100",
    },
    {
      label: "Chat threads",
      value: stats.conversationCount,
      href: "/admin/chat",
      from: "from-cyan-500",
      to: "to-cyan-700",
      muted: "text-cyan-100",
      badge: stats.messageCount
        ? `${stats.messageCount} messages`
        : null,
    },
    {
      label: "Blocked users",
      value: stats.blockedUsers,
      href: "/admin/users",
      from: "from-slate-500",
      to: "to-slate-700",
      muted: "text-slate-200",
    },
  ];

  const links = [
    { href: "/admin/products", title: "Products", desc: "Approve, edit, feature, delete" },
    { href: "/admin/requests", title: "Requests", desc: "Fulfill, close, or remove posts" },
    { href: "/admin/users", title: "Users", desc: "Create, block, reset, delete" },
    { href: "/admin/device-management", title: "Devices", desc: "Types, brands, models, parts" },
    { href: "/admin/support", title: "Support", desc: "Reply to user tickets" },
    { href: "/admin/chat", title: "Chat disputes", desc: "Read chats for dispute review" },
    { href: "/admin/categories", title: "Categories", desc: "Manage part categories" },
    { href: "/admin/reports", title: "Reports", desc: "Platform counts overview" },
    { href: "/admin/settings", title: "Control center", desc: "All admin tools in one place" },
  ];

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Admin Dashboard</h1>
      <p className="text-gray-600 text-sm mb-8">
        Full control over catalog, requests, users, devices, support, and chats
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`bg-gradient-to-br ${card.from} ${card.to} text-white rounded-2xl shadow-lg p-5 hover:opacity-95 transition`}
          >
            <div className={`${card.muted} text-xs font-medium uppercase tracking-wide`}>
              {card.label}
            </div>
            <div className="text-4xl font-bold mt-2">{card.value ?? 0}</div>
            {card.badge && (
              <div className="text-xs mt-2 font-semibold bg-white/20 inline-block px-2 py-0.5 rounded-full">
                {card.badge}
              </div>
            )}
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-3">Quick actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow transition"
          >
            <p className="font-semibold text-gray-900">{link.title}</p>
            <p className="text-sm text-gray-500 mt-1">{link.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
