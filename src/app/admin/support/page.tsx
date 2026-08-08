"use client";

import { useEffect, useState } from "react";
import { AdminPage } from "@/components/layout";
import { Card, Badge, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { authFetch, getAccessToken } from "@/lib/auth/clientAuth";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "unread", label: "Unread" },
];

const STATUS_TONE: Record<string, "warning" | "brand" | "success" | "neutral"> = {
  open: "warning",
  in_progress: "brand",
  resolved: "success",
  closed: "neutral",
};

function isUnread(ticket: any) {
  return ticket.adminUnread !== false;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const selected = tickets.find((t) => t._id === selectedId) || null;

  const load = async (filter = status, nextPage = page) => {
    if (!getAccessToken()) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filter,
        page: String(nextPage),
        limit: "40",
      });
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
    load(status, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (selected) setReply(selected.adminReply || "");
  }, [selectedId]);

  async function markAsRead(ticketId: string) {
    const ticket = tickets.find((t) => t._id === ticketId);
    if (!ticket || !isUnread(ticket)) return;

    setTickets((prev) =>
      prev.map((t) =>
        t._id === ticketId
          ? { ...t, adminUnread: false, adminReadAt: new Date().toISOString() }
          : t,
      ),
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      const res = await authFetch(`/api/admin/support/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markRead: true }),
      });
      const data = await res.json();
      if (res.ok) {
        const count = data.unreadCount ?? 0;
        setUnreadCount(count);
        window.dispatchEvent(
          new CustomEvent("support-unread-updated", {
            detail: { unreadCount: count },
          }),
        );
      }
    } catch {
      // ignore; next load will sync
    }
  }

  async function openTicket(ticketId: string) {
    setSelectedId(ticketId);
    await markAsRead(ticketId);
  }

  async function updateTicket(nextStatus?: string) {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/admin/support/${selected._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus || selected.status,
          adminReply: reply,
          markRead: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
          window.dispatchEvent(
            new CustomEvent("support-unread-updated", {
              detail: { unreadCount: data.unreadCount },
            }),
          );
        }
        await load(status, page);
      }
    } finally {
      setSaving(false);
    }
  }

  if (error && !tickets.length) {
    return (
      <AdminPage title="Support inbox">
        <Alert tone="danger">{error}</Alert>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        title="Support inbox"
        description="Unread messages stay bold until you open them"
        actions={
          unreadCount > 0 ? (
            <Badge tone="success">
              {unreadCount > 99 ? "99+" : unreadCount} unread
            </Badge>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={status === opt.value ? "primary" : "outline"}
            onClick={() => setStatus(opt.value)}
            className="rounded-full"
          >
            {opt.label}
            {opt.value === "unread" && unreadCount > 0
              ? ` (${unreadCount})`
              : ""}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card padding="none" className="lg:col-span-2 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-[var(--muted)]">
              <Spinner size="sm" /> Loading…
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-6 text-sm text-[var(--muted)]">
              No tickets in this view.
            </div>
          ) : (
            <>
            <ul className="divide-y divide-[var(--divider)] max-h-[70vh] overflow-y-auto">
              {tickets.map((ticket) => {
                const unread = isUnread(ticket);
                return (
                  <li key={ticket._id}>
                    <button
                      type="button"
                      onClick={() => openTicket(ticket._id)}
                      className={`w-full text-left p-4 transition relative ${
                        selectedId === ticket._id
                          ? "bg-[var(--brand-soft)]"
                          : unread
                            ? "bg-[var(--success-soft)]/40 hover:bg-[var(--success-soft)]/70"
                            : "hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            unread
                              ? "bg-[var(--success)]"
                              : "bg-transparent"
                          }`}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p
                              className={`text-sm line-clamp-2 ${
                                unread
                                  ? "font-bold text-[var(--ink)]"
                                  : "font-medium text-[var(--ink-secondary)]"
                              }`}
                            >
                              {ticket.subject}
                            </p>
                            <Badge
                              tone={STATUS_TONE[ticket.status] || "neutral"}
                              className="capitalize"
                            >
                              {String(ticket.status).replace("_", " ")}
                            </Badge>
                          </div>
                          <p
                            className={`text-xs ${unread ? "text-[var(--ink-secondary)] font-medium" : "text-[var(--muted)]"}`}
                          >
                            {ticket.name} · {ticket.email}
                          </p>
                          <p className="text-xs text-[var(--muted)] mt-1 capitalize">
                            {unread ? "New · " : "Opened · "}
                            {String(ticket.type).replace("_", " ")} ·{" "}
                            {new Date(ticket.createdAt).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
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
                    void load(status, next);
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
                    void load(status, next);
                  }}
                >
                  Next
                </Button>
              </div>
            )}
            </>
          )}
        </Card>

        <Card padding="md" className="lg:col-span-3 min-h-[420px]">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-sm text-[var(--muted)]">
              Select a ticket to open and reply
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-[var(--ink)]">
                    {selected.subject}
                  </h2>
                  {!isUnread(selected) && (
                    <Badge tone="neutral">Read</Badge>
                  )}
                </div>
                <p className="text-sm text-[var(--muted)] mt-1">
                  From {selected.name} ({selected.email}) ·{" "}
                  <span className="capitalize">
                    {String(selected.type).replace("_", " ")}
                  </span>
                </p>
                {(selected.reportedUser || selected.product) && (
                  <Alert tone="danger" className="mt-2 text-xs">
                    {selected.reportedUser && (
                      <p>
                        Reported user:{" "}
                        <span className="font-semibold">
                          {selected.reportedUser.name || "Unknown"}
                        </span>
                        {selected.reportedUser.email
                          ? ` · ${selected.reportedUser.email}`
                          : ""}
                        {selected.reportedUser.mobile
                          ? ` · ${selected.reportedUser.mobile}`
                          : ""}
                      </p>
                    )}
                    {selected.product && (
                      <p>
                        Product:{" "}
                        <span className="font-semibold">
                          {selected.product.name || selected.product._id}
                        </span>
                      </p>
                    )}
                  </Alert>
                )}
              </div>
              <div className="rounded-[var(--radius)] bg-[var(--surface-2)] border border-[var(--border)] p-4">
                <p className="text-sm text-[var(--ink)] whitespace-pre-wrap">
                  {selected.message}
                </p>
              </div>

              <Field label="Admin reply" htmlFor="admin-reply">
                <Textarea
                  id="admin-reply"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply the user will see on their Support page..."
                />
              </Field>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={saving}
                  loading={saving}
                  onClick={() => updateTicket("in_progress")}
                >
                  Save & mark in progress
                </Button>
                <Button
                  type="button"
                  variant="success"
                  disabled={saving}
                  onClick={() => updateTicket("resolved")}
                >
                  Resolve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => updateTicket("closed")}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminPage>
  );
}
