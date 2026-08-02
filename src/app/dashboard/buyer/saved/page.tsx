import type { Metadata } from "next";
import SavedItemsClient from "./SavedItemsClient";
import { PageHeader } from "@/components/ui/Card";

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
    <main className="min-h-screen bg-[var(--surface-2)]">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PageHeader
          title="Saved Items"
          description="Listings you saved for later. Remove anytime or open a product to contact the seller."
        />
        <SavedItemsClient />
      </section>
    </main>
  );
}
