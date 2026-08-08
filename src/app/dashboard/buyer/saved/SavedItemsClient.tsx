"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { showToast } from "@/components/ToastHost";
import { Card, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { buttonVariants } from "@/components/ui/button-variants";
import { LoadingState } from "@/components/feedback";
import { cn } from "@/lib/ui/cn";

type SavedRow = {
  _id: string;
  productId: string;
  savedAt: string;
  available: boolean;
  product: (ProductCardData & { status?: string }) | null;
};

type SavedSearchRow = {
  _id: string;
  name: string;
  queryString: string;
  href: string;
  createdAt: string;
};

type Tab = "items" | "searches";

export default function SavedItemsClient() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("items");
  const [items, setItems] = useState<SavedRow[]>([]);
  const [searches, setSearches] = useState<SavedSearchRow[]>([]);
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
      const [itemsRes, searchesRes] = await Promise.all([
        fetch("/api/saved", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/saved-searches", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (itemsRes.status === 401 || searchesRes.status === 401) {
        localStorage.removeItem("token");
        router.replace(
          `/login?next=${encodeURIComponent("/dashboard/buyer/saved")}`,
        );
        return;
      }

      const itemsData = await itemsRes.json();
      const searchesData = await searchesRes.json();

      if (!itemsRes.ok) {
        showToast(itemsData.message || "Failed to load saved items", "error");
        setItems([]);
      } else {
        setItems(itemsData.items || []);
      }

      if (!searchesRes.ok) {
        showToast(
          searchesData.message || "Failed to load saved searches",
          "error",
        );
        setSearches([]);
      } else {
        setSearches(searchesData.searches || []);
      }
    } catch {
      showToast("Failed to load saved data", "error");
      setItems([]);
      setSearches([]);
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

  const removeSearch = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setRemovingId(id);
    try {
      const res = await fetch(`/api/saved-searches/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || "Could not remove search", "error");
        return;
      }
      setSearches((prev) => prev.filter((row) => row._id !== id));
      showToast("Saved search removed");
    } catch {
      showToast("Could not remove search", "error");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return <LoadingState label="Loading saved…" />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
        <Button
          type="button"
          size="sm"
          variant={tab === "items" ? "primary" : "ghost"}
          onClick={() => setTab("items")}
        >
          Saved items ({items.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "searches" ? "primary" : "ghost"}
          onClick={() => setTab("searches")}
        >
          Saved searches ({searches.length})
        </Button>
      </div>

      {tab === "items" ? (
        !items.length ? (
          <Card>
            <EmptyState
              title="No saved parts yet"
              description="Browse the catalog and tap Save for later."
              action={
                <Link href="/products" className={cn(buttonVariants())}>
                  Browse products
                </Link>
              }
            />
          </Card>
        ) : (
          <>
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
                      <IconButton
                        type="button"
                        aria-label="Remove unavailable item"
                        disabled={removingId === row.productId}
                        size="sm"
                        variant="outline"
                        onClick={() => removeSaved(row.productId)}
                        className="absolute top-2 left-2 z-20 rounded-full bg-[var(--surface)]/95 text-[var(--muted)] shadow-[var(--shadow-sm)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
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
                      </IconButton>
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
          </>
        )
      ) : !searches.length ? (
        <Card>
          <EmptyState
            title="No saved searches yet"
            description="On /products, set filters and tap Save this search. We'll notify you when matching listings appear."
            action={
              <Link href="/products" className={cn(buttonVariants())}>
                Browse products
              </Link>
            }
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {searches.map((row) => (
            <li key={row._id}>
              <Card padding="md" className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--ink)] truncate">
                    {row.name}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Saved{" "}
                    {new Date(row.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={row.href}
                    className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                  >
                    Open
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    loading={removingId === row._id}
                    onClick={() => void removeSearch(row._id)}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
