"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MyRequest = {
  _id: string;
  category: string;
  brand?: string;
  deviceModel?: string;
  deviceCategory?: string;
  description: string;
  phone?: string;
  status: "open" | "fulfilled" | "closed";
  createdAt: string;
  updatedAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  fulfilled: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function MyRequestsPanel() {
  const router = useRouter();
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    description: "",
    category: "",
    brand: "",
    deviceModel: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace(
        `/login?next=${encodeURIComponent("/requests?tab=mine")}`,
      );
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ mine: "1", status, limit: "50" });
      const res = await fetch(`/api/requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load your requests");
        return;
      }
      setRequests(data.requests || []);
      setError("");
    } catch {
      setError("Failed to load your requests");
    } finally {
      setLoading(false);
    }
  }, [router, status]);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(item: MyRequest) {
    setEditingId(item._id);
    setEditDraft({
      description: item.description || "",
      category: item.category || "",
      brand: item.brand || "",
      deviceModel: item.deviceModel || "",
      phone: item.phone || "",
    });
  }

  async function saveEdit(id: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editDraft),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Update failed");
        return;
      }
      setEditingId(null);
      await load();
    } catch {
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function setRequestStatus(id: string, next: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Status update failed");
        return;
      }
      await load();
    } catch {
      alert("Status update failed");
    }
  }

  async function removeRequest(id: string) {
    if (!confirm("Delete this request permanently?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Delete failed");
        return;
      }
      await load();
    } catch {
      alert("Delete failed");
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            My requests
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Update status, edit details, or delete your spare-part requests.
          </p>
        </div>
        <Link
          href="/requests?tab=submit"
          scroll={false}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          New request
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "open", "fulfilled", "closed"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border capitalize ${
              status === s
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center bg-white">
          <p className="text-gray-600 text-sm mb-3">You have no requests yet.</p>
          <Link
            href="/requests?tab=submit"
            scroll={false}
            className="text-blue-600 font-semibold text-sm hover:underline"
          >
            Submit your first request
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((item) => (
            <li
              key={item._id}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {item.category}
                    {item.brand ? ` · ${item.brand}` : ""}
                    {item.deviceModel ? ` · ${item.deviceModel}` : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Updated {new Date(item.updatedAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[item.status]}`}
                >
                  {item.status}
                </span>
              </div>

              {editingId === item._id ? (
                <div className="space-y-2 mt-3">
                  <input
                    value={editDraft.category}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, category: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Category / part"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={editDraft.brand}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, brand: e.target.value }))
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Brand"
                    />
                    <input
                      value={editDraft.deviceModel}
                      onChange={(e) =>
                        setEditDraft((d) => ({
                          ...d,
                          deviceModel: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Model"
                    />
                  </div>
                  <textarea
                    value={editDraft.description}
                    onChange={(e) =>
                      setEditDraft((d) => ({
                        ...d,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={editDraft.phone}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, phone: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Phone"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void saveEdit(item._id)}
                      className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.status !== "fulfilled" && (
                      <button
                        type="button"
                        onClick={() =>
                          void setRequestStatus(item._id, "fulfilled")
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                      >
                        Mark fulfilled
                      </button>
                    )}
                    {item.status !== "open" && (
                      <button
                        type="button"
                        onClick={() => void setRequestStatus(item._id, "open")}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700"
                      >
                        Reopen
                      </button>
                    )}
                    {item.status !== "closed" && (
                      <button
                        type="button"
                        onClick={() =>
                          void setRequestStatus(item._id, "closed")
                        }
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700"
                      >
                        Close
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-semibold text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeRequest(item._id)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
