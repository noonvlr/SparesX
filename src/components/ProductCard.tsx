"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { openChatUi } from "@/components/chat/openChat";

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
  onRemove,
  removing = false,
}: {
  product: ProductCardData;
  rotateOnHover?: boolean;
  /** Optional remove / unsave control rendered on the card image */
  onRemove?: () => void;
  removing?: boolean;
}) {
  const router = useRouter();
  const images = (product.images || []).filter(Boolean);
  const [imageIndex, setImageIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);
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
    setSellerId(null);

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
      if (seller._id) setSellerId(String(seller._id));
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
        className="group relative bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col scale-[0.92] sm:scale-[0.95] origin-top"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setImageIndex(0);
        }}
      >
        {onRemove && (
          <button
            type="button"
            aria-label="Remove from saved"
            title="Remove"
            disabled={removing}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-2 left-2 z-20 inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 text-gray-600 border border-gray-200 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition disabled:opacity-50"
          >
            {removing ? (
              <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        )}

        <Link href={`/product/${product._id}`} className="block">
          <div className="relative w-full aspect-square bg-gray-50 overflow-hidden flex items-center justify-center border-b border-gray-200">
            {product.priceNegotiable && (
              <div className="absolute top-0 right-0 z-10 overflow-hidden w-20 h-20 pointer-events-none">
                <div className="absolute top-2.5 -right-6 w-24 rotate-45 bg-emerald-500 text-white text-[9px] sm:text-[10px] font-bold tracking-wide text-center py-0.5 shadow-md">
                  Negotiable
                </div>
              </div>
            )}
            {images.length > 0 ? (
              <>
                <img
                  src={resolveImageUrl(images[imageIndex] || images[0])}
                  alt={product.name}
                  className="w-full h-full object-contain p-2 sm:p-3 transition-all duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {images.length > 1 && (
                  <div className="absolute bottom-1.5 right-1.5 bg-black/50 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm">
                    {imageIndex + 1}/{images.length}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-300">
                <svg
                  className="w-10 h-10"
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

        <div className="p-2.5 sm:p-3 flex flex-col flex-1">
          <Link href={`/product/${product._id}`}>
            <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors text-xs sm:text-sm leading-snug">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-1 flex-wrap mb-2">
            {badge && (
              <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                {badge}
              </span>
            )}
            {product.condition && (
              <span
                className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                  product.condition === "new"
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {product.condition}
              </span>
            )}
          </div>

          <div className="mt-auto space-y-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-blue-600">
                ₹{product.price?.toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              onClick={openContact}
              className="w-full py-1.5 rounded-lg bg-gray-900 text-white text-[11px] sm:text-xs font-semibold hover:bg-gray-800 transition active:scale-[0.98]"
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
                  disabled={!sellerId}
                  onClick={() => {
                    if (!sellerId) return;
                    setContactOpen(false);
                    openChatUi({
                      peerId: sellerId,
                      productId: product._id,
                    });
                  }}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
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
