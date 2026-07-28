import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Seller Guidelines",
  description: "Listing standards and communication expectations for SparesX sellers.",
};

export default function SellerGuidelinesPage() {
  return (
    <LegalPage title="Seller Guidelines" updated="28 July 2026">
      <ul className="list-disc pl-5 space-y-2">
        <li>Use clear titles, accurate prices, and honest condition labels.</li>
        <li>Upload real photos of the item you are selling.</li>
        <li>Disclose defects, compatibility, and warranty honestly.</li>
        <li>Respond to buyer enquiries within a reasonable time.</li>
        <li>Agree payment and delivery terms before completing a deal.</li>
        <li>Do not misrepresent SparesX as the seller of your goods.</li>
      </ul>
      <p className="mt-3">
        Anyone in India can register and sell on SparesX, provided they follow
        these guidelines and Indian law.
      </p>
    </LegalPage>
  );
}
