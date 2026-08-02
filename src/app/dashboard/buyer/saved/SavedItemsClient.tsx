"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { showToast } from "@/components/ToastHost";

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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
        Loading saved items…
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center text-gray-600">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>
        <p className="mb-5 text-sm sm:text-base">
          No saved parts yet. Browse the catalog and tap Save for later.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {items.length} saved {items.length === 1 ? "item" : "items"}
        </p>
        <Link
          href="/products"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
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
                className="relative bg-white rounded-lg shadow-md border border-dashed border-gray-200 overflow-hidden scale-[0.92] sm:scale-[0.95] origin-top aspect-square flex flex-col items-center justify-center p-4 text-center"
              >
                <button
                  type="button"
                  aria-label="Remove unavailable item"
                  disabled={removingId === row.productId}
                  onClick={() => removeSaved(row.productId)}
                  className="absolute top-2 left-2 z-20 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-red-50 hover:text-red-600"
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
                <p className="text-xs sm:text-sm text-gray-500 px-2">
                  Listing no longer available
                </p>
              </div>
            );
          }

          return (
            <div key={row._id} className="relative">
              {!row.available && (
                <div className="absolute inset-x-3 top-10 sm:top-11 z-10 rounded-lg bg-amber-50/95 border border-amber-200 px-2 py-1 text-[10px] font-semibold text-amber-800 text-center pointer-events-none">
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
