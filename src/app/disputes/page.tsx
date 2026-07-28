import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Dispute Resolution Policy",
  description: "How SparesX handles complaints and disputes between users.",
};

export default function DisputeResolutionPage() {
  return (
    <LegalPage title="Dispute Resolution Policy" updated="28 July 2026">
      <p>
        SparesX is a connection platform and does not process payments. Most
        commercial disputes should first be resolved directly between buyer and
        seller.
      </p>
      <ol className="list-decimal pl-5 space-y-2 mt-3">
        <li>Contact the other party via in-app chat or agreed channel.</li>
        <li>
          If unresolved, open a Support ticket with evidence (listing link,
          screenshots, chat excerpts).
        </li>
        <li>
          Admins may review chats and listings for policy violations or safety
          issues.
        </li>
        <li>
          SparesX may warn, suspend, or remove users/listings but does not
          guarantee refunds or payment recovery.
        </li>
      </ol>
    </LegalPage>
  );
}
