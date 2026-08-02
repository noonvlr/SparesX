import type { Metadata } from "next";
import SavedItemsClient from "./SavedItemsClient";
import { DashboardPage } from "@/components/layout";

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
    <DashboardPage
      title="Saved Items"
      description="Listings you saved for later. Remove anytime or open a product to contact the seller."
    >
      <SavedItemsClient />
    </DashboardPage>
  );
}
