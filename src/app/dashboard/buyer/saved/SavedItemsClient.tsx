"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { showToast } from "@/components/ToastHost";
import { Card, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type SavedRow = {
  _id: string;
  productId: string;
  savedAt: string;
  available: boolean;
  product: (ProductCardData & { status?: string }) | null;
};

export default function SavedItemsClient() {
  const router = useRouter();
  const [items, setItems] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace(
        `/login?next=${encodeURIComponent("/dashboard/buyer/saved")}`,
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/saved", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        router.replace(
          `/login?next=${encodeURIComponent("/dashboard/buyer/saved")}`,
        );
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Failed to load saved items", "error");
        setItems([]);
        return;
      }
      setItems(data.items || []);
    } catch {
      showToast("Failed to load saved items", "error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const removeSaved = async (productId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setRemovingId(productId);
    try {
      const res = await fetch(`/api/saved/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || "Could not remove item", "error");
        return;
      }
      setItems((prev) =>
        prev.filter((row) => String(row.productId) !== productId),
      );
      showToast("Removed from saved");
      window.dispatchEvent(new Event("sparesx-saved-changed"));
    } catch {
      showToast("Could not remove item", "error");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-10 text-center text-[var(--muted)]">
        Loading saved items…
      </Card>
    );
  }

  if (!items.length) {
    return (
      <Card>
        <EmptyState
          title="No saved parts yet"
          description="Browse the catalog and tap Save for later."
          action={
            <Link href="/products">
              <Button>Browse products</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          {items.length} saved {items.length === 1 ? "item" : "items"}
        </p>
        <Link
          href="/products"
          className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
        >
          Browse more
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {items.map((row) => {
          if (!row.product) {
            return (
              <div
                key={row._id}
                className="relative bg-[var(--surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] border border-dashed border-[var(--border-strong)] overflow-hidden scale-[0.92] sm:scale-[0.95] origin-top aspect-square flex flex-col items-center justify-center p-4 text-center"
              >
                <button
                  type="button"
                  aria-label="Remove unavailable item"
                  disabled={removingId === row.productId}
                  onClick={() => removeSaved(row.productId)}
                  className="absolute top-2 left-2 z-20 inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
                <p className="text-xs sm:text-sm text-[var(--muted)] px-2">
                  Listing no longer available
                </p>
              </div>
            );
          }

          return (
            <div key={row._id} className="relative">
              {!row.available && (
                <div className="absolute inset-x-3 top-10 sm:top-11 z-10 rounded-[var(--radius)] bg-[var(--warning-soft)]/95 border border-[var(--warning)]/30 px-2 py-1 text-[10px] font-semibold text-[var(--warning)] text-center pointer-events-none">
                  Unavailable
                </div>
              )}
              <ProductCard
                product={row.product}
                onRemove={() => removeSaved(row.productId)}
                removing={removingId === row.productId}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
