import type { Metadata } from "next";
import Link from "next/link";
import { DashboardPage } from "@/components/layout";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Dispute SOP",
  robots: { index: false, follow: false },
};

const STEPS = [
  {
    title: "Prefer Support tickets first",
    body: "Ask the user to open /support (abuse type) with links and screenshots. Tickets create an audit trail for both sides.",
  },
  {
    title: "When to open Chat disputes",
    body: "Use /admin/chat only when a ticket needs message context (harassment, scam negotiation, impersonation). Prefer conversation IDs from the ticket.",
  },
  {
    title: "Evidence checklist",
    body: "Capture listing URL, user IDs, timestamps, and relevant message excerpts. Do not share private chats with unrelated third parties.",
  },
  {
    title: "Warn → restrict → block",
    body: "For first soft issues: reply via Support. For clear abuse or fraud: block the account (bumps session + revokes refresh). Remove fraudulent listings.",
  },
  {
    title: "Privacy note for users",
    body: "SparesX may review chats when a dispute or abuse report requires it. Staff should access only what is needed to resolve the case.",
  },
];

export default function AdminDisputeSopPage() {
  return (
    <DashboardPage
      title="Dispute SOP"
      description="Internal checklist for chat and abuse disputes. Not legal advice — counsel review still required for public policies."
      actions={
        <Link
          href="/admin/chat"
          className="text-sm font-semibold text-[var(--brand)] hover:underline"
        >
          Open chat disputes →
        </Link>
      }
    >
      <div className="space-y-3 max-w-3xl">
        {STEPS.map((step, i) => (
          <Card key={step.title} className="p-5">
            <h2 className="text-base font-semibold text-[var(--ink)] mb-1">
              {i + 1}. {step.title}
            </h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {step.body}
            </p>
          </Card>
        ))}
      </div>
    </DashboardPage>
  );
}
