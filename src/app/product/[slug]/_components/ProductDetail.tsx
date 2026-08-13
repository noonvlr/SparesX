"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { openChatUi } from "@/components/chat/openChat";
import TrustBadges from "@/components/TrustBadges";
import { showToast } from "@/components/ToastHost";
import StarRatingDisplay from "@/components/StarRatingDisplay";
import RateSellerModal from "@/components/RateSellerModal";
import MarkSoldModal from "@/components/MarkSoldModal";
import { AuthPromptSheet } from "@/components/ContactSheet";
import { ShareListingButton } from "@/components/ShareListing";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import UploadedImage from "@/components/ui/UploadedImage";
import { cn } from "@/lib/ui/cn";
import { resolveUploadUrl } from "@/lib/ui/imageUrl";
import {
  formatListingAlt,
  formatPartTypeLabel,
} from "@/lib/products/listingTitle";
import {
  formatConditionLabel,
  formatDeviceLabel,
  formatProductHeading,
} from "@/lib/seo/productMeta";
import { partsPath } from "@/lib/seo/site";
import { authFetch, getCachedUserId, isLoggedInClient, resolveSessionUserId } from "@/lib/auth/clientAuth";

interface Seller {
  _id?: string;
  name?: string;
  city?: string;
  state?: string;
  whatsappNumber?: string;
  countryCode?: string;
  mobile?: string;
  profilePicture?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  kycVerified?: boolean;
  businessVerified?: boolean;
  addressVerified?: boolean;
  isTrusted?: boolean;
  trustScore?: number;
  trustLabel?: string;
  averageRating?: number;
  ratingCount?: number;
  responseRate?: number;
  responseSampleSize?: number;
  badges?: import("@/lib/badges/catalog").PublicBadge[];
  activeBadgeKeys?: string[];
}

interface Product {
  _id: string;
  name: string;
  category?: string;
  deviceCategory?: string;
  brand?: string;
  deviceModel?: string;
  modelNumber?: string;
  partType?: string;
  price: number;
  description: string;
  condition: string;
  priceNegotiable?: boolean;
  images: string[];
  createdAt: string;
  status?: string;
  soldVia?: string | null;
  soldAt?: string | null;
  technician?: Seller | string;
}

interface SimilarProduct {
  _id: string;
  slug?: string;
  name: string;
  price: number;
  images?: string[];
  brand?: string;
  partType?: string;
  deviceModel?: string;
  category?: string;
  deviceCategory?: string;
  condition?: string;
}

type Breadcrumb = { name: string; href: string };

type WaConnectStatus = {
  status: string;
  unlocked: boolean;
  canRequest: boolean;
  reason?: string;
  whatsappUrl?: string | null;
  maskedNumber?: string | null;
};

export default function ProductDetail({
  product: initialProduct,
  similarProducts: initialSimilar = [],
  breadcrumbs = [],
}: {
  product: Product;
  similarProducts?: SimilarProduct[];
  breadcrumbs?: Breadcrumb[];
}) {
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);
  const [similarProducts, setSimilarProducts] = useState(initialSimilar);
  const [selectedImage, setSelectedImage] = useState(
    resolveUploadUrl(initialProduct.images?.[0] || ""),
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState<"contact" | "save">(
    "contact",
  );
  const [showRateModal, setShowRateModal] = useState(false);
  const [waConnect, setWaConnect] = useState<WaConnectStatus | null>(null);
  const [waLoading, setWaLoading] = useState(false);
  const [waActionLoading, setWaActionLoading] = useState(false);
  const [soldOpen, setSoldOpen] = useState(false);
  const [sellerRating, setSellerRating] = useState({
    averageRating: initialProduct.technician &&
    typeof initialProduct.technician === "object"
      ? Number(initialProduct.technician.averageRating || 0)
      : 0,
    ratingCount:
      initialProduct.technician && typeof initialProduct.technician === "object"
        ? Number(initialProduct.technician.ratingCount || 0)
        : 0,
  });

  useEffect(() => {
    let cancelled = false;
    const loggedInHint = isLoggedInClient();
    setIsLoggedIn(loggedInHint);

    void (async () => {
      const userId = loggedInHint
        ? getCachedUserId() || (await resolveSessionUserId())
        : null;
      if (cancelled) return;
      setIsLoggedIn(Boolean(userId) || loggedInHint);

      try {
        const res = await authFetch(`/api/products/${initialProduct._id}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.product) {
          setProduct(data.product);
          if (data.product.images?.[0]) {
            setSelectedImage(resolveUploadUrl(data.product.images[0]));
          }
          const tech = data.product.technician;
          if (tech && typeof tech === "object") {
            setSellerRating({
              averageRating: Number(tech.averageRating || 0),
              ratingCount: Number(tech.ratingCount || 0),
            });
          }
        }
        if (data.similarProducts) setSimilarProducts(data.similarProducts);

        const technicianId =
          typeof data.product?.technician === "object"
            ? data.product.technician?._id
            : data.product?.technician;
        setIsOwner(!!userId && String(technicianId) === String(userId));
      } catch {
        if (cancelled) return;
        const technicianId =
          typeof initialProduct.technician === "object"
            ? initialProduct.technician?._id
            : initialProduct.technician;
        setIsOwner(!!userId && String(technicianId) === String(userId));
      }

      if (userId || loggedInHint) {
        try {
          const res = await authFetch(`/api/saved/${initialProduct._id}`);
          const data = res.ok ? await res.json() : null;
          if (!cancelled && data) setIsSaved(!!data.saved);
        } catch {
          // ignore
        }
      } else if (!cancelled) {
        setIsSaved(false);
        setWaConnect(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialProduct._id]);

  const seller: Seller | null = useMemo(() => {
    if (!product.technician || typeof product.technician !== "object") {
      return null;
    }
    return product.technician;
  }, [product.technician]);

  const loadWaConnect = async (sellerId: string, productId: string) => {
    if (!isLoggedInClient()) {
      setWaConnect(null);
      return;
    }
    setWaLoading(true);
    try {
      const res = await authFetch(
        `/api/whatsapp-connect?sellerId=${encodeURIComponent(sellerId)}&productId=${encodeURIComponent(productId)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setWaConnect({
          status: data.status || "none",
          unlocked: !!data.unlocked,
          canRequest: !!data.canRequest,
          reason: data.reason,
          whatsappUrl: data.whatsappUrl || null,
          maskedNumber: data.maskedNumber || null,
        });
      }
    } catch {
      // ignore
    } finally {
      setWaLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || isOwner || !seller?._id) {
      setWaConnect(null);
      return;
    }
    void loadWaConnect(String(seller._id), product._id);
  }, [isLoggedIn, isOwner, seller?._id, product._id]);

  const requireAuth = (reason: "contact" | "save" = "contact") => {
    if (isLoggedIn) return true;
    setAuthPromptReason(reason);
    setShowAuthPrompt(true);
    return false;
  };

  const handleToggleSave = async () => {
    if (!requireAuth("save")) return;
    if (!isLoggedInClient()) return;

    setSaveLoading(true);
    try {
      if (isSaved) {
        const res = await authFetch(`/api/saved/${product._id}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(data.message || "Could not remove saved item", "error");
          return;
        }
        setIsSaved(false);
        showToast("Removed from saved items");
      } else {
        const res = await authFetch("/api/saved", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: product._id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(data.message || "Could not save item", "error");
          return;
        }
        setIsSaved(true);
        showToast("Saved for later");
      }
      window.dispatchEvent(new Event("sparesx-saved-changed"));
    } catch {
      showToast("Something went wrong. Try again.", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRateClick = () => {
    if (!requireAuth("contact")) return;
    setShowRateModal(true);
  };

  const handleReportClick = () => {
    if (!requireAuth("contact")) return;
    const sellerId = seller?._id || "";
    const params = new URLSearchParams({
      type: "abuse",
      productId: product._id,
      reportedUserId: sellerId,
      subject: `Report: ${product.name}`.slice(0, 140),
    });
    router.push(`/support?${params.toString()}`);
  };

  const handleChatClick = () => {
    if (!requireAuth("contact")) return;
    const sellerId = seller?._id;
    if (!sellerId) {
      alert("Seller is not available for chat.");
      return;
    }
    openChatUi({
      peerId: sellerId,
      productId: product._id,
    });
  };

  const handleWhatsAppClick = async () => {
    if (!requireAuth("contact")) return;
    const sellerId = seller?._id;
    if (!sellerId) {
      showToast("Seller is not available", "error");
      return;
    }

    if (waConnect?.unlocked && waConnect.whatsappUrl) {
      window.open(waConnect.whatsappUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (waConnect?.status === "pending") {
      showToast("Waiting for the seller to approve your WhatsApp request");
      return;
    }

    if (waConnect && !waConnect.canRequest) {
      showToast(waConnect.reason || "Cannot request WhatsApp right now", "error");
      return;
    }

    if (!isLoggedInClient()) return;

    setWaActionLoading(true);
    try {
      const res = await authFetch("/api/whatsapp-connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerId,
          productId: product._id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || "Could not send WhatsApp request", "error");
        return;
      }
      if (data.unlocked || data.status === "approved") {
        await loadWaConnect(String(sellerId), product._id);
        showToast(
          "WhatsApp unlocked — you can message this seller for any of their listings",
        );
        return;
      }
      setWaConnect({
        status: "pending",
        unlocked: false,
        canRequest: false,
        reason: "Waiting for the seller to approve your WhatsApp request",
      });
      showToast(
        "Request sent. Once approved, WhatsApp stays unlocked for all their listings.",
      );
    } catch {
      showToast("Something went wrong. Try again.", "error");
    } finally {
      setWaActionLoading(false);
    }
  };

  const waButtonLabel = (() => {
    if (waLoading || waActionLoading) return "…";
    if (waConnect?.unlocked) return "Open WhatsApp";
    if (waConnect?.status === "pending") return "WA pending";
    return "Request WhatsApp";
  })();

  const images = (product.images || []).map(resolveUploadUrl).filter(Boolean);
  const imageAlt = formatListingAlt(product);
  const heading = formatProductHeading(product);
  const partLabel = formatPartTypeLabel(product.partType);
  const conditionLabel = formatConditionLabel(product.condition);
  const deviceLabel = formatDeviceLabel(product);
  const hubHref = partsPath({
    partType: product.partType,
    brand: product.brand,
    deviceModel: product.deviceModel,
  });

  const specRows: Array<{ label: string; value: ReactNode }> = [
    product.brand
      ? {
          label: "Brand",
          value: (
            <Link
              href={
                hubHref ||
                `/products?brand=${encodeURIComponent(product.brand)}`
              }
              className="font-medium text-[var(--brand)] hover:text-[var(--brand-hover)]"
            >
              {product.brand}
            </Link>
          ),
        }
      : null,
    product.deviceModel
      ? {
          label: "Compatible model",
          value: (
            <Link
              href={
                hubHref ||
                (product.brand
                  ? `/products?brand=${encodeURIComponent(product.brand)}&deviceModel=${encodeURIComponent(product.deviceModel)}`
                  : `/products?deviceModel=${encodeURIComponent(product.deviceModel)}`)
              }
              className="font-medium text-[var(--brand)] hover:text-[var(--brand-hover)]"
            >
              {deviceLabel}
            </Link>
          ),
        }
      : null,
    product.modelNumber
      ? { label: "Model number", value: product.modelNumber }
      : null,
    partLabel
      ? {
          label: "Part type",
          value: product.partType ? (
            <Link
              href={
                hubHref ||
                `/products?partType=${encodeURIComponent(product.partType)}`
              }
              className="font-medium text-[var(--brand)] hover:text-[var(--brand-hover)]"
            >
              {partLabel}
            </Link>
          ) : (
            partLabel
          ),
        }
      : null,
    product.deviceCategory || product.category
      ? {
          label: "Device category",
          value: String(product.deviceCategory || product.category),
        }
      : null,
    conditionLabel ? { label: "Condition", value: conditionLabel } : null,
    {
      label: "Price",
      value: `₹${product.price?.toLocaleString("en-IN")}${
        product.priceNegotiable ? " (negotiable)" : ""
      }`,
    },
    {
      label: "Availability",
      value: "In stock — contact seller to confirm",
    },
  ].filter(Boolean) as Array<{ label: string; value: ReactNode }>;

  return (
    <main className="min-h-screen bg-[var(--surface-2)] pb-28 lg:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[var(--muted)]">
            <ol className="flex flex-wrap items-center gap-1.5">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <li key={`${crumb.href}-${crumb.name}`} className="flex items-center gap-1.5">
                    {index > 0 ? <span aria-hidden>/</span> : null}
                    {isLast ? (
                      <span className="text-[var(--ink-secondary)] line-clamp-1">
                        {crumb.name}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="hover:text-[var(--brand)] transition-colors"
                      >
                        {crumb.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}

        {hubHref ? (
          <p className="mb-4 text-sm text-[var(--ink-secondary)]">
            More{" "}
            <Link
              href={hubHref}
              className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
            >
              {[product.brand, product.deviceModel, partLabel]
                .filter(Boolean)
                .join(" ")}{" "}
              parts
            </Link>{" "}
            from technicians across India.
          </p>
        ) : null}

        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <Link
            href="/products"
            className="inline-flex items-center text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors"
          >
            ← Back to products
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <ShareListingButton
              product={product}
              intent={isOwner ? "listed" : "found"}
              variant="button"
              label="Share"
            />
            {isOwner && (
              <>
                <Link
                  href={`/technician/products/edit/${product._id}`}
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Edit listing
                </Link>
                {product.status !== "sold" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="soft"
                    onClick={() => setSoldOpen(true)}
                  >
                    Mark as sold
                  </Button>
                ) : (
                  <Badge tone="success">Sold</Badge>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Gallery */}
          <Card className="p-4 sm:p-6">
            <div className="relative aspect-square rounded-[var(--radius)] bg-[var(--surface-3)] border border-[var(--border)] overflow-hidden flex items-center justify-center">
              {product.priceNegotiable && (
                <Badge
                  tone="success"
                  className="absolute top-3 right-3 z-10 shadow-[var(--shadow-sm)]"
                >
                  Negotiable
                </Badge>
              )}
              {selectedImage ? (
                <UploadedImage
                  src={selectedImage}
                  alt={imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 560px"
                  priority
                  className="object-contain p-4"
                />
              ) : (
                <p className="text-[var(--muted)]">No image available</p>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    aria-label={`View image ${idx + 1}`}
                    onClick={() => setSelectedImage(img)}
                    className={cn(
                      "aspect-square rounded-[var(--radius-sm)] border-2 overflow-hidden bg-[var(--surface)] transition-colors",
                      selectedImage === img
                        ? "border-[var(--brand)] ring-2 ring-[var(--brand-muted)]"
                        : "border-[var(--border)]",
                    )}
                  >
                    <UploadedImage
                      src={img}
                      alt={`${imageAlt} — view ${idx + 1}`}
                      width={96}
                      height={96}
                      sizes="96px"
                      className="w-full h-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Details */}
          <section className="space-y-5">
            <Card className="p-5 sm:p-7">
              <h1 className="text-2xl sm:text-4xl font-bold text-[var(--ink)] leading-tight mb-4 tracking-tight">
                {heading}
              </h1>

              <div className="flex flex-wrap gap-2 mb-5">
                {product.brand && <Badge tone="brand">{product.brand}</Badge>}
                {product.deviceModel && (
                  <Badge tone="brand">{product.deviceModel}</Badge>
                )}
                {partLabel ? <Badge tone="neutral">{partLabel}</Badge> : null}
                {(product.deviceCategory || product.category) && (
                  <Badge tone="neutral">
                    {product.deviceCategory || product.category}
                  </Badge>
                )}
                {conditionLabel ? (
                  <Badge
                    tone={product.condition === "new" ? "success" : "warning"}
                  >
                    {conditionLabel}
                  </Badge>
                ) : null}
              </div>

              <div className="rounded-[var(--radius)] bg-gradient-to-br from-[var(--brand)] to-[var(--brand-hover)] text-[var(--ink-inverse)] p-5 mb-5">
                <p className="text-sm text-[var(--ink-inverse)]/80 mb-1">Price</p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <p className="text-price text-3xl sm:text-4xl text-[var(--ink-inverse)]">
                    ₹{product.price?.toLocaleString()}
                  </p>
                  {product.status === "sold" ? (
                    <Badge
                      tone="success"
                      className="bg-[var(--ink-inverse)]/20 text-[var(--ink-inverse)] border-0"
                    >
                      Sold
                    </Badge>
                  ) : null}
                </div>
              </div>

              {!isOwner && (
                <Button
                  type="button"
                  onClick={handleToggleSave}
                  disabled={saveLoading}
                  variant={isSaved ? "soft" : "secondary"}
                  className={cn(
                    "mb-5 w-full sm:w-auto",
                    isSaved &&
                      "bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/30 hover:bg-[var(--warning-soft)]",
                  )}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill={isSaved ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  {saveLoading
                    ? "Please wait…"
                    : isSaved
                      ? "Saved for later"
                      : "Save for later"}
                </Button>
              )}

              <div className="mb-5">
                <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">
                  Description
                </h2>
                <p className="text-[var(--ink-secondary)] leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>

              <div className="mb-5">
                <h2 className="text-lg font-semibold text-[var(--ink)] mb-3">
                  Product details
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {specRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex flex-col gap-0.5 border-b border-[var(--border)] pb-2"
                    >
                      <dt className="text-[var(--muted)] font-medium">
                        {row.label}
                      </dt>
                      <dd className="text-[var(--ink)]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-sm text-[var(--ink-secondary)] leading-relaxed">
                  This {conditionLabel.toLowerCase() || "listed"}{" "}
                  {partLabel ? partLabel.toLowerCase() : "spare part"}
                  {deviceLabel ? ` for the ${deviceLabel}` : ""} is sold directly
                  by an independent technician on SparesX. Confirm fitment,
                  condition, and delivery with the seller before paying —
                  SparesX does not hold stock or process payments.
                </p>
              </div>

              <p className="text-sm text-[var(--muted)]">
                Listed on{" "}
                {new Date(product.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </Card>

            {/* Seller + contact */}
            <Card className="p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-lg font-semibold text-[var(--ink)]">Seller</h2>
                {!isOwner && seller && (
                  <button
                    type="button"
                    onClick={handleReportClick}
                    title="Report misbehaviour"
                    aria-label="Report seller"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--danger)] hover:opacity-80 px-2 py-1 rounded-[var(--radius)] hover:bg-[var(--danger-soft)] transition-colors"
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
                        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                      />
                    </svg>
                    Report
                  </button>
                )}
              </div>
              {seller ? (
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {seller._id ? (
                        <Link
                          href={`/u/${seller._id}`}
                          className="font-semibold text-[var(--ink)] hover:text-[var(--brand-hover)]"
                        >
                          {seller.name}
                        </Link>
                      ) : (
                        <p className="font-semibold text-[var(--ink)]">{seller.name}</p>
                      )}
                      <StarRatingDisplay
                        value={sellerRating.averageRating}
                        count={sellerRating.ratingCount}
                      />
                    </div>
                    <div className="mt-2">
                      <TrustBadges
                        density="compact"
                        phoneVerified={seller.phoneVerified}
                        emailVerified={seller.emailVerified}
                        kycVerified={seller.kycVerified}
                        businessVerified={seller.businessVerified}
                        addressVerified={seller.addressVerified}
                        isTrusted={seller.isTrusted}
                        trustScore={seller.trustScore}
                        trustLabel={seller.trustLabel}
                        badges={seller.badges}
                        activeBadgeKeys={seller.activeBadgeKeys}
                        showScore
                      />
                    </div>
                    {typeof seller.responseRate === "number" &&
                    (seller.responseSampleSize || 0) >= 3 ? (
                      <p className="text-xs text-[var(--muted)] mt-1.5">
                        Usually replies within 24h ({seller.responseRate}%)
                      </p>
                    ) : null}
                    {(seller.city || seller.state) && (
                      <p className="text-sm text-[var(--muted)] mt-1">
                        {[seller.city, seller.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  {!isOwner && product.status !== "sold" && (
                    <div className="hidden lg:flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        type="button"
                        onClick={handleWhatsAppClick}
                        disabled={waLoading || waActionLoading}
                        className={cn(
                          waConnect?.status === "pending" && !waConnect.unlocked
                            ? "bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/30 hover:bg-[var(--warning-soft)]"
                            : "bg-[#25D366] text-[var(--ink-inverse)] hover:bg-[#1ebe57] shadow-none",
                        )}
                      >
                        {waButtonLabel}
                      </Button>
                      <Button type="button" onClick={handleChatClick}>
                        In-app chat
                      </Button>
                      <Button type="button" variant="soft" onClick={handleRateClick}>
                        Rate seller
                      </Button>
                    </div>
                  )}
                  {!isOwner && product.status === "sold" ? (
                    <p className="text-sm font-semibold text-[var(--success)]">
                      This listing has been marked as sold.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">Seller details unavailable.</p>
              )}

              {!isLoggedIn && !isOwner && (
                <p className="mt-4 text-sm text-[var(--ink-secondary)] bg-[var(--warning-soft)] border border-[var(--warning)]/20 rounded-[var(--radius)] px-3 py-2">
                  Login or sign up to contact the seller.
                </p>
              )}
              {isLoggedIn && !isOwner && (
                <div className="mt-4 space-y-1.5">
                  {waConnect?.unlocked && (
                    <p className="text-xs text-[var(--success)] bg-[var(--success-soft)] border border-[var(--success)]/20 rounded-[var(--radius)] px-3 py-2">
                      WhatsApp unlocked with this seller
                      {waConnect.maskedNumber
                        ? ` (${waConnect.maskedNumber})`
                        : ""}
                      . You can message them on WhatsApp for any of their
                      listings.
                    </p>
                  )}
                  {waConnect?.status === "pending" && (
                    <p className="text-xs text-[var(--warning)] bg-[var(--warning-soft)] border border-[var(--warning)]/20 rounded-[var(--radius)] px-3 py-2">
                      WhatsApp request pending. Once they approve, unlock applies
                      to all their products.
                    </p>
                  )}
                  <p className="text-xs text-[var(--muted)]">
                    After chatting with the seller, you can rate their behaviour
                    and response. Spot misuse? Use Report — it opens Support with
                    your details prefilled for admin review.
                  </p>
                </div>
              )}
            </Card>
          </section>
        </div>

        {/* Similar products */}
        {similarProducts.length > 0 && (
          <section className="mt-10 sm:mt-14">
            <div className="flex items-end justify-between mb-5 gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-[var(--ink)] tracking-tight">
                  Similar products
                </h2>
                <p className="text-sm text-[var(--muted)] mt-1">
                  Based on brand, model, part type, and device category
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {similarProducts.map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile sticky CTAs */}
      {!isOwner && product.status !== "sold" && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass px-3 py-3">
          <div className="max-w-7xl mx-auto grid grid-cols-4 gap-1.5">
            <Button
              type="button"
              onClick={handleToggleSave}
              disabled={saveLoading}
              size="sm"
              variant={isSaved ? "soft" : "secondary"}
              className={cn(
                "h-auto min-h-0 py-3 text-xs rounded-[var(--radius)]",
                isSaved &&
                  "bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/30 hover:bg-[var(--warning-soft)]",
              )}
            >
              {isSaved ? "Saved" : "Save"}
            </Button>
            <Button
              type="button"
              onClick={handleWhatsAppClick}
              disabled={waLoading || waActionLoading}
              size="sm"
              className={cn(
                "h-auto min-h-0 py-3 text-xs rounded-[var(--radius)] shadow-none",
                waConnect?.status === "pending" && !waConnect.unlocked
                  ? "bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/30 hover:bg-[var(--warning-soft)]"
                  : "bg-[#25D366] text-[var(--ink-inverse)] hover:bg-[#1ebe57]",
              )}
            >
              {waButtonLabel}
            </Button>
            <Button
              type="button"
              onClick={handleChatClick}
              size="sm"
              className="h-auto min-h-0 py-3 text-xs rounded-[var(--radius)]"
            >
              Chat
            </Button>
            <Button
              type="button"
              onClick={handleRateClick}
              size="sm"
              variant="soft"
              className="h-auto min-h-0 py-3 text-xs rounded-[var(--radius)] bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/30 hover:bg-[var(--warning-soft)]"
            >
              Rate
            </Button>
          </div>
        </div>
      )}

      {seller?._id && (
        <RateSellerModal
          open={showRateModal}
          onClose={() => setShowRateModal(false)}
          sellerId={String(seller._id)}
          sellerName={seller.name}
          productId={product._id}
          onSubmitted={(stats) => setSellerRating(stats)}
        />
      )}

      {isOwner ? (
        <MarkSoldModal
          open={soldOpen}
          onClose={() => setSoldOpen(false)}
          productId={product._id}
          productName={heading}
          onSold={(soldVia) => {
            setProduct((prev) => ({
              ...prev,
              status: "sold",
              soldVia,
              soldAt: new Date().toISOString(),
            }));
            showToast("Listing marked as sold");
            router.refresh();
          }}
        />
      ) : null}

      <AuthPromptSheet
        open={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        nextPath={`/product/${product._id}`}
        description={
          authPromptReason === "save"
            ? "Please login or create an account to save this listing for later."
            : "Please login or create an account to contact the seller via WhatsApp or in-app chat."
        }
      />
    </main>
  );
}
