"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

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
    <Card className="p-5 md:p-8 mb-6 md:mb-8">
      <h2 className="text-lg md:text-2xl font-semibold text-[var(--ink)] mb-6 pb-4 border-b border-[var(--border)]">
        Your Statistics
      </h2>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="p-3 md:p-4 rounded-[var(--radius)] bg-[var(--brand-soft)] border border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--brand-hover)] mb-2">
            Listings
          </p>
          <p className="text-2xl md:text-3xl font-semibold text-[var(--ink)]">
            {display(stats.listings)}
          </p>
        </div>
        <div className="p-3 md:p-4 rounded-[var(--radius)] bg-[var(--success-soft)] border border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--success)] mb-2">
            Active
          </p>
          <p className="text-2xl md:text-3xl font-semibold text-[var(--ink)]">
            {display(stats.active)}
          </p>
        </div>
        <div className="p-3 md:p-4 rounded-[var(--radius)] bg-[var(--warning-soft)] border border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--warning)] mb-2">
            Pending
          </p>
          <p className="text-2xl md:text-3xl font-semibold text-[var(--ink)]">
            {display(stats.pending)}
          </p>
        </div>
      </div>
    </Card>
  );
}
