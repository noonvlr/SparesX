import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buyer Enquiries - SparesX",
  description: "Track seller responses and offers to your enquiries.",
  openGraph: {
    title: "Buyer Enquiries - SparesX",
    description: "Track seller responses and offers to your enquiries.",
    type: "website",
  },
};

export default function BuyerEnquiriesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Enquiries</h1>
        <p className="text-gray-600 mb-6">
          Seller replies and offers will appear here.
        </p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-gray-600">
          You have no active enquiries yet.
        </div>
      </section>
    </main>
  );
}
