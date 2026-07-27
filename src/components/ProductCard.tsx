"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export interface ProductCardData {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  brand?: string;
  partType?: string;
  category?: string;
  deviceCategory?: string;
  condition?: string;
  priceNegotiable?: boolean;
}

function resolveImageUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  if (url.startsWith("https://")) return url;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

function buildWhatsAppLink(
  countryCode: string | undefined,
  whatsappNumber: string | undefined,
  mobile: string | undefined,
  productName: string,
) {
  const code = (countryCode || "+91").replace(/\D/g, "");
  const number = (whatsappNumber || mobile || "").replace(/\D/g, "");
  if (!number) return null;
  const phone = `${code}${number}`.replace(/^0+/, "");
  const text = encodeURIComponent(
    `Hi, I'm interested in your listing "${productName}" on SparesX.`,
  );
  return `https://wa.me/${phone}?text=${text}`;
}

export default function ProductCard({
  product,
  rotateOnHover = true,
}: {
  product: ProductCardData;
  rotateOnHover?: boolean;
}) {
  const router = useRouter();
  const images = (product.images || []).filter(Boolean);
  const [imageIndex, setImageIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  useEffect(() => {
    if (!rotateOnHover || !hovered || images.length <= 1) return;
    const interval = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [hovered, images.length, rotateOnHover]);

  const badge =
    product.brand ||
    product.partType ||
    product.category ||
    product.deviceCategory;

  const openContact = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      setAuthPrompt(true);
      return;
    }

    setContactOpen(true);
    setLoadingContact(true);
    setContactError(null);
    setWhatsappUrl(null);

    try {
      const res = await fetch(`/api/products/${product._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setContactError(data.error || "Could not load seller contact");
        return;
      }
      const seller = data.product?.technician;
      if (!seller || typeof seller !== "object") {
        setContactError("Seller contact unavailable");
        return;
      }
      const url = buildWhatsAppLink(
        seller.countryCode,
        seller.whatsappNumber,
        seller.mobile,
        product.name,
      );
      setWhatsappUrl(url);
      if (!url) setContactError("Seller WhatsApp number is not available");
    } catch {
      setContactError("Failed to load contact options");
    } finally {
      setLoadingContact(false);
    }
  };

  return (
    <>
      <div
        className="group bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 flex flex-col"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setImageIndex(0);
        }}
      >
        <Link href={`/product/${product._id}`} className="block">
          <div className="relative w-full aspect-square bg-gray-50 overflow-hidden flex items-center justify-center border-b border-gray-200">
            {images.length > 0 ? (
              <>
                <img
                  src={resolveImageUrl(images[imageIndex] || images[0])}
                  alt={product.name}
                  className="w-full h-full object-contain p-3 sm:p-4 transition-all duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                    {imageIndex + 1}/{images.length}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-300">
                <svg
                  className="w-12 h-12"
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
        </Link>

        <div className="p-3 sm:p-4 flex flex-col flex-1">
          <Link href={`/product/${product._id}`}>
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors text-sm sm:text-base">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {badge && (
              <span className="text-[11px] sm:text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                {badge}
              </span>
            )}
            {product.condition && (
              <span
                className={`text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${
                  product.condition === "new"
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {product.condition}
              </span>
            )}
          </div>

          <div className="mt-auto space-y-2.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-bold text-blue-600">
                ₹{product.price?.toLocaleString()}
              </span>
              {product.priceNegotiable && (
                <span className="text-[10px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                  Negotiable
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={openContact}
              className="w-full py-2 rounded-lg bg-gray-900 text-white text-xs sm:text-sm font-semibold hover:bg-gray-800 transition active:scale-[0.98]"
            >
              Contact now
            </button>
          </div>
        </div>
      </div>

      {contactOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setContactOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 animate-in slide-in-from-bottom-4 zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-1">Contact seller</h3>
            <p className="text-sm text-gray-500 mb-5 line-clamp-2">{product.name}</p>

            {loadingContact ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading options…</div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={!whatsappUrl}
                  onClick={() => {
                    if (whatsappUrl)
                      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() =>
                    alert("In-app chat is coming soon. Please use WhatsApp for now.")
                  }
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  In-app chat
                </button>
                {contactError && (
                  <p className="text-sm text-red-600 pt-1">{contactError}</p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setContactOpen(false)}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {authPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setAuthPrompt(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Login required</h3>
            <p className="text-sm text-gray-600 mb-5">
              Login or sign up to contact the seller via WhatsApp or chat.
            </p>
            <div className="grid grid-cols-2 gap-2">
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
                className="py-3 rounded-xl border border-gray-300 font-semibold"
              >
                Sign up
              </button>
            </div>
            <button
              type="button"
              onClick={() => setAuthPrompt(false)}
              className="mt-3 w-full text-sm text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
