"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPage } from "@/components/layout";
import { Badge, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";

const STATUS_TONE: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
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
    <AdminPage>
      <PageHeader
        title="Manage products"
        description="Approve, edit, feature, or remove any listing"
        actions={
          <Link
            href="/products"
            className="text-sm text-[var(--brand)] hover:underline"
          >
            View public catalog →
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["all", "All"],
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
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
          load(status, q);
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, brand, model, part..."
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

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--muted)]">
          <Spinner /> Loading…
        </div>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Product</TH>
              <TH>Fitment</TH>
              <TH>Price</TH>
              <TH>Status</TH>
              <TH>Seller</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {products.length === 0 && (
              <TR>
                <TD colSpan={6} className="text-center text-[var(--muted)] py-8">
                  No products found.
                </TD>
              </TR>
            )}
            {products.map((p) => (
              <TR key={p._id} className="align-top">
                <TD>
                  <div className="flex gap-3">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt=""
                        className="w-12 h-12 rounded-[var(--radius)] object-cover border border-[var(--border)]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-[var(--radius)] bg-[var(--surface-3)]" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--ink)] line-clamp-1">
                        {p.name}
                        {p.featured && (
                          <Badge tone="warning" className="ml-2">
                            ★ Featured
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-[var(--muted)] line-clamp-2">
                        {p.description}
                      </p>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5 capitalize">
                        {p.condition}
                        {p.priceNegotiable ? " · Negotiable" : ""}
                      </p>
                    </div>
                  </div>
                </TD>
                <TD className="text-xs text-[var(--ink-secondary)]">
                  <p className="capitalize">{p.deviceCategory || "—"}</p>
                  <p>
                    {p.brand || "—"} {p.deviceModel || ""}
                  </p>
                  <p className="text-[var(--muted)] capitalize">
                    {p.partType || "—"}
                  </p>
                </TD>
                <TD className="font-semibold whitespace-nowrap">
                  ₹{Number(p.price).toLocaleString("en-IN")}
                </TD>
                <TD>
                  <Badge tone={STATUS_TONE[p.status] || "neutral"} className="capitalize">
                    {p.status}
                  </Badge>
                </TD>
                <TD className="text-xs text-[var(--ink-secondary)]">
                  <p className="font-medium">{p.technician?.name || "N/A"}</p>
                  <p className="text-[var(--muted)]">{p.technician?.email}</p>
                </TD>
                <TD>
                  <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                    {p.status !== "approved" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="success"
                        disabled={busyId === p._id}
                        onClick={() =>
                          patchProduct(p._id, { status: "approved" })
                        }
                        className="text-[11px] h-8 min-h-0 px-2"
                      >
                        Approve
                      </Button>
                    )}
                    {p.status !== "rejected" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="soft"
                        disabled={busyId === p._id}
                        onClick={() =>
                          patchProduct(p._id, { status: "rejected" })
                        }
                        className="text-[11px] h-8 min-h-0 px-2 bg-[var(--warning-soft)] text-[var(--warning)] hover:opacity-90"
                      >
                        Reject
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === p._id}
                      onClick={() =>
                        patchProduct(p._id, { featured: !p.featured })
                      }
                      className="text-[11px] h-8 min-h-0 px-2"
                    >
                      {p.featured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="soft"
                      onClick={() => openEdit(p)}
                      className="text-[11px] h-8 min-h-0 px-2"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={busyId === p._id}
                      onClick={() => deleteProduct(p._id, p.name)}
                      className="text-[11px] h-8 min-h-0 px-2"
                    >
                      Delete
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Modal
        open={!!editId}
        onClose={() => setEditId(null)}
        title="Edit product"
        sheet={false}
        className="sm:max-w-lg"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditId(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="admin-product-edit"
              loading={saving}
            >
              Save changes
            </Button>
          </>
        }
      >
        <form id="admin-product-edit" onSubmit={saveEdit} className="space-y-3">
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
            <Field key={key} label={label} htmlFor={`edit-${key}`} required>
              {key === "description" ? (
                <Textarea
                  id={`edit-${key}`}
                  value={editForm[key]}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  required
                />
              ) : (
                <Input
                  id={`edit-${key}`}
                  type={key === "price" ? "number" : "text"}
                  value={editForm[key]}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  required
                  size="sm"
                />
              )}
            </Field>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Condition" htmlFor="edit-condition">
              <Select
                id="edit-condition"
                value={editForm.condition}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, condition: e.target.value }))
                }
                size="sm"
              >
                <option value="new">New</option>
                <option value="used">Used</option>
              </Select>
            </Field>
            <Field label="Status" htmlFor="edit-status">
              <Select
                id="edit-status"
                value={editForm.status}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, status: e.target.value }))
                }
                size="sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
            <Checkbox
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
          <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
            <Checkbox
              checked={editForm.featured}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, featured: e.target.checked }))
              }
            />
            Featured on homepage
          </label>
        </form>
      </Modal>
    </AdminPage>
  );
}
