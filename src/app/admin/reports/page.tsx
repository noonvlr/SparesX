"use client";

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
      .then((data) => setStats(data))
      .catch(() => setError("Failed to load reports"));
  }, []);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!stats) return <div className="p-8">Loading...</div>;

  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-3xl font-bold mt-2">{stats.userCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <div className="text-sm text-gray-500">Technicians</div>
          <div className="text-3xl font-bold mt-2">{stats.technicianCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <div className="text-sm text-gray-500">Products</div>
          <div className="text-3xl font-bold mt-2">{stats.productCount}</div>
        </div>
      </div>
    </main>
  );
}
