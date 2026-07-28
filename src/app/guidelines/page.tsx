import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description: "Rules for respectful and lawful behavior on SparesX.",
};

export default function CommunityGuidelinesPage() {
  return (
    <LegalPage title="Community Guidelines" updated="28 July 2026">
      <p>
        SparesX is a marketplace for mobile and device spare parts in India. Be
        professional, honest, and respectful in all interactions.
      </p>
      <ul className="list-disc pl-5 space-y-2 mt-3">
        <li>Communicate clearly and respond in good faith.</li>
        <li>Do not harass, threaten, or discriminate against other users.</li>
        <li>Do not spam chats, listings, or requests.</li>
        <li>Do not share others&apos; private contact details without consent.</li>
        <li>Report scams and abuse through Support promptly.</li>
      </ul>
      <p className="mt-3">
        Violations may lead to listing removal, chat restrictions, or account
        suspension.
      </p>
    </LegalPage>
  );
}
