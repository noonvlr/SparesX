import Link from "next/link";
import type { Metadata } from "next";
import DashboardStats from "./_components/DashboardStats";
import DemandMatches from "./_components/DemandMatches";
import { Card } from "@/components/ui/Card";
import { DashboardPage } from "@/components/layout";

export const metadata: Metadata = {
  title: "Technician Dashboard - SparesX",
  description: "Manage your spare part listings and profile on SparesX.",
};

const QUICK_LINKS = [
  {
    href: "/technician/products",
    label: "My Products",
    cta: "View",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    ),
  },
  {
    href: "/messages",
    label: "Messages",
    cta: "Inbox",
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
    href: "/technician/products/new",
    label: "Add Product",
    cta: "Create",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    ),
  },
  {
    href: "/technician/profile",
    label: "Profile",
    cta: "Edit",
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

const TIPS = [
  {
    n: 1,
    title: "Add High-Quality Photos",
    desc: "Clear images help buyers decide faster and increase inquiries.",
  },
  {
    n: 2,
    title: "Be Responsive",
    desc: "Reply to enquiries quickly to build trust and close deals.",
  },
  {
    n: 3,
    title: "Competitive Pricing",
    desc: "Research market prices to ensure your listings are competitive.",
  },
  {
    n: 4,
    title: "Detailed Descriptions",
    desc: "Clear details about condition, specs, and compatibility matter.",
  },
];

export default function TechnicianDashboard() {
  return (
    <DashboardPage
      title="Technician Dashboard"
      description="Manage your spare part listings and seller profile."
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {QUICK_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card
              hover
              className="p-3 md:p-4 h-full transition-colors duration-200 hover:border-[var(--brand-muted)]"
            >
              <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--brand-soft)] flex items-center justify-center mb-2">
                <svg
                  className="w-5 h-5 text-[var(--brand)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {item.icon}
                </svg>
              </div>
              <h3 className="text-sm md:text-base font-semibold text-[var(--ink)] mb-2">
                {item.label}
              </h3>
              <div className="pt-2 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--brand)] font-semibold flex items-center gap-1">
                  {item.cta} <span>→</span>
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <DashboardStats />

      <DemandMatches />

      <Card className="hidden md:block p-8">
        <h3 className="text-xl font-semibold text-[var(--ink)] mb-6">
          Quick Tips to Boost Sales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TIPS.map((tip) => (
            <div key={tip.n} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--brand-soft)] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[var(--brand-hover)]">
                {tip.n}
              </div>
              <div>
                <p className="font-semibold text-[var(--ink)]">
                  {tip.title}
                </p>
                <p className="text-sm text-[var(--muted)] mt-1">
                  {tip.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </DashboardPage>
  );
}
