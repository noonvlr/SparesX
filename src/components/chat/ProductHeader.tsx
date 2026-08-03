"use client";

import Link from "next/link";
import type { ChatProduct } from "@/types/chat";
import { Badge } from "@/components/ui/Card";

export default function ProductHeader({
  product,
}: {
  product?: ChatProduct | string | null;
}) {
  if (!product || typeof product === "string") return null;
  const href = product.slug
    ? `/product/${product.slug}`
    : `/product/${product._id}`;
  const img = product.images?.[0];

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--brand-soft)]/50 hover:bg-[var(--brand-soft)] transition"
    >
      {img ? (
        <img
          src={img}
          alt=""
          className="w-11 h-11 rounded-lg object-cover border border-[var(--brand-muted)]"
        />
      ) : (
        <div className="w-11 h-11 rounded-lg bg-[var(--brand-muted)]" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--ink)] line-clamp-1">
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs text-[var(--muted)] truncate">
            {[product.brand, product.deviceModel].filter(Boolean).join(" · ")}
          </p>
          {product.price != null && (
            <Badge tone="brand" className="shrink-0 text-[11px] px-1.5 py-0.5 rounded-md">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </Badge>
          )}
        </div>
      </div>
      <span className="shrink-0 text-xs text-[var(--brand-hover)] font-semibold flex items-center gap-0.5">
        View <span aria-hidden>›</span>
      </span>
    </Link>
  );
}
