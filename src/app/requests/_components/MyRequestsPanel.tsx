"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input, Textarea } from "@/components/ui/Input";
import { Card, Badge, EmptyState } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/ui/cn";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";

type MatchItem = {
  productId: string;
  title: string;
  price: number;
  href: string;
  city?: string | null;
  seller: { name: string; trustScore?: number };
  reasons: string[];
};

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

const STATUS_TONE: Record<string, "warning" | "success" | "neutral"> = {
  open: "warning",
  fulfilled: "success",
  closed: "neutral",
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
  const [matchesById, setMatchesById] = useState<Record<string, MatchItem[]>>(
    {},
  );
  const [loadingMatches, setLoadingMatches] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isLoggedInClient()) {
      router.replace(
        `/login?next=${encodeURIComponent("/requests?tab=mine")}`,
      );
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ mine: "1", status, limit: "50" });
      const res = await authFetch(`/api/requests?${params}`);
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

  async function loadMatches(requestId: string) {
    setLoadingMatches(requestId);
    try {
      const res = await authFetch(`/api/requests/${requestId}/matches`);
      const data = await res.json();
      if (res.ok) {
        setMatchesById((prev) => ({
          ...prev,
          [requestId]: data.matches || [],
        }));
      }
    } catch {
      // ignore
    } finally {
      setLoadingMatches(null);
    }
  }

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
    setSaving(true);
    try {
      const res = await authFetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: {
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
    try {
      const res = await authFetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: {
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
    try {
      const res = await authFetch(`/api/requests/${id}`, {
        method: "DELETE",
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
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink)]">
            My requests
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Update status, edit details, or delete your spare-part requests.
          </p>
        </div>
        <Link
          href="/requests?tab=submit"
          scroll={false}
          className={cn(buttonVariants({ size: "sm" }))}
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
                ? "bg-[var(--brand)] text-[var(--primary-foreground)] border-[var(--brand)]"
                : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Spinner size="sm" className="text-[var(--brand)]" />
          Loading…
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-dashed rounded-[var(--radius-lg)]">
          <EmptyState
            title="You have no requests yet."
            action={
              <Link
                href="/requests?tab=submit"
                scroll={false}
                className={cn(buttonVariants({ variant: "link" }))}
              >
                Submit your first request
              </Link>
            }
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {requests.map((item) => (
            <li key={item._id}>
              <Card padding="sm" className="rounded-[var(--radius-lg)] p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-[var(--ink)]">
                      {item.category}
                      {item.brand ? ` · ${item.brand}` : ""}
                      {item.deviceModel ? ` · ${item.deviceModel}` : ""}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      Updated {new Date(item.updatedAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[item.status]} className="capitalize">
                    {item.status}
                  </Badge>
                </div>

                {editingId === item._id ? (
                  <div className="space-y-2 mt-3">
                    <Input
                      value={editDraft.category}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, category: e.target.value }))
                      }
                      size="sm"
                      placeholder="Category / part"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={editDraft.brand}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, brand: e.target.value }))
                        }
                        size="sm"
                        placeholder="Brand"
                      />
                      <Input
                        value={editDraft.deviceModel}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            deviceModel: e.target.value,
                          }))
                        }
                        size="sm"
                        placeholder="Model"
                      />
                    </div>
                    <Textarea
                      value={editDraft.description}
                      onChange={(e) =>
                        setEditDraft((d) => ({
                          ...d,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      className="min-h-[80px]"
                    />
                    <Input
                      value={editDraft.phone}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, phone: e.target.value }))
                      }
                      size="sm"
                      placeholder="Phone"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        loading={saving}
                        onClick={() => void saveEdit(item._id)}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-[var(--ink-secondary)] whitespace-pre-wrap">
                      {item.description}
                    </p>

                    {item.status === "open" ? (
                      <div className="mt-3 space-y-2">
                        {!matchesById[item._id] ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            loading={loadingMatches === item._id}
                            onClick={() => void loadMatches(item._id)}
                          >
                            Find matching listings
                          </Button>
                        ) : matchesById[item._id].length === 0 ? (
                          <p className="text-xs text-[var(--muted)]">
                            No matching live listings yet. Sellers may still
                            respond to your request.
                          </p>
                        ) : (
                          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3 space-y-2">
                            <p className="text-xs font-semibold text-[var(--ink)]">
                              Matching listings ({matchesById[item._id].length})
                            </p>
                            <ul className="space-y-2">
                              {matchesById[item._id].map((m) => (
                                <li key={m.productId}>
                                  <Link
                                    href={m.href}
                                    className="block text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-hover)]"
                                  >
                                    {m.title} — ₹
                                    {m.price.toLocaleString("en-IN")}
                                  </Link>
                                  <p className="text-[11px] text-[var(--muted)]">
                                    {m.seller.name}
                                    {m.city ? ` · ${m.city}` : ""}
                                    {m.reasons?.length
                                      ? ` · ${m.reasons.slice(0, 2).join(", ")}`
                                      : ""}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.status !== "fulfilled" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="success"
                          onClick={() =>
                            void setRequestStatus(item._id, "fulfilled")
                          }
                        >
                          Mark fulfilled
                        </Button>
                      )}
                      {item.status !== "open" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => void setRequestStatus(item._id, "open")}
                        >
                          Reopen
                        </Button>
                      )}
                      {item.status !== "closed" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            void setRequestStatus(item._id, "closed")
                          }
                        >
                          Close
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="soft"
                        onClick={() => startEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => void removeRequest(item._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
