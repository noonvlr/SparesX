import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Dispute Resolution Policy",
  description: "How SparesX handles complaints and disputes between users.",
  alternates: { canonical: "/disputes" },
  robots: { index: true, follow: true },
};

export default function DisputeResolutionPage() {
  return (
    <LegalPage title="Dispute Resolution Policy" updated="3 August 2026">
      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Overview</h2>
        <p>
          SparesX is a platform that connects buyers and sellers and does not
          process payments or act as a party to any transaction. Commercial
          disputes should, in the first instance, be resolved directly between the
          buyer and seller.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Process</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Contact the other party through the in-app chat or an agreed
            communication channel.
          </li>
          <li>
            If unresolved, raise a Support ticket, including the listing link,
            relevant screenshots, and chat excerpts.
          </li>
          <li>
            Our team will review the submitted evidence for policy violations or
            safety concerns and aim to respond within 3–5 business days.
          </li>
          <li>
            Where warranted, SparesX may warn, suspend, or remove the relevant
            user or listing. SparesX does not guarantee recovery of funds or
            resolution of payment disputes, as it is not a party to the
            underlying transaction.
          </li>
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          Grievance Officer / Escalation Contact
        </h2>
        <p>Syed Idrees, Noon Computers</p>
        <p className="mt-1">
          No. 57, 2nd Floor, M.P. Sarathy Mansion, Anna Salai, Vellore, Tamil
          Nadu, India
        </p>
        <p className="mt-1">
          Phone: <a href="tel:8015606071">8015606071</a>
          {" | "}
          Email:{" "}
          <a href="mailto:noon.vlr@gmail.com">noon.vlr@gmail.com</a>
        </p>
      </section>
    </LegalPage>
  );
}
