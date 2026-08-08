"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, Badge, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { LoadingState, ErrorState } from "@/components/feedback";
import { DashboardPage } from "@/components/layout";
import MarkSoldModal from "@/components/MarkSoldModal";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";
import { cn } from "@/lib/ui/cn";
import { formatListingTitle } from "@/lib/products/listingTitle";
import BulkInventoryPanel from "./_components/BulkInventoryPanel";

type ProductTab = "active" | "pending" | "rejected" | "sold";

export default function MyProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [relisting, setRelisting] = useState<string | null>(null);
  const [soldTarget, setSoldTarget] = useState<any | null>(null);
  const [tab, setTab] = useState<ProductTab>("active");
  const [currentImageIndex, setCurrentImageIndex] = useState<{
    [key: string]: number;
  }>({});
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedInClient()) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    authFetch("/api/technician/products")
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

  const counts = useMemo(() => {
    const total = products.length;
    const sold = products.filter((p) => p.status === "sold").length;
    const active = products.filter((p) => p.status === "approved").length;
    const pending = products.filter((p) => p.status === "pending").length;
    const rejected = products.filter((p) => p.status === "rejected").length;
    return { total, active, sold, pending, rejected };
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (tab === "sold") {
      return products.filter((p) => p.status === "sold");
    }
    if (tab === "pending") {
      return products.filter((p) => p.status === "pending");
    }
    if (tab === "rejected") {
      return products.filter((p) => p.status === "rejected");
    }
    return products.filter((p) => p.status === "approved");
  }, [products, tab]);

  // Auto-rotate images for products with multiple images (Desktop only or on hover)
  useEffect(() => {
    const intervals: { [key: string]: NodeJS.Timeout } = {};

    visibleProducts.forEach((product) => {
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
  }, [visibleProducts, hoveredProductId]);

  async function handleDelete(productId: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setDeleting(productId);
    const res = await authFetch(`/api/technician/products/delete/${productId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setProducts(products.filter((p) => p._id !== productId));
    } else {
      alert("Failed to delete product");
    }
    setDeleting(null);
  }

  async function handleRelist(productId: string) {
    setRelisting(productId);
    try {
      const res = await authFetch(`/api/technician/products/relist/${productId}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Failed to relist product");
        return;
      }
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? { ...p, status: "approved", soldVia: null, soldAt: null }
            : p,
        ),
      );
      setTab("active");
    } catch {
      alert("Failed to relist product");
    } finally {
      setRelisting(null);
    }
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
        <div className="flex flex-wrap items-center gap-2">
          <BulkInventoryPanel
            onImported={() => {
              authFetch("/api/technician/products")
                .then((res) => res.json())
                .then((data) => setProducts(data.products || []))
                .catch(() => undefined);
            }}
          />
          <Link
            href="/technician/products/new"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            <span className="text-lg leading-none">+</span> Add Product
          </Link>
        </div>
      }
    >
      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 sm:px-4 sm:py-3">
          <p className="text-[var(--muted)] text-[11px] sm:text-xs font-medium">
            Total
          </p>
          <p className="text-lg sm:text-xl font-semibold text-[var(--ink)] leading-none tabular-nums">
            {counts.total}
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--success-soft)] px-3 py-2.5 sm:px-4 sm:py-3">
          <p className="text-[var(--success)] text-[11px] sm:text-xs font-medium">
            Live
          </p>
          <p className="text-lg sm:text-xl font-semibold text-[var(--ink)] leading-none tabular-nums">
            {counts.active}
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--warning-soft)] px-3 py-2.5 sm:px-4 sm:py-3">
          <p className="text-[var(--warning)] text-[11px] sm:text-xs font-medium">
            In review
          </p>
          <p className="text-lg sm:text-xl font-semibold text-[var(--ink)] leading-none tabular-nums">
            {counts.pending}
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 sm:px-4 sm:py-3">
          <p className="text-[var(--muted)] text-[11px] sm:text-xs font-medium">
            Sold
          </p>
          <p className="text-lg sm:text-xl font-semibold text-[var(--ink)] leading-none tabular-nums">
            {counts.sold}
          </p>
        </div>
      </div>

      {/* Status tabs */}
      <div
        role="tablist"
        aria-label="Product status"
        className="mb-5 flex flex-wrap gap-1 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-1"
      >
        {(
          [
            { id: "active" as const, label: "Live", count: counts.active },
            { id: "pending" as const, label: "Pending", count: counts.pending },
            {
              id: "rejected" as const,
              label: "Rejected",
              count: counts.rejected,
            },
            { id: "sold" as const, label: "Sold", count: counts.sold },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "min-w-[4.5rem] flex-1 rounded-[var(--radius)] px-3 py-2.5 text-sm font-semibold transition-colors",
              tab === item.id
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)]"
                : "text-[var(--muted)] hover:text-[var(--ink)]",
            )}
          >
            {item.label}
            <span
              className={cn(
                "ml-1.5 tabular-nums",
                tab === item.id ? "text-[var(--brand)]" : "text-[var(--muted)]",
              )}
            >
              ({item.count})
            </span>
          </button>
        ))}
      </div>

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
      ) : visibleProducts.length === 0 ? (
        <Card>
          <EmptyState
            title={
              tab === "sold"
                ? "No sold products"
                : tab === "pending"
                  ? "Nothing in review"
                  : tab === "rejected"
                    ? "No rejected listings"
                    : "No live listings"
            }
            description={
              tab === "sold"
                ? "When you mark a listing sold, it will show up here so you can relist it later."
                : tab === "pending"
                  ? "New listings appear here until a moderator approves them."
                  : tab === "rejected"
                    ? "Rejected listings would show here so you can edit and resubmit."
                    : "Approve pending listings or add a new product to go live."
            }
            action={
              tab === "sold" ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setTab("active")}
                >
                  View live
                </Button>
              ) : tab === "pending" || tab === "rejected" ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setTab("active")}
                >
                  View live
                </Button>
              ) : (
                <Link
                  href="/technician/products/new"
                  className={cn(buttonVariants())}
                >
                  Add Product
                </Link>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
          {visibleProducts.map((product) => (
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
                          product.condition === "new"
                            ? "success"
                            : product.condition === "refurbished"
                              ? "brand"
                              : "warning"
                        }
                      >
                        {product.condition === "new"
                          ? "New"
                          : product.condition === "refurbished"
                            ? "Refurbished"
                            : "Used"}
                      </Badge>
                    )}
                    {product.status && (
                      <Badge
                        tone={
                          product.status === "approved"
                            ? "success"
                            : product.status === "sold"
                              ? "neutral"
                              : product.status === "rejected"
                                ? "danger"
                                : "warning"
                        }
                      >
                        {product.status === "approved"
                          ? "Live"
                          : product.status === "sold"
                            ? "Sold"
                            : product.status === "rejected"
                              ? "Rejected"
                              : "Pending review"}
                      </Badge>
                    )}
                    {product.status === "pending" ? (
                      <p className="basis-full text-xs text-[var(--muted)]">
                        Waiting for moderator approval before it appears in
                        search.
                      </p>
                    ) : null}
                    {product.status === "rejected" ? (
                      <p className="basis-full text-xs text-[var(--danger)]">
                        This listing was rejected. Edit details and resubmit, or
                        delete it.
                      </p>
                    ) : null}
                    {product.status === "sold" && product.soldVia ? (
                      <Badge tone="neutral">
                        {product.soldVia === "sparesx"
                          ? "Via SparesX"
                          : "Elsewhere"}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mb-4 mt-auto">
                    <span className="text-2xl font-semibold text-[var(--ink)]">
                      ₹{product.price?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border)]">
                    {product.status === "sold" ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1"
                          onClick={() => void handleRelist(product._id)}
                          disabled={relisting === product._id}
                          loading={relisting === product._id}
                        >
                          Relist
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="flex-1 bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-[var(--ink-inverse)] shadow-none"
                          onClick={() => handleDelete(product._id)}
                          disabled={deleting === product._id}
                          loading={deleting === product._id}
                        >
                          Delete
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/technician/products/edit/${product._id}`}
                          className={cn(
                            buttonVariants({ variant: "soft", size: "sm" }),
                            "flex-1",
                          )}
                        >
                          {product.status === "rejected" ? "Edit & resubmit" : "Edit"}
                        </Link>
                        {product.status === "approved" ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => setSoldTarget(product)}
                          >
                            Sold
                          </Button>
                        ) : null}
                        <Button
                          variant="danger"
                          size="sm"
                          className="flex-1 bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-[var(--ink-inverse)] shadow-none"
                          onClick={() => handleDelete(product._id)}
                          disabled={deleting === product._id}
                          loading={deleting === product._id}
                        >
                          Delete
                        </Button>
                      </>
                    )}
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
            setTab("sold");
          }}
        />
      ) : null}
    </DashboardPage>
  );
}
