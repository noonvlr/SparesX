import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Buyer Requests - SparesX",
  description: "Review your part requests and submit new ones.",
  openGraph: {
    title: "Buyer Requests - SparesX",
    description: "Review your part requests and submit new ones.",
    type: "website",
  },
};

export default function BuyerRequestsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">My Requests</h1>
        <p className="text-gray-600 mb-6">
          Requests you submit appear here for follow-up.
        </p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-gray-600">
          No requests yet.
          <Link href="/requests" className="text-blue-600 ml-2 hover:underline">
            Submit a request
          </Link>
          .
        </div>
      </section>
    </main>
  );
}
