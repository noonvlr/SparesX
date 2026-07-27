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

export default function RequestsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Part Requests
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-3xl">
            See what parts other users need and respond if you have them — or
            post your own request for sellers to fulfill.
          </p>
        </header>
        <RequestsBoard />
      </section>
    </main>
  );
}
