"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductFilters from "./ProductFilters";
import ProductCard from "@/components/ProductCard";

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 text-gray-900">
            Browse Products
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Discover quality mobile spare parts from verified technicians
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-80 lg:flex-shrink-0">
            <div className="lg:sticky lg:top-8">
              <Suspense fallback={null}>
                <ProductFilters />
              </Suspense>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                {loading
                  ? "Loading..."
                  : `${total} product${total !== 1 ? "s" : ""} found`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 animate-pulse"
                  >
                    <div className="w-full aspect-square bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow-md border border-gray-100">
                <p className="text-lg font-medium">No products match your filters</p>
                <p className="text-sm mt-2">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
                {products.map((product: any) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
