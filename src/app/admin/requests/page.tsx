"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-50 text-amber-800 border-amber-200",
  fulfilled: "bg-green-50 text-green-800 border-green-200",
  closed: "bg-gray-50 text-gray-700 border-gray-200",
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

  const load = useCallback(async (nextStatus = status, nextQ = q) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: nextStatus });
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
      setError("");
    } catch {
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [status, q]);

  useEffect(() => {
    load();
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
        await load();
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
        await load();
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage requests</h1>
          <p className="text-sm text-gray-600 mt-1">
            Moderate spare-part requests — mark fulfilled, close, or delete
          </p>
        </div>
        <Link href="/requests" className="text-sm text-blue-600 hover:underline">
          View public board →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["all", "All"],
            ["open", "Open"],
            ["fulfilled", "Fulfilled"],
            ["closed", "Closed"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              status === value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {label} ({statusCounts[value] ?? 0})
          </button>
        ))}
      </div>

      <form
        className="flex gap-2 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          load(status, q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, part, brand..."
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold"
        >
          Search
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No requests found.</div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
              {requests.map((r) => (
                <li key={r._id}>
                  <button
                    type="button"
                    onClick={() => setSelected(r)}
                    className={`w-full text-left p-4 hover:bg-gray-50 ${
                      selected?._id === r._id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-2">
                        {r.category}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {r.name} · {r.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
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
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 min-h-[360px]">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">
              Select a request to manage
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 capitalize">
                  {selected.category}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {[selected.deviceCategory, selected.brand, selected.deviceModel]
                    .filter(Boolean)
                    .join(" · ") || "Device not specified"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {selected.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    Contact
                  </p>
                  <p className="font-medium">{selected.name}</p>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-blue-600 hover:underline block"
                  >
                    {selected.email}
                  </a>
                  {selected.phone && (
                    <a
                      href={`tel:${selected.phone}`}
                      className="text-blue-600 hover:underline block"
                    >
                      {selected.phone}
                    </a>
                  )}
                </div>
                <div className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    Meta
                  </p>
                  <p>
                    Status:{" "}
                    <span className="capitalize font-medium">
                      {selected.status}
                    </span>
                  </p>
                  <p>
                    Posted:{" "}
                    {new Date(selected.createdAt).toLocaleString("en-IN")}
                  </p>
                  {selected.userId && (
                    <p className="text-gray-600 mt-1">
                      Account: {selected.userId.name || selected.userId.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {selected.status !== "fulfilled" && (
                  <button
                    type="button"
                    disabled={busyId === selected._id}
                    onClick={() => patchStatus(selected._id, "fulfilled")}
                    className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Mark fulfilled
                  </button>
                )}
                {selected.status !== "open" && (
                  <button
                    type="button"
                    disabled={busyId === selected._id}
                    onClick={() => patchStatus(selected._id, "open")}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Reopen
                  </button>
                )}
                {selected.status !== "closed" && (
                  <button
                    type="button"
                    disabled={busyId === selected._id}
                    onClick={() => patchStatus(selected._id, "closed")}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold disabled:opacity-50"
                  >
                    Close
                  </button>
                )}
                {selected.phone && (
                  <a
                    href={`https://wa.me/91${selected.phone.replace(/\D/g, "").slice(-10)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#25D366] text-white text-sm font-semibold"
                  >
                    WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  disabled={busyId === selected._id}
                  onClick={() => remove(selected._id)}
                  className="px-4 py-2 rounded-xl border border-red-200 text-red-700 text-sm font-semibold disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
