"use client";

import ProductCard, { ProductCardData } from "@/components/ProductCard";

export default function FeaturedProducts({
  products,
}: {
  products: ProductCardData[];
}) {
  if (!products?.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Featured Products
        </h2>
        <a
          href="/products"
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm sm:text-base hover:underline"
        >
          View All →
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
