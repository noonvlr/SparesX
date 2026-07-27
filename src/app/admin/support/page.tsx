"use client";

import { useEffect, useState } from "react";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [status, setStatus] = useState("open");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = tickets.find((t) => t._id === selectedId) || null;

  const load = async (filter = status) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/support?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load");
        return;
      }
      setTickets(data.tickets || []);
      setError("");
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
        }),
      });
      if (res.ok) {
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
          <h1 className="text-3xl font-bold text-gray-900">Support inbox</h1>
          <p className="text-gray-600 text-sm mt-1">
            User bugs, change requests, and issues
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
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No tickets in this view.</div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
              {tickets.map((ticket) => (
                <li key={ticket._id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(ticket._id)}
                    className={`w-full text-left p-4 hover:bg-blue-50/50 transition ${
                      selectedId === ticket._id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-2">
                        {ticket.subject}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[ticket.status]}`}
                      >
                        {String(ticket.status).replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {ticket.name} · {ticket.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 capitalize">
                      {String(ticket.type).replace("_", " ")} ·{" "}
                      {new Date(ticket.createdAt).toLocaleString("en-IN")}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 min-h-[420px]">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">
              Select a ticket to reply
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selected.subject}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  From {selected.name} ({selected.email}) ·{" "}
                  <span className="capitalize">
                    {String(selected.type).replace("_", " ")}
                  </span>
                </p>
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
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
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
