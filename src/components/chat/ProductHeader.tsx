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
      className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 bg-slate-50 hover:bg-slate-100 transition"
    >
      {img ? (
        <img
          src={img}
          alt=""
          className="w-11 h-11 rounded-lg object-cover border"
        />
      ) : (
        <div className="w-11 h-11 rounded-lg bg-gray-200" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">
          {product.name}
        </p>
        <p className="text-xs text-gray-500">
          {[product.brand, product.deviceModel].filter(Boolean).join(" · ")}
          {product.price != null
            ? ` · ₹${Number(product.price).toLocaleString("en-IN")}`
            : ""}
        </p>
      </div>
      <span className="text-xs text-blue-600 font-medium">View</span>
    </Link>
  );
}
