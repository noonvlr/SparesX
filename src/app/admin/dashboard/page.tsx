"use client";
import { useEffect, useState } from "react";

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
      .then((data) => setStats(data))
      .catch(() => setError("Failed to load dashboard"));
  }, []);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!stats) return <div className="p-8">Loading...</div>;

  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
          <div className="text-blue-100 text-sm font-medium uppercase tracking-wide">
            Total Users
          </div>
          <div className="text-4xl font-bold mt-2">{stats.userCount}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
          <div className="text-green-100 text-sm font-medium uppercase tracking-wide">
            Technicians
          </div>
          <div className="text-4xl font-bold mt-2">{stats.technicianCount}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
          <div className="text-purple-100 text-sm font-medium uppercase tracking-wide">
            Products
          </div>
          <div className="text-4xl font-bold mt-2">{stats.productCount}</div>
        </div>
      </div>
    </main>
  );
}
