"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { openChatUi } from "@/components/chat/openChat";
import TrustBadges from "@/components/TrustBadges";

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

function buildWhatsAppLink(seller: Seller, productName: string) {
  const code = (seller.countryCode || "+91").replace(/\D/g, "");
  const number = (seller.whatsappNumber || seller.mobile || "").replace(
    /\D/g,
    "",
  );
  if (!number) return null;
  const phone = `${code}${number}`.replace(/^0+/, "");
  const text = encodeURIComponent(
    `Hi, I'm interested in your listing "${productName}" on SparesX.`,
  );
  return `https://wa.me/${phone}?text=${text}`;
}

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
  }, [initialProduct._id]);

  const seller: Seller | null = useMemo(() => {
    if (!product.technician || typeof product.technician !== "object") {
      return null;
    }
    return product.technician;
  }, [product.technician]);

  const whatsappUrl = seller
    ? buildWhatsAppLink(seller, product.name)
    : null;

  const requireAuth = () => {
    if (isLoggedIn) return true;
    setShowAuthPrompt(true);
    return false;
  };

  const handleChatClick = () => {
    if (!requireAuth()) return;
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

  const handleWhatsAppClick = () => {
    if (!requireAuth()) return;
    if (!whatsappUrl) {
      alert("Seller WhatsApp number is not available.");
      return;
    }
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

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
              <h2 className="text-lg font-bold text-gray-900 mb-3">Seller</h2>
              {seller ? (
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">{seller.name}</p>
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
                        className="px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
                      >
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={handleChatClick}
                        className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                      >
                        In-app chat
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
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3">
          <div className="max-w-7xl mx-auto grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleWhatsAppClick}
              className="py-3 rounded-xl bg-green-600 text-white font-semibold"
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handleChatClick}
              className="py-3 rounded-xl bg-blue-600 text-white font-semibold"
            >
              Chat
            </button>
          </div>
        </div>
      )}

      {/* Auth modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Login required
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Please login or create an account to contact the seller via
              WhatsApp or in-app chat.
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
