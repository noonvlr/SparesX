"use client";

import Link from "next/link";
import ProductCard, { ProductCardData } from "@/components/ProductCard";
import { EmptyState } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/ui/cn";

export default function FeaturedProducts({
  products,
}: {
  products: ProductCardData[];
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="flex justify-between items-end mb-6 sm:mb-8 gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-hover)] mb-2">
            Fresh listings
          </p>
          <h2 className="text-title sm:text-[1.75rem] font-semibold tracking-tight text-[var(--ink)]">
            Featured products
          </h2>
        </div>
        <Link
          href="/products"
          className="shrink-0 text-sm sm:text-base font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors"
        >
          View all →
        </Link>
      </div>

      {products?.filter((p) => p.status !== "sold").length ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
          {products
            .filter((product) => product.status !== "sold")
            .map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
        </div>
      ) : (
        <EmptyState
          className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
          title="No listings yet"
          description="New spare parts from verified technicians will show up here soon."
          action={
            <Link href="/products" className={cn(buttonVariants({ variant: "soft" }))}>
              Browse all products
            </Link>
          }
        />
      )}
    </section>
  );
}
