import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buyer Profile - SparesX",
  description: "Manage your buyer profile and contact preferences.",
  openGraph: {
    title: "Buyer Profile - SparesX",
    description: "Manage your buyer profile and contact preferences.",
    type: "website",
  },
};

export default function BuyerProfilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Profile</h1>
        <p className="text-gray-600 mb-6">
          Buyer profile management will be available after sign-in.
        </p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-gray-600">
          Please sign in to update your contact details.
        </div>
      </section>
    </main>
  );
}
