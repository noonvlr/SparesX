import type { Metadata } from "next";
import SavedItemsClient from "./SavedItemsClient";

export const metadata: Metadata = {
  title: "Saved Items - SparesX",
  description: "View spare parts you have saved for later.",
  openGraph: {
    title: "Saved Items - SparesX",
    description: "View spare parts you have saved for later.",
    type: "website",
  },
};

export default function BuyerSavedPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Items</h1>
          <p className="text-gray-600">
            Listings you saved for later. Remove anytime or open a product to contact the seller.
          </p>
        </header>
        <SavedItemsClient />
      </section>
    </main>
  );
}
