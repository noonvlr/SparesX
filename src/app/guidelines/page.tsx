import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description: "Rules for respectful and lawful behavior on SparesX.",
};

export default function CommunityGuidelinesPage() {
  return (
    <LegalPage title="Community Guidelines" updated="3 August 2026">
      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Expectations</h2>
        <p>
          SparesX is a platform for mobile and device spare parts commerce across
          India. All users are expected to conduct themselves professionally,
          honestly, and respectfully.
        </p>
        <p className="mt-2">Users must:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Communicate clearly and in good faith</li>
          <li>
            Refrain from harassment, threats, or discriminatory conduct toward
            any user
          </li>
          <li>Refrain from spamming chats, listings, or part requests</li>
          <li>
            Refrain from sharing another user&apos;s private contact information
            without consent
          </li>
          <li>Report suspected scams or abuse to Support promptly</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Enforcement</h2>
        <p>
          Violation of these Guidelines may result in listing removal, restriction
          of messaging privileges, or suspension or termination of account access,
          at SparesX&apos;s discretion.
        </p>
      </section>
    </LegalPage>
  );
}
