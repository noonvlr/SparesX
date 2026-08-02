"use client";

import Link from "next/link";
import type { ChatProduct } from "@/types/chat";

export default function ProductHeader({
  product,
}: {
  product?: ChatProduct | string | null;
}) {
  if (!product || typeof product === "string") return null;
  const href = product.slug
    ? `/product/${product.slug}`
    : `/products/${product._id}`;
  const img = product.images?.[0];

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 border-b border-teal-900/10 bg-teal-50/50 hover:bg-teal-50 transition"
    >
      {img ? (
        <img
          src={img}
          alt=""
          className="w-11 h-11 rounded-lg object-cover border border-teal-100"
        />
      ) : (
        <div className="w-11 h-11 rounded-lg bg-teal-100" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs text-gray-500 truncate">
            {[product.brand, product.deviceModel].filter(Boolean).join(" · ")}
          </p>
          {product.price != null && (
            <span className="shrink-0 text-[11px] font-semibold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded-md">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>
      <span className="shrink-0 text-xs text-teal-700 font-semibold flex items-center gap-0.5">
        View <span aria-hidden>›</span>
      </span>
    </Link>
  );
}
