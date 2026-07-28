import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "SparesX does not process payments; refunds and cancellations are between buyers and sellers.",
  robots: { index: true, follow: true },
};

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="28 July 2026">
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Current Policy</h2>
        <p>SparesX does not collect payments or process orders.</p>
        <p className="mt-2">Accordingly:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>SparesX does not issue refunds.</li>
          <li>SparesX does not process cancellations.</li>
          <li>Payment arrangements are made directly between buyers and sellers.</li>
        </ul>
        <p className="mt-2">
          Buyers and sellers are encouraged to agree on payment, delivery,
          returns, and cancellations before completing any transaction.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Platform Fees</h2>
        <p>
          If SparesX introduces paid subscriptions, listing fees, or other
          platform charges in the future, the applicable refund terms will be
          published and updated before those services become available.
        </p>
      </section>
    </LegalPage>
  );
}
