"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPage } from "@/components/layout";
import { Card, Badge, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "Under review" },
  { value: "waiting_user", label: "Waiting for user" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "unread", label: "Unread" },
];

const TARGET_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "product", label: "Product" },
  { value: "user", label: "User" },
  { value: "message", label: "Message" },
  { value: "none", label: "General support" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All priorities" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

const SORT_OPTIONS = [
  { value: "unresolved", label: "Unresolved first" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "updated", label: "Recently updated" },
  { value: "priority", label: "Priority" },
];

const STATUS_TONE: Record<string, "warning" | "brand" | "success" | "neutral" | "danger"> = {
  open: "warning",
  in_progress: "brand",
  waiting_user: "brand",
  resolved: "success",
  closed: "neutral",
};

type TicketRow = {
  _id: string;
  caseNumber?: string;
  kindLabel?: string;
  reasonLabel?: string;
  subject: string;
  status: string;
  statusLabel?: string;
  priority?: string;
  adminUnread?: boolean;
  reporter?: { name?: string; email?: string };
  assignedTo?: { name?: string } | null;
  productSnapshot?: { productTitle?: string };
  reportedUserSnapshot?: { name?: string };
  createdAt: string;
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [status, setStatus] = useState("all");
  const [targetType, setTargetType] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState("unresolved");
  const [q, setQ] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    open: 0,
    underReview: 0,
    highPriority: 0,
    resolvedToday: 0,
  });

  const load = async (nextPage = page) => {
    if (!isLoggedInClient()) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status,
        targetType,
        priority,
        sort,
        page: String(nextPage),
        limit: "40",
      });
      if (q) params.set("q", q);
      const res = await authFetch(`/api/admin/support?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load");
        return;
      }
      setTickets(data.tickets || []);
      setUnreadCount(data.unreadCount || 0);
      setPage(data.page || nextPage);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
      if (data.stats) setStats(data.stats);
      setError("");
      window.dispatchEvent(
        new CustomEvent("support-unread-updated", {
          detail: { unreadCount: data.unreadCount || 0 },
        }),
      );
    } catch {
      setError("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, targetType, priority, sort, q]);

  if (error && !tickets.length && !loading) {
    return (
      <AdminPage title="Support cases">
        <Alert tone="danger">{error}</Alert>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        title="Support cases"
        description="Investigate reports with listing, user, and message context captured at submit time."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/disputes"
              className="text-sm font-semibold text-[var(--brand)] hover:underline"
            >
              Dispute SOP
            </Link>
            {unreadCount > 0 ? (
              <Badge tone="success">
                {unreadCount > 99 ? "99+" : unreadCount} unread
              </Badge>
            ) : null}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Open", value: stats.open },
          { label: "Under review", value: stats.underReview },
          { label: "High priority", value: stats.highPriority },
          { label: "Resolved today", value: stats.resolvedToday },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {item.label}
            </p>
            <p className="text-2xl font-bold text-[var(--ink)] mt-1">
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <form
        className="flex flex-col lg:flex-row gap-2 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(qDraft.trim());
        }}
      >
        <Input
          value={qDraft}
          onChange={(e) => setQDraft(e.target.value)}
          placeholder="Search case #, email, user, product…"
          aria-label="Search cases"
          size="sm"
        />
        <Button type="submit" size="sm">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2 mb-4">
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          size="sm"
          aria-label="Filter by status"
          className="w-auto min-w-[10rem]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
          size="sm"
          aria-label="Filter by type"
          className="w-auto min-w-[10rem]"
        >
          {TARGET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          size="sm"
          aria-label="Filter by priority"
          className="w-auto min-w-[9rem]"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          size="sm"
          aria-label="Sort cases"
          className="w-auto min-w-[11rem]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-6 text-sm text-[var(--muted)]">
            <Spinner size="sm" /> Loading…
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-6 text-sm text-[var(--muted)]">No cases in this view.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-[var(--surface-2)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2 font-semibold">Case</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Reporter</th>
                  <th className="px-3 py-2 font-semibold">Target</th>
                  <th className="px-3 py-2 font-semibold">Priority</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--divider)]">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    className={ticket.adminUnread ? "bg-[var(--success-soft)]/30" : ""}
                  >
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/support/${ticket._id}`}
                        className="font-semibold text-[var(--brand)] hover:underline"
                      >
                        {ticket.caseNumber || ticket._id.slice(-6)}
                      </Link>
                      <p className="text-xs text-[var(--muted)] line-clamp-1">
                        {ticket.subject}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p>{ticket.kindLabel}</p>
                      {ticket.reasonLabel ? (
                        <p className="text-xs text-[var(--muted)]">
                          {ticket.reasonLabel}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      {ticket.reporter?.name}
                      <p className="text-xs text-[var(--muted)]">
                        {ticket.reporter?.email}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      {ticket.productSnapshot?.productTitle ||
                        ticket.reportedUserSnapshot?.name ||
                        "—"}
                    </td>
                    <td className="px-3 py-3 capitalize">
                      <span
                        className={
                          ticket.priority === "high"
                            ? "font-semibold text-[var(--danger)]"
                            : ""
                        }
                      >
                        {ticket.priority || "normal"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={STATUS_TONE[ticket.status] || "neutral"}>
                        {ticket.statusLabel || ticket.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-xs text-[var(--muted)] whitespace-nowrap">
                      {new Date(ticket.createdAt).toLocaleString("en-IN")}
                      {ticket.assignedTo?.name ? (
                        <p>Assigned: {ticket.assignedTo.name}</p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                void load(next);
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
                void load(next);
              }}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </AdminPage>
  );
}
