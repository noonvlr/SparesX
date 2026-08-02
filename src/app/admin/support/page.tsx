"use client";

import { useEffect, useState } from "react";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "unread", label: "Unread" },
];

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-[var(--brand-soft)] text-[var(--brand-hover)] border-teal-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-gray-50 text-gray-600 border-gray-200",
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

  const selected = tickets.find((t) => t._id === selectedId) || null;

  const visibleTickets =
    status === "unread" ? tickets.filter(isUnread) : tickets;

  const load = async (filter = status) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const apiStatus = filter === "unread" ? "all" : filter;
      const res = await fetch(`/api/admin/support?status=${apiStatus}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load");
        return;
      }
      setTickets(data.tickets || []);
      setUnreadCount(data.unreadCount || 0);
      setError("");
      // Notify navbar to refresh badge
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (selected) setReply(selected.adminReply || "");
  }, [selectedId]);

  async function markAsRead(ticketId: string) {
    const token = localStorage.getItem("token");
    if (!token) return;

    const ticket = tickets.find((t) => t._id === ticketId);
    if (!ticket || !isUnread(ticket)) return;

    // Optimistic UI
    setTickets((prev) =>
      prev.map((t) =>
        t._id === ticketId
          ? { ...t, adminUnread: false, adminReadAt: new Date().toISOString() }
          : t,
      ),
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
    const token = localStorage.getItem("token");
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/support/${selected._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  if (error && !tickets.length) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Support inbox</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-green-500 text-white text-xs font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Unread messages stay bold until you open them
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                status === opt.value
                  ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-teal-200"
              }`}
            >
              {opt.label}
              {opt.value === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading...</div>
          ) : visibleTickets.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No tickets in this view.</div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
              {visibleTickets.map((ticket) => {
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
                            ? "bg-emerald-50/40 hover:bg-emerald-50/70"
                            : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            unread ? "bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.25)]" : "bg-transparent"
                          }`}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p
                              className={`text-sm line-clamp-2 ${
                                unread
                                  ? "font-bold text-gray-900"
                                  : "font-medium text-gray-700"
                              }`}
                            >
                              {ticket.subject}
                            </p>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[ticket.status]}`}
                            >
                              {String(ticket.status).replace("_", " ")}
                            </span>
                          </div>
                          <p
                            className={`text-xs ${unread ? "text-gray-700 font-medium" : "text-gray-500"}`}
                          >
                            {ticket.name} · {ticket.email}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 capitalize">
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
          )}
        </div>

        <div className="lg:col-span-3 bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-sm p-5 min-h-[420px]">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">
              Select a ticket to open and reply
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selected.subject}
                  </h2>
                  {!isUnread(selected) && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Read
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  From {selected.name} ({selected.email}) ·{" "}
                  <span className="capitalize">
                    {String(selected.type).replace("_", " ")}
                  </span>
                </p>
                {(selected.reportedUser || selected.product) && (
                  <div className="mt-2 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-900 space-y-1">
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
                  </div>
                )}
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {selected.message}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Admin reply
                </label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm min-h-[120px]"
                  placeholder="Write a reply the user will see on their Support page..."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => updateTicket("in_progress")}
                  className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold disabled:opacity-60"
                >
                  Save & mark in progress
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => updateTicket("resolved")}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-60"
                >
                  Resolve
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => updateTicket("closed")}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold disabled:opacity-60"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
