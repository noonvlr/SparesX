"use client";

import Link from "next/link";
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
}: {
  product: ProductCardData;
  rotateOnHover?: boolean;
}) {
  const images = (product.images || []).filter(Boolean);
  const [imageIndex, setImageIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!rotateOnHover || !hovered || images.length <= 1) return;

    const interval = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [hovered, images.length, rotateOnHover]);

  const badge =
    product.brand || product.partType || product.category || product.deviceCategory;

  return (
    <Link
      href={`/product/${product._id}`}
      className="group bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setImageIndex(0);
      }}
    >
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
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
          ₹{product.price?.toLocaleString()}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {badge && (
            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
              {badge}
            </span>
          )}
          {product.condition && (
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                product.condition === "new"
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {product.condition}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
