"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  approved: "bg-green-50 text-green-800 border-green-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
};

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  deviceCategory?: string;
  brand?: string;
  deviceModel?: string;
  partType?: string;
  condition: string;
  priceNegotiable?: boolean;
  images?: string[];
  status: string;
  featured?: boolean;
  technician?: { name?: string; email?: string; mobile?: string };
  createdAt: string;
};

const emptyEdit = {
  name: "",
  description: "",
  price: "",
  deviceCategory: "",
  brand: "",
  deviceModel: "",
  partType: "",
  condition: "used",
  priceNegotiable: false,
  status: "approved",
  featured: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem("token");

  const load = useCallback(async (nextStatus = status, nextQ = q) => {
    const t = token();
    if (!t) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: nextStatus, limit: "100" });
      if (nextQ.trim()) params.set("q", nextQ.trim());
      const res = await fetch(`/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load");
        return;
      }
      setProducts(data.products || []);
      setStatusCounts(data.statusCounts || statusCounts);
      setError("");
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [status, q]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function patchProduct(id: string, body: Record<string, unknown>) {
    const t = token();
    if (!t) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) await load();
      else {
        const data = await res.json();
        alert(data.message || "Update failed");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`Delete "${name}" permanently?`)) return;
    const t = token();
    if (!t) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        if (editId === id) setEditId(null);
        await load();
      } else {
        const data = await res.json();
        alert(data.message || "Delete failed");
      }
    } finally {
      setBusyId(null);
    }
  }

  function openEdit(p: Product) {
    setEditId(p._id);
    setEditForm({
      name: p.name || "",
      description: p.description || "",
      price: String(p.price ?? ""),
      deviceCategory: p.deviceCategory || "",
      brand: p.brand || "",
      deviceModel: p.deviceModel || "",
      partType: p.partType || "",
      condition: p.condition || "used",
      priceNegotiable: !!p.priceNegotiable,
      status: p.status || "approved",
      featured: !!p.featured,
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    try {
      await patchProduct(editId, {
        ...editForm,
        price: Number(editForm.price),
      });
      setEditId(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage products</h1>
          <p className="text-sm text-gray-600 mt-1">
            Approve, edit, feature, or remove any listing
          </p>
        </div>
        <Link href="/products" className="text-sm text-blue-600 hover:underline">
          View public catalog →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["all", "All"],
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
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
          placeholder="Search name, brand, model, part..."
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Fitment</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No products found.
                    </td>
                  </tr>
                )}
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/80 align-top">
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 line-clamp-1">
                            {p.name}
                            {p.featured && (
                              <span className="ml-2 text-[10px] font-bold text-amber-600">
                                ★ FEATURED
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {p.description}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5 capitalize">
                            {p.condition}
                            {p.priceNegotiable ? " · Negotiable" : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      <p className="capitalize">{p.deviceCategory || "—"}</p>
                      <p>
                        {p.brand || "—"} {p.deviceModel || ""}
                      </p>
                      <p className="text-gray-500 capitalize">{p.partType || "—"}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      ₹{Number(p.price).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${STATUS_STYLE[p.status] || ""}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      <p className="font-medium">{p.technician?.name || "N/A"}</p>
                      <p className="text-gray-500">{p.technician?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                        {p.status !== "approved" && (
                          <button
                            type="button"
                            disabled={busyId === p._id}
                            onClick={() =>
                              patchProduct(p._id, { status: "approved" })
                            }
                            className="px-2 py-1 rounded-lg bg-green-600 text-white text-[11px] font-semibold disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {p.status !== "rejected" && (
                          <button
                            type="button"
                            disabled={busyId === p._id}
                            onClick={() =>
                              patchProduct(p._id, { status: "rejected" })
                            }
                            className="px-2 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-semibold disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId === p._id}
                          onClick={() =>
                            patchProduct(p._id, { featured: !p.featured })
                          }
                          className="px-2 py-1 rounded-lg border border-amber-300 text-amber-800 text-[11px] font-semibold disabled:opacity-50"
                        >
                          {p.featured ? "Unfeature" : "Feature"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="px-2 py-1 rounded-lg border border-blue-200 text-blue-700 text-[11px] font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={busyId === p._id}
                          onClick={() => deleteProduct(p._id, p.name)}
                          className="px-2 py-1 rounded-lg border border-red-200 text-red-700 text-[11px] font-semibold disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={saveEdit}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Edit product</h2>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {(
              [
                ["name", "Name"],
                ["description", "Description"],
                ["price", "Price"],
                ["deviceCategory", "Device category"],
                ["brand", "Brand"],
                ["deviceModel", "Model"],
                ["partType", "Part type"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {label}
                </label>
                {key === "description" ? (
                  <textarea
                    value={editForm[key]}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
                    required
                  />
                ) : (
                  <input
                    type={key === "price" ? "number" : "text"}
                    value={editForm[key]}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                    required={key !== "partType"}
                  />
                )}
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  value={editForm.condition}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, condition: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editForm.priceNegotiable}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    priceNegotiable: e.target.checked,
                  }))
                }
              />
              Price negotiable
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editForm.featured}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, featured: e.target.checked }))
                }
              />
              Featured on homepage
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
