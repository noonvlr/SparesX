import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Prohibited Items Policy",
  description: "Items and listings that are not allowed on SparesX.",
};

export default function ProhibitedItemsPage() {
  return (
    <LegalPage title="Prohibited Items Policy" updated="28 July 2026">
      <p>You may not list or sell:</p>
      <ul className="list-disc pl-5 space-y-2 mt-3">
        <li>Stolen devices or parts</li>
        <li>Counterfeit or falsely branded parts</li>
        <li>IMEI-locked or blacklisted devices presented as clean</li>
        <li>Illegal goods under Indian law</li>
        <li>Items you do not have the right to sell</li>
        <li>Dangerous or hazardous materials without lawful compliance</li>
      </ul>
      <p className="mt-3">
        SparesX may remove prohibited listings and suspend accounts without
        notice when required for safety or legal compliance.
      </p>
    </LegalPage>
  );
}
