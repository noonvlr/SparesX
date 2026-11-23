/**
 * Single source of truth for admin information architecture.
 * Used by sidebar, mobile More sheet, dashboard, and control center.
 */

export type AdminNavItem = {
  href: string;
  label: string;
  /** Short helper under the label in directory views */
  desc: string;
  /** Highlight in "needs attention" when this badge key is > 0 */
  badgeKey?: "support";
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

/** Primary destinations (desktop top strip + mobile bottom bar companions). */
export const ADMIN_PRIMARY: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    desc: "Overview and pending work",
  },
  {
    href: "/admin/users",
    label: "Users",
    desc: "Accounts, roles, and blocks",
  },
  {
    href: "/admin/products",
    label: "Listings",
    desc: "Approve, feature, and edit products",
  },
  {
    href: "/admin/support",
    label: "Support",
    desc: "Ticket inbox",
    badgeKey: "support",
  },
];

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "operations",
    label: "Operations",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        desc: "Stats and shortcuts",
      },
      {
        href: "/admin/users",
        label: "Users",
        desc: "Create, block, reset passwords",
      },
      {
        href: "/admin/products",
        label: "Listings",
        desc: "Approve, edit, feature, delete",
      },
      {
        href: "/admin/requests",
        label: "Requests",
        desc: "Fulfill or close part requests",
      },
      {
        href: "/admin/support",
        label: "Support",
        desc: "Reply to tickets",
        badgeKey: "support",
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      {
        href: "/admin/device-management",
        label: "Devices",
        desc: "Types, brands, models, parts",
      },
      {
        href: "/admin/categories",
        label: "Categories",
        desc: "Part category catalog",
      },
    ],
  },
  {
    id: "engagement",
    label: "Engagement",
    items: [
      {
        href: "/admin/chat",
        label: "Chat disputes",
        desc: "Read chats for conflict review",
      },
      {
        href: "/admin/broadcast",
        label: "Broadcast",
        desc: "Targeted bulk messaging",
      },
      {
        href: "/admin/ads",
        label: "Ads",
        desc: "Placements, campaigns, promos",
      },
      {
        href: "/admin/updates",
        label: "Site updates",
        desc: "Changelog and bug thanks",
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      {
        href: "/admin/reports",
        label: "Reports",
        desc: "Visitors and platform counts",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        href: "/admin/site-settings",
        label: "Site settings",
        desc: "SMS, OTP, and email credentials",
      },
      {
        href: "/admin/disputes",
        label: "Dispute SOP",
        desc: "Policy notes for chat disputes",
      },
      {
        href: "/admin/settings",
        label: "All tools",
        desc: "Full directory of admin pages",
      },
    ],
  },
];

/** Flat unique list (first occurrence wins) for search / completeness checks. */
export function flattenAdminNav(): AdminNavItem[] {
  const seen = new Set<string>();
  const out: AdminNavItem[] = [];
  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      if (seen.has(item.href)) continue;
      seen.add(item.href);
      out.push(item);
    }
  }
  return out;
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin/dashboard") {
    return pathname === "/admin" || pathname === "/admin/dashboard";
  }
  if (href === "/admin/ads") {
    return pathname === "/admin/ads" || pathname.startsWith("/admin/ads/");
  }
  if (href === "/admin/settings") {
    return pathname === "/admin/settings";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
