import type { Metadata } from "next";
import Link from "next/link";
import SavedCountStat from "./_components/SavedCountStat";
import { Card } from "@/components/ui/Card";
import { DashboardPage } from "@/components/layout";

export const metadata: Metadata = {
  title: "Buyer Dashboard - SparesX",
  description: "Track your enquiries, requests, and saved parts on SparesX.",
  openGraph: {
    title: "Buyer Dashboard - SparesX",
    description: "Track your enquiries, requests, and saved parts on SparesX.",
    type: "website",
  },
};

const QUICK_LINKS = [
  {
    href: "/dashboard/buyer/requests",
    label: "My Requests",
    desc: "Review requests you have submitted for specific parts.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    ),
  },
  {
    href: "/dashboard/buyer/enquiries",
    label: "Enquiries",
    desc: "Track conversations and offers from sellers.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    ),
  },
  {
    href: "/dashboard/buyer/saved",
    label: "Saved Parts",
    desc: "Quickly revisit listings you saved.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z"
      />
    ),
  },
  {
    href: "/dashboard/buyer/profile",
    label: "Profile",
    desc: "Update contact details for faster responses.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    ),
  },
];

export default function BuyerDashboardPage() {
  return (
    <DashboardPage
      title="Buyer Dashboard"
      description="Manage your enquiries, requests, and saved parts."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {QUICK_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card hover className="p-6 h-full">
              <div className="w-12 h-12 rounded-[var(--radius)] bg-[var(--brand-soft)] flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-[var(--brand)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {item.icon}
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">
                {item.label}
              </h3>
              <p className="text-sm text-[var(--muted)]">{item.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-8">
        <h2 className="text-2xl font-semibold text-[var(--ink)] mb-6">
          Quick Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-[var(--radius)] bg-[var(--brand-soft)] border border-[var(--border)] hover:shadow-[var(--shadow-sm)] transition">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[var(--brand-hover)]">
                Active Requests
              </p>
              <div className="p-2 bg-[var(--brand-muted)] rounded-[var(--radius-sm)]">
                <svg
                  className="w-5 h-5 text-[var(--brand-hover)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 1 1 0 100 2H3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V6a1 1 0 00-1-1h-3a1 1 0 100 2h2v11H4V5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-semibold text-[var(--ink)]">0</p>
            <p className="text-xs text-[var(--brand-hover)] mt-2">No pending requests</p>
          </div>

          <SavedCountStat />

          <div className="p-5 rounded-[var(--radius)] bg-[var(--surface-3)] border border-[var(--border)] hover:shadow-[var(--shadow-sm)] transition">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[var(--ink-secondary)]">
                Open Chats
              </p>
              <div className="p-2 bg-[var(--border)] rounded-[var(--radius-sm)]">
                <svg
                  className="w-5 h-5 text-[var(--ink-secondary)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-semibold text-[var(--ink)]">0</p>
            <p className="text-xs text-[var(--muted)] mt-2">Start enquiries</p>
          </div>
        </div>
      </Card>
    </DashboardPage>
  );
}
