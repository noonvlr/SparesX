"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPage } from "@/components/layout";
import { Card, Badge, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

const STATUS_TONE: Record<string, "warning" | "success" | "neutral"> = {
  open: "warning",
  fulfilled: "success",
  closed: "neutral",
};

type SpareRequest = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  deviceCategory?: string;
  brand?: string;
  deviceModel?: string;
  description: string;
  status: string;
  createdAt: string;
  userId?: { name?: string; email?: string; mobile?: string };
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<SpareRequest[]>([]);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    open: 0,
    fulfilled: 0,
    closed: 0,
  });
  const [selected, setSelected] = useState<SpareRequest | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [demand, setDemand] = useState<{
    windowDays: number;
    openLast7Days: number;
    topCategories: { name: string; count: number }[];
    topBrands: { name: string; count: number }[];
    topDeviceCategories: { name: string; count: number }[];
  } | null>(null);

  const load = useCallback(async (nextStatus = status, nextQ = q, nextPage = page) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: nextStatus,
        page: String(nextPage),
        limit: "40",
      });
      if (nextQ.trim()) params.set("q", nextQ.trim());
      const res = await fetch(`/api/admin/requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load");
        return;
      }
      setRequests(data.requests || []);
      setStatusCounts(data.statusCounts || statusCounts);
      setDemand(data.demand || null);
      setPage(data.page || nextPage);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
      setError("");
    } catch {
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [status, q, page]);

  useEffect(() => {
    setPage(1);
    load(status, q, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function patchStatus(id: string, next: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        await load(status, q, page);
        setSelected((s) => (s && s._id === id ? { ...s, status: next } : s));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this request permanently?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (selected?._id === id) setSelected(null);
        await load(status, q, page);
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminPage>
      <PageHeader
        title="Manage requests"
        description="Moderate spare-part requests and watch demand signals from the last 30 days"
        actions={
          <Link
            href="/requests"
            className="text-sm text-[var(--brand)] hover:underline"
          >
            View public board →
          </Link>
        }
      />

      {demand && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
          <Card padding="md">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
              Open (7 days)
            </p>
            <p className="text-2xl font-bold text-[var(--ink)] mt-1">
              {demand.openLast7Days}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              New open requests this week
            </p>
          </Card>
          {(
            [
              ["Top parts", demand.topCategories],
              ["Top brands", demand.topBrands],
              ["Device types", demand.topDeviceCategories],
            ] as const
          ).map(([label, rows]) => (
            <Card key={label} padding="md">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
                {label} · {demand.windowDays}d
              </p>
              {rows.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No data yet</p>
              ) : (
                <ul className="space-y-1.5">
                  {rows.slice(0, 5).map((row) => (
                    <li
                      key={`${label}-${row.name}`}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate capitalize text-[var(--ink)]">
                        {row.name}
                      </span>
                      <span className="font-semibold text-[var(--ink-secondary)] tabular-nums">
                        {row.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["all", "All"],
            ["open", "Open"],
            ["fulfilled", "Fulfilled"],
            ["closed", "Closed"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={status === value ? "primary" : "outline"}
            onClick={() => setStatus(value)}
            className="rounded-full"
          >
            {label} ({statusCounts[value] ?? 0})
          </Button>
        ))}
      </div>

      <form
        className="flex gap-2 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load(status, q, 1);
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, part, brand..."
          className="flex-1"
          size="sm"
        />
        <Button type="submit" size="sm">
          Search
        </Button>
      </form>

      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card padding="none" className="lg:col-span-2 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-[var(--muted)]">
              <Spinner size="sm" /> Loading…
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-sm text-[var(--muted)]">No requests found.</div>
          ) : (
            <ul className="divide-y divide-[var(--divider)] max-h-[70vh] overflow-y-auto">
              {requests.map((r) => (
                <li key={r._id}>
                  <button
                    type="button"
                    onClick={() => setSelected(r)}
                    className={`w-full text-left p-4 hover:bg-[var(--surface-hover)] ${
                      selected?._id === r._id ? "bg-[var(--brand-soft)]" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm text-[var(--ink)] line-clamp-2">
                        {r.category}
                      </p>
                      <Badge
                        tone={STATUS_TONE[r.status] || "neutral"}
                        className="capitalize"
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--ink-secondary)]">
                      {r.name} · {r.email}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {[r.deviceCategory, r.brand, r.deviceModel]
                        .filter(Boolean)
                        .join(" · ") || "No device info"}{" "}
                      · {new Date(r.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {pages > 1 && (
            <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] px-3 py-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => {
                  const next = Math.max(1, page - 1);
                  setPage(next);
                  void load(status, q, next);
                }}
              >
                Previous
              </Button>
              <span className="text-xs text-[var(--muted)]">
                Page {page} / {pages} · {total} total
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page >= pages || loading}
                onClick={() => {
                  const next = Math.min(pages, page + 1);
                  setPage(next);
                  void load(status, q, next);
                }}
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        <Card padding="md" className="lg:col-span-3 min-h-[360px]">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-sm text-[var(--muted)]">
              Select a request to manage
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)] capitalize">
                  {selected.category}
                </h2>
                <p className="text-sm text-[var(--muted)] mt-1">
                  {[selected.deviceCategory, selected.brand, selected.deviceModel]
                    .filter(Boolean)
                    .join(" · ") || "Device not specified"}
                </p>
              </div>

              <div className="rounded-[var(--radius)] bg-[var(--surface-2)] border border-[var(--border)] p-4">
                <p className="text-sm text-[var(--ink)] whitespace-pre-wrap">
                  {selected.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-[var(--radius)] border border-[var(--border)] p-3">
                  <p className="text-xs font-semibold text-[var(--muted)] mb-1">
                    Contact
                  </p>
                  <p className="font-medium text-[var(--ink)]">{selected.name}</p>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-[var(--brand)] hover:underline block"
                  >
                    {selected.email}
                  </a>
                  {selected.phone && (
                    <a
                      href={`tel:${selected.phone}`}
                      className="text-[var(--brand)] hover:underline block"
                    >
                      {selected.phone}
                    </a>
                  )}
                </div>
                <div className="rounded-[var(--radius)] border border-[var(--border)] p-3">
                  <p className="text-xs font-semibold text-[var(--muted)] mb-1">
                    Meta
                  </p>
                  <p className="text-[var(--ink)]">
                    Status:{" "}
                    <span className="capitalize font-medium">
                      {selected.status}
                    </span>
                  </p>
                  <p className="text-[var(--ink)]">
                    Posted:{" "}
                    {new Date(selected.createdAt).toLocaleString("en-IN")}
                  </p>
                  {selected.userId && (
                    <p className="text-[var(--ink-secondary)] mt-1">
                      Account: {selected.userId.name || selected.userId.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {selected.status !== "fulfilled" && (
                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    disabled={busyId === selected._id}
                    onClick={() => patchStatus(selected._id, "fulfilled")}
                  >
                    Mark fulfilled
                  </Button>
                )}
                {selected.status !== "open" && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={busyId === selected._id}
                    onClick={() => patchStatus(selected._id, "open")}
                    className="bg-[var(--warning)] text-[var(--ink-inverse)] hover:opacity-90"
                  >
                    Reopen
                  </Button>
                )}
                {selected.status !== "closed" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === selected._id}
                    onClick={() => patchStatus(selected._id, "closed")}
                  >
                    Close
                  </Button>
                )}
                {selected.phone && (
                  <a
                    href={`https://wa.me/91${selected.phone.replace(/\D/g, "").slice(-10)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-[var(--radius)] bg-[var(--success)] text-[var(--ink-inverse)] text-sm font-semibold"
                  >
                    WhatsApp
                  </a>
                )}
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={busyId === selected._id}
                  onClick={() => remove(selected._id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminPage>
  );
}
