"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/ui/cn";
import { authFetch } from "@/lib/auth/clientAuth";
import { listPartHref, requestBoardHref } from "@/lib/requests/demandLinks";

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

type Opportunity = {
  brand: string;
  partType: string;
  deviceModel?: string;
  requests: number;
  listings: number;
  searches: number;
  gap: number;
};

export default function DemandMatches() {
  const [items, setItems] = useState<DemandItem[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/technician/demand?limit=6")
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data.items) ? data.items : []);
        setOpportunities(
          Array.isArray(data.opportunities) ? data.opportunities : [],
        );
      })
      .catch(() => {
        setItems([]);
        setOpportunities([]);
      })
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

  return (
    <div className="space-y-6 mb-6 md:mb-8">
      {opportunities.length > 0 && (
        <Card className="p-5 md:p-8">
          <h2 className="text-lg md:text-xl font-semibold text-[var(--ink)] mb-1">
            High demand right now
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Aggregated from recent requests and searches — no buyer identities.
          </p>
          <ul className="space-y-2">
            {opportunities.slice(0, 5).map((row) => {
              const boardHref = requestBoardHref({
                brand: row.brand,
                deviceModel: row.deviceModel,
                category: row.partType,
              });
              const createHref = listPartHref({
                brand: row.brand,
                deviceModel: row.deviceModel,
                partType: row.partType,
              });
              return (
                <li
                  key={`${row.brand}-${row.partType}-${row.deviceModel || ""}`}
                  className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[var(--ink)] capitalize">
                      {[row.brand, row.deviceModel, row.partType]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {row.requests} requests · {row.listings} listings
                      {row.searches ? ` · ${row.searches} searches` : ""}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      href={boardHref}
                      className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
                    >
                      View requests
                    </Link>
                    <Link
                      href={createHref}
                      className="text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--brand)]"
                    >
                      List this part
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Card className="p-5 md:p-8">
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

        {items.length === 0 ? (
          <>
            <p className="text-sm text-[var(--muted)] mb-3">
              No open requests match your approved listings right now. Keep stock
              updated so new demand can find you.
            </p>
            <Link
              href="/requests"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Browse requests
            </Link>
          </>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const href = item.href || requestBoardHref({
                brand: item.brand,
                deviceModel: item.deviceModel,
                category: item.category,
                requestId: item.requestId,
              });
              const createHref = listPartHref({
                brand: item.brand,
                deviceModel: item.deviceModel,
                partType: item.category,
                deviceCategory: item.deviceCategory,
              });
              return (
                <li
                  key={item.requestId}
                  className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3 md:p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <Link
                      href={href}
                      className="font-semibold text-[var(--ink)] capitalize hover:text-[var(--brand)]"
                    >
                      {item.category}
                    </Link>
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
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {item.reasons.slice(0, 3).map((reason) => (
                      <Badge key={reason} tone="neutral" className="text-[10px]">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={href}
                      className={cn(buttonVariants({ size: "sm", variant: "soft" }))}
                    >
                      Open on board
                    </Link>
                    <Link
                      href={createHref}
                      className={cn(
                        buttonVariants({ size: "sm", variant: "secondary" }),
                      )}
                    >
                      List this part
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
