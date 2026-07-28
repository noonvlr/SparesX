import Link from "next/link";

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
];

export default function AdminSettingsPage() {
  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Admin control center</h1>
      <p className="text-gray-600 text-sm mb-8">
        All platform controls in one place. Environment secrets stay in Vercel
        project settings.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {CONTROLS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow transition"
          >
            <p className="font-semibold text-gray-900">{item.title}</p>
            <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-900">
        <p className="font-semibold mb-1">Chat access policy</p>
        <p>
          Chat dispute tools are for conflict review and safety only. Prefer
          support tickets for normal user issues, and only open private chats
          when a dispute requires evidence.
        </p>
      </div>
    </main>
  );
}
