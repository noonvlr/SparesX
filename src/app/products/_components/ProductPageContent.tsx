"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductFilters, { ProductSearchBar } from "./ProductFilters";
import ProductCard from "@/components/ProductCard";
import AdSlot from "@/components/AdSlot";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/Card";

export default function ProductPageContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        const res = await fetch(`/api/products?${params.toString()}`);

        if (!res.ok) {
          setProducts([]);
          setTotal(0);
          return;
        }

        const data = await res.json();
        setProducts(data.products || []);
        setTotal(data.total || 0);
      } catch {
        setProducts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const productNames = useMemo(
    () =>
      Array.from(
        new Set(
          products.map((p) => p?.name).filter((name): name is string => Boolean(name)),
        ),
      ),
    [products],
  );

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Browse products"
          description="Discover quality mobile spare parts from verified technicians"
        />

        <div className="mb-6">
          <ProductSearchBar productNames={productNames} />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="lg:w-72 lg:flex-shrink-0">
            <div className="lg:sticky lg:top-4">
              <ProductFilters />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-[var(--muted)]">
                {loading
                  ? "Loading…"
                  : `${total} product${total !== 1 ? "s" : ""} found`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
                  >
                    <Skeleton className="aspect-square w-full rounded-none" />
                    <div className="p-2.5 sm:p-3 space-y-2">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-5 w-1/2 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
                title="No products match your filters"
                description="Try adjusting your search criteria or clearing some filters."
              />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-5">
                {products.map((product: any) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            <AdSlot id="products-grid-bottom" size="leaderboard" className="mt-6" />
          </div>
        </div>
      </div>
    </main>
  );
}
