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
      <div className="max-w-4xl mx-auto py-8 px-4 text-center text-gray-600">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-red-600 text-center">
        {error}
      </div>
    );

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Products</h1>
      <Link
        href="/technician/products/new"
        className="mb-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
      >
        + Add Product
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {products.length === 0 && (
          <div className="text-gray-500 col-span-full text-center py-12">
            No products found.{" "}
            <Link
              href="/technician/products/new"
              className="text-blue-600 hover:underline"
            >
              Create one
            </Link>
          </div>
        )}
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-100 hover:border-blue-200"
          >
            <div className="relative w-full aspect-square bg-gray-50 overflow-hidden flex items-center justify-center border-b border-gray-200">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
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
            <div className="p-4">
              <div className="font-semibold text-lg mb-2 text-gray-800">
                {product.name}
              </div>
              <div className="text-gray-600 text-sm mb-1">
                {product.category} • {product.condition}
              </div>
              <div className="text-blue-700 font-bold mb-3 text-lg">
                ₹{product.price}
              </div>
              <div className="text-xs text-gray-500 mb-4 bg-gray-50 px-2 py-1 rounded inline-block">
                Status:{" "}
                <span className="text-green-600 font-semibold">
                  {product.status}
                </span>
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Link
                  href={`/technician/products/edit/${product._id}`}
                  className="flex-1 text-center bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded transition-colors duration-200 font-medium text-sm"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(product._id)}
                  disabled={deleting === product._id}
                  className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting === product._id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
