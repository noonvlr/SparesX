"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { LoadingState, ErrorState } from "@/components/feedback";
import { DashboardPage } from "@/components/layout";
import MarkSoldModal from "@/components/MarkSoldModal";
import { cn } from "@/lib/ui/cn";
import { formatListingTitle } from "@/lib/products/listingTitle";

export default function MyProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [soldTarget, setSoldTarget] = useState<any | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<{
    [key: string]: number;
  }>({});
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);

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
          }, 1500);
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
      <DashboardPage>
        <LoadingState label="Loading your products…" />
      </DashboardPage>
    );

  if (error)
    return (
      <DashboardPage>
        <ErrorState title="Could not load products" description={error} />
      </DashboardPage>
    );

  return (
    <DashboardPage
      containerSize="xl"
      title="My Products"
      description="Manage and track your listed spare parts"
      actions={
        <Link
          href="/technician/products/new"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          <span className="text-lg leading-none">+</span> Add Product
        </Link>
      }
    >
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
              <Link
                href="/technician/products/new"
                className={cn(buttonVariants())}
              >
                Create Product
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
                          const img = e.target as HTMLImageElement;
                          img.src = product.images[0];
                        }}
                      />
                      {product.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-[var(--ink)]/50 text-[var(--ink-inverse)] px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
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
                            : product.status === "sold"
                              ? "neutral"
                              : "warning"
                        }
                      >
                        {product.status === "approved"
                          ? "Live"
                          : product.status === "sold"
                            ? "Sold"
                            : "Pending"}
                      </Badge>
                    )}
                  </div>

                  <div className="mb-4 mt-auto">
                    <span className="text-2xl font-semibold text-[var(--ink)]">
                      ₹{product.price?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border)]">
                    {product.status !== "sold" ? (
                      <>
                        <Link
                          href={`/technician/products/edit/${product._id}`}
                          className={cn(
                            buttonVariants({ variant: "soft", size: "sm" }),
                            "flex-1",
                          )}
                        >
                          Edit
                        </Link>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSoldTarget(product)}
                        >
                          Sold
                        </Button>
                      </>
                    ) : null}
                    <Button
                      variant="danger"
                      size="sm"
                      className={cn(
                        "bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-[var(--ink-inverse)] shadow-none",
                        product.status === "sold" ? "flex-1" : "flex-1",
                      )}
                      onClick={() => handleDelete(product._id)}
                      disabled={deleting === product._id}
                      loading={deleting === product._id}
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

      {soldTarget ? (
        <MarkSoldModal
          open={!!soldTarget}
          onClose={() => setSoldTarget(null)}
          productId={soldTarget._id}
          productName={formatListingTitle(soldTarget)}
          onSold={(soldVia) => {
            setProducts((prev) =>
              prev.map((p) =>
                p._id === soldTarget._id
                  ? { ...p, status: "sold", soldVia }
                  : p,
              ),
            );
            setSoldTarget(null);
          }}
        />
      ) : null}
    </DashboardPage>
  );
}
