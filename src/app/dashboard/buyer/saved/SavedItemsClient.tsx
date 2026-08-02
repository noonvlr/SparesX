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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-600">
        <p className="mb-4">No saved parts yet. Browse the catalog and save items for later.</p>
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
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        {items.length} saved {items.length === 1 ? "item" : "items"}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {items.map((row) => {
          if (!row.product) {
            return (
              <div
                key={row._id}
                className="bg-white rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 flex flex-col gap-3"
              >
                <p>Listing no longer available</p>
                <button
                  type="button"
                  disabled={removingId === row.productId}
                  onClick={() => removeSaved(row.productId)}
                  className="py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            );
          }

          const productId = row.productId;
          return (
            <div key={row._id} className="relative group">
              {!row.available && (
                <div className="absolute inset-x-2 top-2 z-10 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] font-semibold text-amber-800 text-center">
                  Unavailable
                </div>
              )}
              <ProductCard product={row.product} />
              <button
                type="button"
                disabled={removingId === productId}
                onClick={() => removeSaved(productId)}
                className="mt-2 w-full py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition disabled:opacity-50"
              >
                {removingId === productId ? "Removing…" : "Remove"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
