import { Suspense } from "react";
import type { Metadata } from "next";
import RequestsBoard from "./_components/RequestsBoard";
import { Skeleton } from "@/components/ui/Card";
import { fetchOpenRequests } from "@/lib/requests/openRequests";

export const metadata: Metadata = {
  title: "Parts Others Are Looking For",
  description:
    "Browse open spare-part requests from technicians who need a part. If you have it, message them — or post your own request on SparesX.",
  keywords: [
    "request spare part",
    "part request",
    "find mobile parts",
    "technician network",
    "seller matching",
  ],
  alternates: {
    canonical: "/requests",
  },
  openGraph: {
    title: "Parts Others Are Looking For | SparesX",
    description:
      "See open part requests from technicians across India. Supply a part if you have it, or post your own request. SparesX does not process payments.",
    type: "website",
    url: "/requests",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function RequestsFallback() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-12 w-64 rounded-[var(--radius-lg)]" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-44 rounded-[var(--radius-lg)]" />
        ))}
      </div>
    </div>
  );
}

// Prerender the board and refresh it every few minutes; the client still
// re-fetches on load so signed-in visitors get contact actions immediately.
export const revalidate = 180;

export default async function RequestsPage() {
  // Anonymous, contact-free snapshot so the board is in the initial HTML.
  const { requests, total, categoryFacets } = await fetchOpenRequests({
    limit: 50,
  });

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <header className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-3">
            Parts others are looking for
          </h1>
          <p className="text-[var(--muted)] text-base sm:text-lg max-w-3xl">
            These are open requests from technicians who need a spare part. If
            you have it, message them. Or post your own request.
          </p>
        </header>
        <Suspense fallback={<RequestsFallback />}>
          <RequestsBoard
            initialRequests={requests}
            initialTotal={total}
            initialCategoryFacets={categoryFacets}
          />
        </Suspense>
      </section>
    </main>
  );
}
