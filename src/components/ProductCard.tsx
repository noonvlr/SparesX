"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AuthPromptSheet,
  ContactSheet,
  useContactFlow,
} from "@/components/ContactSheet";
import { Badge } from "@/components/ui/Card";
import { cn } from "@/lib/ui/cn";

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

export default function ProductCard({
  product,
  rotateOnHover = true,
  onRemove,
  removing = false,
}: {
  product: ProductCardData;
  rotateOnHover?: boolean;
  onRemove?: () => void;
  removing?: boolean;
}) {
  const images = (product.images || []).filter(Boolean);
  const [imageIndex, setImageIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const contact = useContactFlow(product._id);

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

  return (
    <>
      <article
        className="group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] card-hover"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setImageIndex(0);
        }}
      >
        {onRemove ? (
          <button
            type="button"
            aria-label="Remove from saved"
            disabled={removing}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-3 left-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full glass text-[var(--muted)] hover:text-[var(--danger)] disabled:opacity-50"
          >
            {removing ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        ) : null}

        <Link href={`/product/${product._id}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-3)]">
            {product.priceNegotiable ? (
              <Badge
                tone="success"
                className="absolute top-3 right-3 z-10 shadow-sm"
              >
                Negotiable
              </Badge>
            ) : null}
            {images.length > 0 ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveImageUrl(images[imageIndex] || images[0])}
                  alt={product.name}
                  className="card-image-zoom h-full w-full object-cover"
                  loading="lazy"
                />
                {images.length > 1 ? (
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {imageIndex + 1}/{images.length}
                  </span>
                ) : null}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
          <Link href={`/product/${product._id}`}>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--ink)] transition-colors group-hover:text-[var(--brand)]">
              {product.name}
            </h3>
          </Link>

          <div className="flex flex-wrap gap-1.5">
            {badge ? <Badge tone="brand">{badge}</Badge> : null}
            {product.condition ? (
              <Badge
                tone={product.condition === "new" ? "success" : "warning"}
              >
                {product.condition}
              </Badge>
            ) : null}
          </div>

          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
            <p className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              ₹{product.price?.toLocaleString()}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void contact.openContact();
              }}
              className={cn(
                "btn-press h-10 min-h-[40px] rounded-[var(--radius)] bg-[var(--brand)] px-3.5 text-xs font-semibold text-white hover:bg-[var(--brand-hover)]",
              )}
            >
              Contact
            </button>
          </div>
        </div>
      </article>

      <ContactSheet
        open={contact.contactOpen}
        onClose={() => contact.setContactOpen(false)}
        productId={product._id}
        productName={product.name}
        sellerId={contact.sellerId}
        waState={contact.waState}
        loading={contact.loadingContact}
        error={contact.contactError}
        waActionLoading={contact.waActionLoading}
        onWhatsApp={contact.onWhatsApp}
      />
      <AuthPromptSheet
        open={contact.authPrompt}
        onClose={() => contact.setAuthPrompt(false)}
        nextPath={`/product/${product._id}`}
      />
    </>
  );
}
