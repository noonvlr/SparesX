"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { openChatUi } from "@/components/chat/openChat";
import TrustBadges from "@/components/TrustBadges";
import { showToast } from "@/components/ToastHost";
import StarRatingDisplay from "@/components/StarRatingDisplay";
import RateSellerModal from "@/components/RateSellerModal";

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
  technician?: Seller | string;
}

interface SimilarProduct {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  brand?: string;
  partType?: string;
  category?: string;
  deviceCategory?: string;
  condition?: string;
}

function resolveImageUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("https://")) return url;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

function getUserIdFromToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || null;
  } catch {
    return null;
  }
}

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
}: {
  product: Product;
  similarProducts?: SimilarProduct[];
}) {
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);
  const [similarProducts, setSimilarProducts] = useState(initialSimilar);
  const [selectedImage, setSelectedImage] = useState(
    resolveImageUrl(initialProduct.images?.[0] || ""),
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
    const userId = getUserIdFromToken();
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    // Refresh product with auth so contact details / ownership are accurate
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(`/api/products/${initialProduct._id}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.product) {
          setProduct(data.product);
          if (data.product.images?.[0]) {
            setSelectedImage(resolveImageUrl(data.product.images[0]));
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
      })
      .catch(() => {
        const technicianId =
          typeof initialProduct.technician === "object"
            ? initialProduct.technician?._id
            : initialProduct.technician;
        setIsOwner(!!userId && String(technicianId) === String(userId));
      });

    if (token) {
      fetch(`/api/saved/${initialProduct._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setIsSaved(!!data.saved);
        })
        .catch(() => {});
    } else {
      setIsSaved(false);
      setWaConnect(null);
    }
  }, [initialProduct._id]);

  const seller: Seller | null = useMemo(() => {
    if (!product.technician || typeof product.technician !== "object") {
      return null;
    }
    return product.technician;
  }, [product.technician]);

  const loadWaConnect = async (sellerId: string, productId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setWaConnect(null);
      return;
    }
    setWaLoading(true);
    try {
      const res = await fetch(
        `/api/whatsapp-connect?sellerId=${encodeURIComponent(sellerId)}&productId=${encodeURIComponent(productId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
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
    const token = localStorage.getItem("token");
    if (!token) return;

    setSaveLoading(true);
    try {
      if (isSaved) {
        const res = await fetch(`/api/saved/${product._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(data.message || "Could not remove saved item", "error");
          return;
        }
        setIsSaved(false);
        showToast("Removed from saved items");
      } else {
        const res = await fetch("/api/saved", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
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

    const token = localStorage.getItem("token");
    if (!token) return;

    setWaActionLoading(true);
    try {
      const res = await fetch("/api/whatsapp-connect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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

  const images = (product.images || []).map(resolveImageUrl).filter(Boolean);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50 pb-28 lg:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <Link
            href="/products"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Products
          </Link>
          {isOwner && (
            <Link
              href={`/technician/products/edit/${product._id}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
            >
              Edit listing
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Gallery */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <div className="relative aspect-square rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 overflow-hidden flex items-center justify-center">
              {product.priceNegotiable && (
                <div className="absolute top-0 right-0 z-10 overflow-hidden w-28 h-28 pointer-events-none">
                  <div className="absolute top-4 -right-8 w-32 rotate-45 bg-emerald-500 text-white text-xs font-bold tracking-wide text-center py-1.5 shadow-md">
                    Negotiable
                  </div>
                </div>
              )}
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <p className="text-gray-400">No image available</p>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square rounded-lg border-2 overflow-hidden bg-white ${
                      selectedImage === img
                        ? "border-blue-600 ring-2 ring-blue-200"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Details */}
          <section className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7">
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
                {product.name}
              </h1>

              <div className="flex flex-wrap gap-2 mb-5">
                {product.brand && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {product.brand}
                  </span>
                )}
                {product.deviceModel && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {product.deviceModel}
                  </span>
                )}
                {product.partType && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                    {product.partType}
                  </span>
                )}
                {(product.deviceCategory || product.category) && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                    {product.deviceCategory || product.category}
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    product.condition === "new"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {product.condition}
                </span>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white p-5 mb-5">
                <p className="text-sm text-blue-100 mb-1">Price</p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <p className="text-3xl sm:text-4xl font-bold">
                    ₹{product.price?.toLocaleString()}
                  </p>
                </div>
              </div>

              {!isOwner && (
                <button
                  type="button"
                  onClick={handleToggleSave}
                  disabled={saveLoading}
                  className={`mb-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition disabled:opacity-60 ${
                    isSaved
                      ? "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                      : "bg-white text-gray-800 border-gray-200 hover:border-blue-300 hover:text-blue-700"
                  }`}
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
                </button>
              )}

              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>

              <p className="text-sm text-gray-500">
                Listed on{" "}
                {new Date(product.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Seller + contact */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-lg font-bold text-gray-900">Seller</h2>
                {!isOwner && seller && (
                  <button
                    type="button"
                    onClick={handleReportClick}
                    title="Report misbehaviour"
                    aria-label="Report seller"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition"
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
                          className="font-semibold text-gray-900 hover:text-blue-700"
                        >
                          {seller.name}
                        </Link>
                      ) : (
                        <p className="font-semibold text-gray-900">{seller.name}</p>
                      )}
                      <StarRatingDisplay
                        value={sellerRating.averageRating}
                        count={sellerRating.ratingCount}
                      />
                    </div>
                    <div className="mt-2">
                      <TrustBadges
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
                    {(seller.city || seller.state) && (
                      <p className="text-sm text-gray-500 mt-1">
                        {[seller.city, seller.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  {!isOwner && (
                    <div className="hidden lg:flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleWhatsAppClick}
                        disabled={waLoading || waActionLoading}
                        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-60 ${
                          waConnect?.unlocked
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : waConnect?.status === "pending"
                              ? "bg-amber-50 text-amber-900 border border-amber-200"
                              : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {waButtonLabel}
                      </button>
                      <button
                        type="button"
                        onClick={handleChatClick}
                        className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                      >
                        In-app chat
                      </button>
                      <button
                        type="button"
                        onClick={handleRateClick}
                        className="px-4 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm font-semibold hover:bg-amber-100 transition"
                      >
                        Rate seller
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Seller details unavailable.</p>
              )}

              {!isLoggedIn && !isOwner && (
                <p className="mt-4 text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Login or sign up to contact the seller.
                </p>
              )}
              {isLoggedIn && !isOwner && (
                <div className="mt-4 space-y-1.5">
                  {waConnect?.unlocked && (
                    <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                      WhatsApp unlocked with this seller
                      {waConnect.maskedNumber
                        ? ` (${waConnect.maskedNumber})`
                        : ""}
                      . You can message them on WhatsApp for any of their
                      listings.
                    </p>
                  )}
                  {waConnect?.status === "pending" && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      WhatsApp request pending. Once they approve, unlock applies
                      to all their products.
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    After chatting with the seller, you can rate their behaviour
                    and response. Spot misuse? Use Report — it opens Support with
                    your details prefilled for admin review.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Similar products */}
        {similarProducts.length > 0 && (
          <section className="mt-10 sm:mt-14">
            <div className="flex items-end justify-between mb-5 gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Similar products
                </h2>
                <p className="text-sm text-gray-500 mt-1">
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
      {!isOwner && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur px-3 py-3">
          <div className="max-w-7xl mx-auto grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={saveLoading}
              className={`py-3 rounded-xl font-semibold text-xs border ${
                isSaved
                  ? "bg-amber-50 text-amber-900 border-amber-200"
                  : "bg-white text-gray-800 border-gray-200"
              }`}
            >
              {isSaved ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={handleWhatsAppClick}
              disabled={waLoading || waActionLoading}
              className={`py-3 rounded-xl font-semibold text-xs disabled:opacity-60 ${
                waConnect?.status === "pending" && !waConnect.unlocked
                  ? "bg-amber-50 text-amber-900 border border-amber-200"
                  : "bg-green-600 text-white"
              }`}
            >
              {waButtonLabel}
            </button>
            <button
              type="button"
              onClick={handleChatClick}
              className="py-3 rounded-xl bg-blue-600 text-white font-semibold text-xs"
            >
              Chat
            </button>
            <button
              type="button"
              onClick={handleRateClick}
              className="py-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-semibold text-xs"
            >
              Rate
            </button>
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

      {/* Auth modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Login required
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {authPromptReason === "save"
                ? "Please login or create an account to save this listing for later."
                : "Please login or create an account to contact the seller via WhatsApp or in-app chat."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/login?next=${encodeURIComponent(`/product/${product._id}`)}`,
                  )
                }
                className="py-3 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/register?next=${encodeURIComponent(`/product/${product._id}`)}`,
                  )
                }
                className="py-3 rounded-xl border border-gray-300 text-gray-800 font-semibold"
              >
                Sign up
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowAuthPrompt(false)}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
