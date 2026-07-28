import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Report Abuse Policy",
  description: "How to report scams, fraud, or inappropriate content on SparesX.",
};

export default function ReportAbusePage() {
  return (
    <LegalPage title="Report Abuse Policy" updated="28 July 2026">
      <p>Report the following through Support:</p>
      <ul className="list-disc pl-5 space-y-2 mt-3">
        <li>Scams or fraudulent listings</li>
        <li>Harassment or threats</li>
        <li>Counterfeit or stolen goods</li>
        <li>Spam or abusive messages</li>
        <li>Impersonation or fake accounts</li>
      </ul>
      <p className="mt-3">
        Include links, screenshots, and user names where possible. False reports
        made in bad faith may also lead to enforcement action.
      </p>
    </LegalPage>
  );
}
