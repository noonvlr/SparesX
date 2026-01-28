import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Seller Messages - SparesX",
  description: "Review buyer enquiries and respond quickly.",
  openGraph: {
    title: "Seller Messages - SparesX",
    description: "Review buyer enquiries and respond quickly.",
    type: "website",
  },
};

export default function SellerMessagesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Messages</h1>
        <p className="text-gray-600 mb-6">
          Buyer enquiries will appear here. Keep your contact details updated to
          respond quickly.
        </p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-gray-600">
          No messages yet.
          <Link
            href="/technician/profile"
            className="text-blue-600 ml-2 hover:underline"
          >
            Update profile
          </Link>
          .
        </div>
      </section>
    </main>
  );
}
