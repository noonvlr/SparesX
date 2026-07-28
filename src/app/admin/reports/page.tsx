"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!stats) return <div className="p-8">Loading...</div>;

  const rows = [
    { label: "Total users", value: stats.userCount, href: "/admin/users" },
    { label: "Technicians", value: stats.technicianCount, href: "/admin/users" },
    { label: "Blocked users", value: stats.blockedUsers, href: "/admin/users" },
    { label: "Products", value: stats.productCount, href: "/admin/products" },
    {
      label: "Pending products",
      value: stats.pendingProducts,
      href: "/admin/products",
    },
    { label: "Open requests", value: stats.openRequests, href: "/admin/requests" },
    {
      label: "Support unread",
      value: stats.unreadSupport,
      href: "/admin/support",
    },
    {
      label: "Chat conversations",
      value: stats.conversationCount,
      href: "/admin/chat",
    },
    { label: "Chat messages", value: stats.messageCount, href: "/admin/chat" },
  ];

  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Reports</h1>
      <p className="text-gray-600 text-sm mb-8">
        Live platform counts across marketplace, support, and chat.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rows.map((row) => (
          <Link
            key={row.label}
            href={row.href}
            className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:border-blue-200 transition"
          >
            <div className="text-sm text-gray-500">{row.label}</div>
            <div className="text-3xl font-bold mt-2 text-gray-900">
              {row.value ?? 0}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
