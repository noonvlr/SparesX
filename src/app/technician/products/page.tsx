"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    fetch("/api/technician/products", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load products");
        setLoading(false);
      });
  }, []);

  async function handleDelete(productId: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setDeleting(productId);
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`/api/technician/products/delete/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setProducts(products.filter((p) => p._id !== productId));
    } else {
      alert("Failed to delete product");
    }
    setDeleting(null);
  }

  if (loading)
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600 py-16">
            <div className="inline-block animate-spin">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <p className="mt-4">Loading your products...</p>
          </div>
        </div>
      </main>
    );

  if (error)
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 text-gray-900">
              My Products
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              Manage and track your listed spare parts
            </p>
          </div>
          <Link
            href="/technician/products/new"
            className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg whitespace-nowrap"
          >
            <span className="text-lg mr-2">+</span>
            Add Product
          </Link>
        </div>

        {/* Stats Section */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 px-4 py-2">
            <p className="text-blue-700 text-xs font-medium">Total</p>
            <p className="text-lg font-bold text-blue-900 leading-none">
              {products.length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 px-4 py-2">
            <p className="text-green-700 text-xs font-medium">Active</p>
            <p className="text-lg font-bold text-green-900 leading-none">
              {products.filter((p) => p.status === "approved").length}
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md border border-gray-100">
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
            <p className="text-lg font-medium text-gray-900">No products yet</p>
            <p className="text-gray-600 mt-2 mb-6">
              Create your first listing to get started
            </p>
            <Link
              href="/technician/products/new"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Create Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="group bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300"
              >
                {/* Product Image */}
                <div className="relative w-full aspect-square bg-gray-50 overflow-hidden flex items-center justify-center border-b border-gray-200">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
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

                {/* Product Info */}
                <div className="p-4 sm:p-5">
                  <h2 className="font-semibold text-base sm:text-lg mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 text-gray-900">
                    {product.name}
                  </h2>

                  {/* Badges */}
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
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.condition === "new"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {product.condition === "new" ? "New" : "Used"}
                      </span>
                    )}
                    {product.status && (
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.status === "approved"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                        }`}
                      >
                        {product.status === "approved"
                          ? "✓ Live"
                          : "⏳ Pending"}
                      </span>
                    )}
                  </div>

                  {/* Price and Status */}
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{product.price?.toLocaleString()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <Link
                      href={`/technician/products/edit/${product._id}`}
                      className="flex-1 text-center bg-blue-50 text-blue-600 hover:bg-blue-100 py-2.5 rounded-lg transition-colors duration-200 font-medium text-sm hover:shadow-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      disabled={deleting === product._id}
                      className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2.5 rounded-lg transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
                    >
                      {deleting === product._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
