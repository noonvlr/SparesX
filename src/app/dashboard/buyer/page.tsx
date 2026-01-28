import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Buyer Dashboard - SparesX",
  description: "Track your enquiries, requests, and saved parts on SparesX.",
  openGraph: {
    title: "Buyer Dashboard - SparesX",
    description: "Track your enquiries, requests, and saved parts on SparesX.",
    type: "website",
  },
};

export default function BuyerDashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Buyer Dashboard
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Manage your enquiries, requests, and saved parts.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/dashboard/buyer/requests"
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold mb-2">My Requests</h2>
            <p className="text-sm text-gray-600">
              Review requests you have submitted for specific parts.
            </p>
          </Link>
          <Link
            href="/dashboard/buyer/enquiries"
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold mb-2">Enquiries</h2>
            <p className="text-sm text-gray-600">
              Track conversations and offers from sellers.
            </p>
          </Link>
          <Link
            href="/dashboard/buyer/saved"
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold mb-2">Saved Parts</h2>
            <p className="text-sm text-gray-600">
              Quickly revisit listings you saved.
            </p>
          </Link>
          <Link
            href="/dashboard/buyer/profile"
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold mb-2">Profile</h2>
            <p className="text-sm text-gray-600">
              Update contact details for faster responses.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
