"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthPromptSheet,
  ContactSheet,
  useContactFlow,
} from "@/components/ContactSheet";
import MarkSoldModal from "@/components/MarkSoldModal";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Spinner } from "@/components/ui/Spinner";
import UploadedImage from "@/components/ui/UploadedImage";
import { cn } from "@/lib/ui/cn";
import {
  formatListingAlt,
  formatListingTitle,
  formatPartTypeLabel,
} from "@/lib/products/listingTitle";
import { productPath } from "@/lib/seo/site";
import { authFetch, getCachedUserId } from "@/lib/auth/clientAuth";
import { ShareListingButton } from "@/components/ShareListing";

export interface ProductCardData {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  brand?: string;
  partType?: string;
  deviceModel?: string;
  category?: string;
  deviceCategory?: string;
  condition?: string;
  priceNegotiable?: boolean;
  slug?: string;
  /** Owner user id — when it matches the signed-in seller, show owner actions. */
  technician?: string;
}

export default function ProductCard({
  product,
  rotateOnHover = true,
  onRemove,
  removing = false,
  priority = false,
}: {
  product: ProductCardData;
  rotateOnHover?: boolean;
  onRemove?: () => void;
  removing?: boolean;
  /** Set on the first row of a grid so the LCP image isn't lazy-loaded. */
  priority?: boolean;
}) {
  const router = useRouter();
  const images = (product.images || []).filter(Boolean);
  const [imageIndex, setImageIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [soldOpen, setSoldOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const contact = useContactFlow(product._id);
  const detailPath = productPath(product);

  useEffect(() => {
    const userId = getCachedUserId();
    setIsOwner(
      Boolean(userId && product.technician && userId === String(product.technician)),
    );
  }, [product.technician]);

  useEffect(() => {
    if (!rotateOnHover || !hovered || images.length <= 1) return;
    const interval = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [hovered, images.length, rotateOnHover]);

  const badge =
    product.brand ||
    product.category ||
    product.deviceCategory;
  const title = formatListingTitle(product);
  const imageAlt = formatListingAlt(product);
  const partLabel = formatPartTypeLabel(product.partType);

  async function handleDelete() {
    const status = (product as { status?: string }).status;
    const permanent =
      status === "sold" || status === "pending" || status === "rejected";
    if (
      !confirm(
        permanent
          ? `Permanently delete "${title}"? This cannot be undone and removes listing images from storage.`
          : `Remove "${title}" from the marketplace?\n\nIt will be marked Sold (for your records). To erase it and free image storage, open Sold and choose Delete permanently.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await authFetch(`/api/technician/products/delete/${product._id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setHidden(true);
        if ((data as { treatedAsSold?: boolean }).treatedAsSold) {
          alert(
            "Listing moved to Sold. Open your Sold tab and delete permanently if you want to erase images and free storage.",
          );
        }
        router.refresh();
      } else {
        alert(
          (data as { message?: string }).message ||
            "Failed to delete product. Try again.",
        );
      }
    } catch {
      alert("Failed to delete product. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (hidden) return null;

  return (
    <>
      <article
        className="group relative flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] origin-top scale-[0.92] sm:scale-[0.95] card-hover"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setImageIndex(0);
        }}
      >
        {onRemove ? (
          <IconButton
            type="button"
            aria-label="Remove from saved"
            disabled={removing}
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-2 left-2 z-20 rounded-full bg-[var(--surface)]/95 text-[var(--muted)] shadow-[var(--shadow-sm)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
          >
            {removing ? (
              <Spinner size="sm" className="text-[var(--muted)]" />
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
          </IconButton>
        ) : null}

        {isOwner ? (
          <span className="absolute top-2 right-2 z-20 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ink-inverse)] shadow-[var(--shadow-sm)]">
            Yours
          </span>
        ) : null}

        <div
          className={cn(
            "absolute z-20",
            onRemove ? "top-2 right-2" : "top-2 left-2",
            isOwner && !onRemove ? "top-2 left-2" : null,
          )}
        >
          <ShareListingButton
            product={product}
            intent={isOwner ? "listed" : "found"}
          />
        </div>

        <Link href={detailPath} className="block">
          <div className="relative aspect-square overflow-hidden bg-[var(--surface-2)] border-b border-[var(--border-strong)] flex items-center justify-center">
            {product.priceNegotiable && !isOwner ? (
              <div className="absolute top-0 right-0 z-10 overflow-hidden w-20 h-20 pointer-events-none">
                <div className="absolute top-2.5 -right-6 w-24 rotate-45 bg-[var(--success)] text-[var(--ink-inverse)] text-[9px] sm:text-[10px] font-bold tracking-wide text-center py-0.5 shadow-[var(--shadow-sm)]">
                  Negotiable
                </div>
              </div>
            ) : null}
            {images.length > 0 ? (
              <>
                <UploadedImage
                  src={images[imageIndex] || images[0]}
                  alt={imageAlt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
                  priority={priority}
                  className="card-image-zoom object-contain p-2 sm:p-3"
                />
                {images.length > 1 ? (
                  <span className="absolute bottom-1.5 right-1.5 rounded-full bg-[var(--ink)]/50 px-2 py-0.5 text-[10px] font-semibold text-[var(--ink-inverse)]">
                    {imageIndex + 1}/{images.length}
                  </span>
                ) : null}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--border-strong)]">
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

        <div className="flex flex-1 flex-col p-2.5 sm:p-3">
          <Link href={detailPath}>
            <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-[var(--ink)] transition-colors group-hover:text-[var(--brand)]">
              {title}
            </h3>
          </Link>

          <div className="mb-2 flex flex-wrap gap-1">
            {partLabel ? (
              <span className="rounded-full bg-[var(--brand-soft)] px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-[var(--brand-hover)]">
                {partLabel}
              </span>
            ) : null}
            {badge ? (
              <span className="rounded-full bg-[var(--surface-3)] px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-[var(--ink-secondary)]">
                {badge}
              </span>
            ) : null}
            {product.condition ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium",
                  product.condition === "new"
                    ? "bg-[var(--success-soft)] text-[var(--success)]"
                    : "bg-[var(--warning-soft)] text-[var(--warning)]",
                )}
              >
                {product.condition}
              </span>
            ) : null}
          </div>

          <div className="mt-auto space-y-2">
            <p className="text-price text-base sm:text-lg text-[var(--brand)]">
              ₹{product.price?.toLocaleString()}
            </p>

            {isOwner ? (
              <div className="grid grid-cols-3 gap-1.5">
                <Link
                  href={`/technician/products/edit/${product._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-1 py-1.5 text-[11px] sm:text-xs font-semibold text-[var(--ink-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors",
                  )}
                >
                  Edit
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="soft"
                  className="h-auto min-h-0 rounded-lg px-1 py-1.5 text-[11px] sm:text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSoldOpen(true);
                  }}
                >
                  Sold
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  className="h-auto min-h-0 rounded-lg px-1 py-1.5 text-[11px] sm:text-xs bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-[var(--ink-inverse)] shadow-none"
                  disabled={deleting}
                  loading={deleting}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void handleDelete();
                  }}
                >
                  {deleting ? "…" : "Delete"}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                className="w-full h-auto min-h-0 py-1.5 text-[11px] sm:text-xs rounded-lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void contact.openContact();
                }}
              >
                Contact now
              </Button>
            )}
          </div>
        </div>
      </article>

      {!isOwner ? (
        <>
          <ContactSheet
            open={contact.contactOpen}
            onClose={() => contact.setContactOpen(false)}
            productId={product._id}
            productName={title}
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
            nextPath={detailPath}
          />
        </>
      ) : (
        <MarkSoldModal
          open={soldOpen}
          onClose={() => setSoldOpen(false)}
          productId={product._id}
          productName={title}
          onSold={() => {
            setHidden(true);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
