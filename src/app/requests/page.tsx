import { Suspense } from "react";
import type { Metadata } from "next";
import RequestsBoard from "./_components/RequestsBoard";

export const metadata: Metadata = {
  title: "Part Requests",
  description:
    "Browse open spare-part requests from buyers, or submit your own request and get responses from verified technicians.",
  keywords: [
    "request spare part",
    "part request",
    "find mobile parts",
    "custom request",
    "technician network",
  ],
  alternates: {
    canonical: "/requests",
  },
  openGraph: {
    title: "Part Requests | SparesX",
    description:
      "Browse open requests or submit a spare parts request to verified technicians.",
    type: "website",
    url: "https://spares-x-h1cj.vercel.app/requests",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function RequestsFallback() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 w-64 bg-gray-200 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-44 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function RequestsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <header className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Part Requests
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-3xl">
            See what parts other users need and respond if you have them — or
            post your own request for sellers to fulfill.
          </p>
        </header>
        <Suspense fallback={<RequestsFallback />}>
          <RequestsBoard />
        </Suspense>
      </section>
    </main>
  );
}
