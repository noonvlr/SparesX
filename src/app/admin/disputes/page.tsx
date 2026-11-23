import type { Metadata } from "next";
import Link from "next/link";
import { AdminPage } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { AdminPageHeader } from "@/components/admin/AdminPageChrome";

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
    <AdminPage>
      <AdminPageHeader
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
      />

      <ol className="space-y-3">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <Card padding="md">
              <p className="text-sm font-semibold text-[var(--ink)]">
                <span className="mr-2 text-[var(--muted)]">{i + 1}.</span>
                {step.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                {step.body}
              </p>
            </Card>
          </li>
        ))}
      </ol>
    </AdminPage>
  );
}
