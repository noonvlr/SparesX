"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProductFilters from "./_components/ProductFilters";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setLoading(false);
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
          {/* Sidebar - Hidden on mobile, visible on desktop */}
          <aside className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="sticky top-8">
              <ProductFilters />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                {loading
                  ? "Loading..."
                  : `${total} product${total !== 1 ? "s" : ""} found`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 animate-pulse"
                  >
                    <div className="w-full aspect-square bg-gray-200"></div>
                    <div className="p-5">
                      <div className="h-5 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow-md border border-gray-100">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-lg font-medium">
                  No products match your filters
                </p>
                <p className="text-sm mt-2">
                  Try adjusting your search criteria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {products.map((product: any) => (
                  <div
                    key={product._id}
                    className="group bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 card-hover"
                  >
                    <Link href={`/product/${product._id}`} className="block">
                      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden flex items-center justify-center border-b border-gray-200">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-contain card-image-zoom"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <svg
                              className="w-12 h-12 text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-4 sm:p-5">
                        <h2 className="font-semibold text-base sm:text-lg mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 text-gray-900">
                          {product.name}
                        </h2>
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {product.brand && (
                            <span className="inline-block bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                              {product.brand}
                            </span>
                          )}
                          {product.partType && (
                            <span className="inline-block bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium">
                              {product.partType}
                            </span>
                          )}
                          {product.condition && (
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${product.condition === "new" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                            >
                              {product.condition}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-blue-600">
                            ₹{product.price?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
