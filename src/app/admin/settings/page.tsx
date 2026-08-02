import Link from "next/link";
import { AdminPage } from "@/components/layout";
import { Card, PageHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

const CONTROLS = [
  {
    href: "/admin/dashboard",
    title: "Dashboard",
    desc: "Platform overview and pending work",
  },
  {
    href: "/admin/products",
    title: "Products",
    desc: "Approve, reject, feature, edit, or delete listings",
  },
  {
    href: "/admin/requests",
    title: "Requests",
    desc: "Manage spare part requests and statuses",
  },
  {
    href: "/admin/users",
    title: "Users",
    desc: "Create accounts, change roles, block, reset passwords",
  },
  {
    href: "/admin/device-management",
    title: "Device management",
    desc: "Device types, brands, models, and part categories",
  },
  {
    href: "/admin/categories",
    title: "Categories",
    desc: "Part category catalog controls",
  },
  {
    href: "/admin/support",
    title: "Support inbox",
    desc: "Reply to user support tickets",
  },
  {
    href: "/admin/chat",
    title: "Chat disputes",
    desc: "Read user chats for dispute and policy review",
  },
  {
    href: "/admin/reports",
    title: "Reports",
    desc: "Counts across users, products, chats, and support",
  },
  {
    href: "/admin/site-settings",
    title: "Site settings",
    desc: "SMS provider (Twilio/MSG91), credentials, and email OTP SMTP",
  },
];

export default function AdminSettingsPage() {
  return (
    <AdminPage>
      <PageHeader
        title="Admin control center"
        description="All platform controls in one place. Environment secrets stay in Vercel project settings."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {CONTROLS.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card
              hover
              padding="md"
              className="hover:border-[var(--brand-muted)]"
            >
              <p className="font-semibold text-[var(--ink)]">{item.title}</p>
              <p className="text-sm text-[var(--muted)] mt-1">{item.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Alert tone="warning" title="Chat access policy">
        Chat dispute tools are for conflict review and safety only. Prefer
        support tickets for normal user issues, and only open private chats
        when a dispute requires evidence.
      </Alert>
    </AdminPage>
  );
}
