import { Suspense } from "react";
import ProductPageContent from "./_components/ProductPageContent";
import { Skeleton } from "@/components/ui/Card";

function ProductSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Skeleton className="h-9 w-2/3 max-w-sm mb-3" />
          <Skeleton className="h-5 w-1/2 max-w-xs" />
        </div>

        <Skeleton className="h-[52px] w-full rounded-[var(--radius-lg)] mb-6" />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <aside className="hidden lg:block lg:w-72 flex-shrink-0">
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-11 w-full" />
                </div>
              ))}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
                >
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="p-3.5 sm:p-4 space-y-2.5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-6 w-1/2 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BrowseProductsPage() {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductPageContent />
    </Suspense>
  );
}
