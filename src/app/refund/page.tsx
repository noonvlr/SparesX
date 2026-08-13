import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "SparesX does not process payments; refunds and cancellations are between buyers and sellers.",
  alternates: { canonical: "/refund" },
  robots: { index: true, follow: true },
};

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="3 August 2026">
      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Current Policy</h2>
        <p>
          SparesX does not collect payments or process orders on behalf of any
          user. Accordingly:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>SparesX does not issue refunds.</li>
          <li>SparesX does not process cancellations.</li>
          <li>
            All payment, delivery, and cancellation arrangements are made
            directly between the buyer and seller.
          </li>
        </ul>
        <p className="mt-2">
          Users are strongly encouraged to agree on payment terms, delivery
          timelines, and return conditions in writing before completing any
          transaction.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          Future Platform Fees
        </h2>
        <p>
          Should SparesX introduce paid subscriptions, listing fees, or other
          platform charges in the future, an applicable refund and cancellation
          policy for such charges will be published and made available prior to
          those services becoming chargeable.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Contact</h2>
        <p>
          For questions regarding this Policy, contact{" "}
          <a href="mailto:noon.vlr@gmail.com">noon.vlr@gmail.com</a> or{" "}
          <a href="tel:8015606071">8015606071</a>.
        </p>
      </section>
    </LegalPage>
  );
}
