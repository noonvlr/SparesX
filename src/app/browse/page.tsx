"use client";
import { Suspense } from "react";
import type { Metadata } from "next";
import ProductPageContent from "../products/_components/ProductPageContent";

// Note: Since this is a client component, metadata should be in a layout file
// Creating a layout file for this route would be ideal

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
