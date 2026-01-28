"use client";
import { Suspense } from "react";
import ProductPageContent from "../products/_components/ProductPageContent";

function ProductSkeleton() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      Loading...
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductPageContent />
    </Suspense>
  );
}
