"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function MyProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<{
    [key: string]: number;
  }>({});
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
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

  // Auto-rotate images for products with multiple images (Desktop only or on hover)
  useEffect(() => {
    const intervals: { [key: string]: NodeJS.Timeout } = {};

    products.forEach((product) => {
      if (product.images && product.images.length > 1) {
        // Only auto-rotate on desktop (lg screens) or when product is hovered
        const isDesktop =
          typeof window !== "undefined" && window.innerWidth >= 1024;
        const shouldAutoRotate = isDesktop || hoveredProductId === product._id;

        if (shouldAutoRotate) {
          intervals[product._id] = setInterval(() => {
            setCurrentImageIndex((prev) => ({
              ...prev,
              [product._id]:
                ((prev[product._id] || 0) + 1) % product.images.length,
            }));
          }, 1500); // Change image every 1.5 seconds
        }
      }
    });

    return () => {
      Object.values(intervals).forEach((interval) => clearInterval(interval));
    };
  }, [products, hoveredProductId]);

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
      <main className="min-h-screen bg-[var(--surface-2)]">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-[var(--muted)] py-16">
            <div className="inline-block animate-spin">
              <svg
                className="w-8 h-8 text-[var(--brand)]"
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
      <main className="min-h-screen bg-[var(--surface-2)]">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-[var(--radius-lg)] p-6 text-center">
            <p className="text-[var(--danger)] font-medium">{error}</p>
          </div>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="My Products"
          description="Manage and track your listed spare parts"
          actions={
            <Link href="/technician/products/new">
              <Button size="lg">
                <span className="text-lg leading-none">+</span> Add Product
              </Button>
            </Link>
          }
        />

        {/* Stats Section */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="bg-[var(--brand-soft)] rounded-[var(--radius)] border border-[var(--border)] px-4 py-2">
            <p className="text-[var(--brand-hover)] text-xs font-medium">
              Total
            </p>
            <p className="text-lg font-semibold text-[var(--ink)] leading-none">
              {products.length}
            </p>
          </div>
          <div className="bg-[var(--success-soft)] rounded-[var(--radius)] border border-[var(--border)] px-4 py-2">
            <p className="text-[var(--success)] text-xs font-medium">
              Active
            </p>
            <p className="text-lg font-semibold text-[var(--ink)] leading-none">
              {products.filter((p) => p.status === "approved").length}
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card>
            <EmptyState
              title="No products yet"
              description="Create your first listing to get started"
              action={
                <Link href="/technician/products/new">
                  <Button>Create Product</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
            {products.map((product) => (
              <Card
                key={product._id}
                hover
                className="group overflow-hidden flex flex-col h-full"
              >
                <div
                  onMouseEnter={() => setHoveredProductId(product._id)}
                  onMouseLeave={() => setHoveredProductId(null)}
                  className="flex flex-col h-full"
                >
                  {/* Product Image with Carousel */}
                  <div className="relative w-full h-36 sm:h-44 lg:h-48 bg-[var(--surface-3)] overflow-hidden flex items-center justify-center border-b border-[var(--border)]">
                    {product.images && product.images.length > 0 ? (
                      <>
                        <img
                          src={
                            product.images[currentImageIndex[product._id] || 0]
                          }
                          alt={product.name}
                          className="w-full h-full object-contain card-image-zoom"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback to first image if loading fails
                            const img = e.target as HTMLImageElement;
                            img.src = product.images[0];
                          }}
                        />
                        {/* Image Counter Badge */}
                        {product.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                            {(currentImageIndex[product._id] || 0) + 1}/
                            {product.images.length}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--surface-3)]">
                        <svg
                          className="w-12 h-12 text-[var(--border-strong)]"
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
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <h2 className="font-semibold text-base sm:text-lg mb-3 line-clamp-2 text-[var(--ink)] transition-colors group-hover:text-[var(--brand)]">
                      {product.name}
                    </h2>

                    {/* Badges */}
                    <div className="flex gap-1.5 mb-3 flex-wrap">
                      {product.brand && (
                        <Badge tone="brand">{product.brand}</Badge>
                      )}
                      {product.partType && (
                        <Badge tone="neutral">{product.partType}</Badge>
                      )}
                      {product.condition && (
                        <Badge
                          tone={
                            product.condition === "new" ? "success" : "warning"
                          }
                        >
                          {product.condition === "new" ? "New" : "Used"}
                        </Badge>
                      )}
                      {product.status && (
                        <Badge
                          tone={
                            product.status === "approved"
                              ? "success"
                              : "warning"
                          }
                        >
                          {product.status === "approved"
                            ? "✓ Live"
                            : "⏳ Pending"}
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-4 mt-auto">
                      <span className="text-2xl font-semibold text-[var(--ink)]">
                        ₹{product.price?.toLocaleString()}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
                      <Link
                        href={`/technician/products/edit/${product._id}`}
                        className="flex-1"
                      >
                        <Button variant="soft" className="w-full" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1 bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-red-100 shadow-none"
                        onClick={() => handleDelete(product._id)}
                        disabled={deleting === product._id}
                      >
                        {deleting === product._id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
