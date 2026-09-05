import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Technician Guidelines",
  description:
    "Listing standards and communication expectations for SparesX technicians.",
  alternates: { canonical: "/technician-guidelines" },
  robots: { index: true, follow: true },
};

export default function TechnicianGuidelinesPage() {
  return (
    <LegalPage title="Technician Guidelines" updated="3 August 2026">
      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          Technician Expectations
        </h2>
        <p>Technicians on SparesX are expected to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Use clear, accurate titles, prices, and condition labels</li>
          <li>Upload genuine photographs of the actual item being sold</li>
          <li>
            Honestly disclose defects, compatibility limitations, and warranty
            status
          </li>
          <li>Respond to buyer enquiries within a reasonable time</li>
          <li>
            Agree on payment and delivery terms with the buyer before completing
            any transaction
          </li>
          <li>
            Refrain from representing SparesX as the seller of, or a party to,
            any transaction
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Eligibility</h2>
        <p>
          Any individual or business located in India may register and list on
          SparesX, subject to these Guidelines, the Terms of Service, and
          applicable Indian law.
        </p>
      </section>
    </LegalPage>
  );
}
