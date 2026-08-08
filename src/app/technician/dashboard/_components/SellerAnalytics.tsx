"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { authFetch } from "@/lib/auth/clientAuth";
import { productPath } from "@/lib/seo/site";

type ListingRow = {
  productId: string;
  slug?: string;
  name: string;
  status?: string;
  views: number;
  chats: number;
  whatsappRequests: number;
  whatsappApproved: number;
  sold: number;
};

export default function SellerAnalytics() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [totals, setTotals] = useState({
    views: 0,
    chats: 0,
    whatsappRequests: 0,
    sold: 0,
  });
  const [responseRate, setResponseRate] = useState(0);
  const [responseSampleSize, setResponseSampleSize] = useState(0);
  const [listings, setListings] = useState<ListingRow[]>([]);

  useEffect(() => {
    setLoading(true);
    authFetch(`/api/technician/analytics?days=${days}`)
      .then((res) => res.json())
      .then((data) => {
        setTotals({
          views: data.totals?.views || 0,
          chats: data.totals?.chats || 0,
          whatsappRequests: data.totals?.whatsappRequests || 0,
          sold: data.totals?.sold || 0,
        });
        setResponseRate(data.responseRate || 0);
        setResponseSampleSize(data.responseSampleSize || 0);
        setListings(Array.isArray(data.listings) ? data.listings : []);
      })
      .catch(() => {
        setListings([]);
      })
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <Card className="p-5 md:p-8 mb-6 md:mb-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-[var(--ink)]">
            Listing performance
          </h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            Aggregated views and contacts — no buyer identities.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading analytics…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            {[
              { label: "Views", value: totals.views },
              { label: "Chats started", value: totals.chats },
              { label: "WA requests", value: totals.whatsappRequests },
              { label: "Marked sold", value: totals.sold },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5"
              >
                <p className="text-[11px] text-[var(--muted)] font-medium">
                  {item.label}
                </p>
                <p className="text-lg font-semibold tabular-nums text-[var(--ink)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {responseSampleSize >= 3 ? (
            <p className="text-sm text-[var(--ink-secondary)] mb-4">
              Your reply rate (24h):{" "}
              <span className="font-semibold text-[var(--ink)]">
                {responseRate}%
              </span>{" "}
              across {responseSampleSize} inbound chats.
            </p>
          ) : (
            <p className="text-sm text-[var(--muted)] mb-4">
              Reply rate appears after a few inbound chats (need 3+).
            </p>
          )}

          {listings.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No listings yet.{" "}
              <Link
                href="/technician/products/new"
                className="font-semibold text-[var(--brand)]"
              >
                Add a product
              </Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {listings.slice(0, 8).map((row) => (
                <li
                  key={row.productId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
                >
                  <Link
                    href={
                      row.status === "approved"
                        ? productPath(row)
                        : `/technician/products/edit/${row.productId}`
                    }
                    className="text-sm font-medium text-[var(--ink)] hover:text-[var(--brand)] line-clamp-1"
                  >
                    {row.name}
                  </Link>
                  <p className="text-xs text-[var(--muted)] tabular-nums">
                    {row.views} views · {row.chats} chats · {row.whatsappRequests}{" "}
                    WA
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}
