"use client";

import { useEffect, useState } from "react";

export default function DashboardStats() {
  const [stats, setStats] = useState({
    listings: 0,
    active: 0,
    pending: 0,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setStats((s) => ({ ...s, loading: false }));
      return;
    }

    fetch("/api/technician/products", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const products = data.products || [];
        setStats({
          listings: products.length,
          active: products.filter((p: any) => p.status === "approved").length,
          pending: products.filter((p: any) => p.status === "pending").length,
          loading: false,
        });
      })
      .catch(() => setStats((s) => ({ ...s, loading: false })));
  }, []);

  const display = (value: number) => (stats.loading ? "…" : value);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 md:p-8 mb-6 md:mb-8">
      <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
        Your Statistics
      </h2>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="p-3 md:p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <p className="text-xs font-semibold text-blue-700 mb-2">Listings</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-900">
            {display(stats.listings)}
          </p>
        </div>
        <div className="p-3 md:p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <p className="text-xs font-semibold text-green-700 mb-2">Active</p>
          <p className="text-2xl md:text-3xl font-bold text-green-900">
            {display(stats.active)}
          </p>
        </div>
        <div className="p-3 md:p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <p className="text-xs font-semibold text-purple-700 mb-2">Pending</p>
          <p className="text-2xl md:text-3xl font-bold text-purple-900">
            {display(stats.pending)}
          </p>
        </div>
      </div>
    </div>
  );
}
