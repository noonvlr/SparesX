import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Prohibited Items Policy",
  description: "Items and listings that are not allowed on SparesX.",
  alternates: { canonical: "/prohibited-items" },
  robots: { index: true, follow: true },
};

export default function ProhibitedItemsPage() {
  return (
    <LegalPage title="Prohibited Items Policy" updated="3 August 2026">
      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          Prohibited Listings
        </h2>
        <p>The following may not be listed or sold on SparesX:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Stolen devices or parts</li>
          <li>Counterfeit or falsely branded parts</li>
          <li>
            IMEI-locked or blacklisted devices represented as unlocked or clean
          </li>
          <li>Goods that are illegal to sell under Indian law</li>
          <li>Items the seller does not hold the legal right to sell</li>
          <li>
            Hazardous or dangerous materials, unless in compliance with
            applicable law
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Enforcement</h2>
        <p>
          SparesX reserves the right to remove any listing that violates this
          Policy and to suspend the associated account, with or without prior
          notice, where necessary for safety, security, or legal compliance.
        </p>
      </section>
    </LegalPage>
  );
}
