"use client";

import Link from "next/link";
import UploadedImage from "@/components/ui/UploadedImage";
import { cn } from "@/lib/ui/cn";
import {
  formatListingAlt,
  formatListingTitle,
  formatPartTypeLabel,
} from "@/lib/products/listingTitle";
import { similarSectionCopy } from "@/lib/products/similarProducts";
import { productPath } from "@/lib/seo/site";
import { resolveUploadUrl } from "@/lib/ui/imageUrl";

export type SimilarProductItem = {
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
  priceNegotiable?: boolean;
};

type SimilarProductsProps = {
  products: SimilarProductItem[];
  seed: {
    brand?: string;
    partType?: string;
    deviceModel?: string;
  };
  /** Prefer parts hub when available */
  hubHref?: string | null;
};

function SimilarCard({
  product,
  priority = false,
}: {
  product: SimilarProductItem;
  priority?: boolean;
}) {
  const href = productPath(product);
  const title = formatListingTitle(product);
  const imageAlt = formatListingAlt(product);
  const partLabel = formatPartTypeLabel(product.partType);
  const image = resolveUploadUrl(product.images?.[0] || "");
  const meta = [product.brand, product.deviceModel].filter(Boolean).join(" · ");

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full w-[9.75rem] sm:w-full shrink-0 flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]",
        "transition-[border-color,box-shadow,transform] duration-200 hover:border-[var(--brand-muted)] hover:shadow-[var(--shadow)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]",
      )}
    >
      <div className="relative aspect-square bg-[var(--surface-3)] border-b border-[var(--border)]">
        {image ? (
          <UploadedImage
            src={image}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 42vw, 180px"
            priority={priority}
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--muted)] text-xs">
            No image
          </div>
        )}
        {product.condition ? (
          <span
            className={cn(
              "absolute left-2 top-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize",
              product.condition === "new"
                ? "bg-[var(--success-soft)] text-[var(--success)]"
                : "bg-[var(--warning-soft)] text-[var(--warning)]",
            )}
          >
            {product.condition}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-[var(--ink)] group-hover:text-[var(--brand)]">
          {title}
        </h3>
        {partLabel || meta ? (
          <p className="line-clamp-1 text-[11px] text-[var(--muted)]">
            {[partLabel, meta].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        <p className="mt-auto text-sm font-semibold tabular-nums text-[var(--brand)]">
          ₹{Number(product.price || 0).toLocaleString("en-IN")}
          {product.priceNegotiable ? (
            <span className="ml-1 text-[10px] font-medium text-[var(--muted)]">
              nego
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}

/**
 * Discovery rail under a product detail page.
 * Compact cards (no contact chrome) + contextual heading.
 */
export default function SimilarProducts({
  products,
  seed,
  hubHref,
}: SimilarProductsProps) {
  if (!products.length) return null;

  const partLabel = formatPartTypeLabel(seed.partType) || seed.partType || "";
  const { title, subtitle, browseHref } = similarSectionCopy({
    ...seed,
    partLabel,
  });
  const viewAllHref = hubHref || browseHref;

  return (
    <section className="mt-10 sm:mt-12" aria-labelledby="similar-products-heading">
      <div className="mb-4 sm:mb-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="similar-products-heading"
            className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--ink)] text-balance"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        </div>
        <Link
          href={viewAllHref}
          className="shrink-0 text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
        >
          View all
        </Link>
      </div>

      <div
        className={cn(
          "flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0",
          "sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:overflow-visible sm:pb-0",
          "snap-x snap-mandatory sm:snap-none",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {products.map((item, index) => (
          <div
            key={item._id}
            className="snap-start sm:min-w-0 sm:w-auto"
          >
            <SimilarCard product={item} priority={index < 2} />
          </div>
        ))}
      </div>
    </section>
  );
}
