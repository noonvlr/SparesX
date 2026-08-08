"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/ui/cn";

type DemandItem = {
  requestId: string;
  category: string;
  brand?: string;
  deviceModel?: string;
  deviceCategory?: string;
  description: string;
  createdAt: string;
  reasons: string[];
  href: string;
};

export default function DemandMatches() {
  const [items, setItems] = useState<DemandItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("/api/technician/demand?limit=6", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-5 md:p-8 mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold text-[var(--ink)] mb-2">
          Buyers looking for your stock
        </h2>
        <p className="text-sm text-[var(--muted)]">Loading demand matches…</p>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-5 md:p-8 mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold text-[var(--ink)] mb-2">
          Buyers looking for your stock
        </h2>
        <p className="text-sm text-[var(--muted)] mb-3">
          No open requests match your approved listings right now. Keep stock
          updated so new demand can find you.
        </p>
        <Link href="/requests" className={cn(buttonVariants({ size: "sm" }))}>
          Browse requests
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-5 md:p-8 mb-6 md:mb-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-4 border-b border-[var(--border)]">
        <h2 className="text-lg md:text-xl font-semibold text-[var(--ink)]">
          Buyers looking for your stock
        </h2>
        <Link
          href="/requests"
          className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
        >
          Open board →
        </Link>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.requestId}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3 md:p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
              <p className="font-semibold text-[var(--ink)] capitalize">
                {item.category}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {new Date(item.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] mb-2">
              {[item.deviceCategory, item.brand, item.deviceModel]
                .filter(Boolean)
                .join(" · ") || "Device not specified"}
            </p>
            <p className="text-sm text-[var(--ink)] line-clamp-2 mb-2">
              {item.description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.reasons.slice(0, 3).map((reason) => (
                <Badge key={reason} tone="neutral" className="text-[10px]">
                  {reason}
                </Badge>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
