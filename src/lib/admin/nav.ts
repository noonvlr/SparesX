/**
 * Single source of truth for admin information architecture.
 * Used by sidebar, mobile drawer, dashboard, breadcrumbs, and control center.
 */

export type AdminNavIcon =
  | "dashboard"
  | "users"
  | "listings"
  | "requests"
  | "support"
  | "devices"
  | "categories"
  | "chat"
  | "broadcast"
  | "ads"
  | "updates"
  | "reports"
  | "settings"
  | "disputes"
  | "tools";

export type AdminNavItem = {
  href: string;
  label: string;
  /** Short helper under the label in directory views */
  desc: string;
  icon: AdminNavIcon;
  /** Highlight in "needs attention" when this badge key is > 0 */
  badgeKey?: "support";
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

/** Primary destinations (mobile quick strip). */
export const ADMIN_PRIMARY: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    desc: "Overview and pending work",
    icon: "dashboard",
  },
  {
    href: "/admin/users",
    label: "Users",
    desc: "Accounts, roles, and blocks",
    icon: "users",
  },
  {
    href: "/admin/products",
    label: "Listings",
    desc: "Approve, feature, and edit products",
    icon: "listings",
  },
  {
    href: "/admin/support",
    label: "Support",
    desc: "Ticket inbox",
    icon: "support",
    badgeKey: "support",
  },
];

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        desc: "Marketplace health and pending work",
        icon: "dashboard",
      },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    items: [
      {
        href: "/admin/products",
        label: "Listings",
        desc: "Approve, edit, feature, delete",
        icon: "listings",
      },
      {
        href: "/admin/requests",
        label: "Requests",
        desc: "Fulfill or close part requests",
        icon: "requests",
      },
      {
        href: "/admin/categories",
        label: "Categories",
        desc: "Part category catalog",
        icon: "categories",
      },
      {
        href: "/admin/device-management",
        label: "Devices",
        desc: "Types, brands, models, parts",
        icon: "devices",
      },
    ],
  },
  {
    id: "users",
    label: "Users & community",
    items: [
      {
        href: "/admin/users",
        label: "Users",
        desc: "Create, block, reset passwords",
        icon: "users",
      },
      {
        href: "/admin/support",
        label: "Support",
        desc: "Reply to tickets",
        icon: "support",
        badgeKey: "support",
      },
      {
        href: "/admin/chat",
        label: "Chat disputes",
        desc: "Read chats for conflict review",
        icon: "chat",
      },
    ],
  },
  {
    id: "ads",
    label: "Advertising",
    items: [
      {
        href: "/admin/ads",
        label: "Ads",
        desc: "Placements, campaigns, promos",
        icon: "ads",
      },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    items: [
      {
        href: "/admin/broadcast",
        label: "Broadcast",
        desc: "Targeted bulk messaging",
        icon: "broadcast",
      },
      {
        href: "/admin/updates",
        label: "Site updates",
        desc: "Changelog and bug thanks",
        icon: "updates",
      },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      {
        href: "/admin/reports",
        label: "Reports",
        desc: "Visitors and platform counts",
        icon: "reports",
      },
      {
        href: "/admin/site-settings",
        label: "Site settings",
        desc: "SMS, OTP, and email credentials",
        icon: "settings",
      },
      {
        href: "/admin/disputes",
        label: "Dispute SOP",
        desc: "Policy notes for chat disputes",
        icon: "disputes",
      },
      {
        href: "/admin/settings",
        label: "All tools",
        desc: "Full directory of admin pages",
        icon: "tools",
      },
    ],
  },
];

/** Flat unique list (first occurrence wins). */
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
  if (href === "/admin/broadcast") {
    return (
      pathname === "/admin/broadcast" ||
      pathname.startsWith("/admin/broadcast/")
    );
  }
  if (href === "/admin/support") {
    return (
      pathname === "/admin/support" || pathname.startsWith("/admin/support/")
    );
  }
  if (href === "/admin/settings") {
    return pathname === "/admin/settings";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type AdminCrumb = { href?: string; label: string };

/** Resolve breadcrumb trail for an admin pathname. */
export function getAdminBreadcrumbs(pathname: string): AdminCrumb[] {
  const crumbs: AdminCrumb[] = [{ href: "/admin/dashboard", label: "Admin" }];
  if (pathname === "/admin" || pathname === "/admin/dashboard") {
    crumbs.push({ label: "Dashboard" });
    return crumbs;
  }

  const flat = flattenAdminNav();
  const match = flat.find(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  if (match) {
    const group = ADMIN_NAV_GROUPS.find((g) =>
      g.items.some((i) => i.href === match.href),
    );
    if (group && group.id !== "overview") {
      crumbs.push({ label: group.label });
    }
    if (pathname === match.href) {
      crumbs.push({ label: match.label });
    } else {
      crumbs.push({ href: match.href, label: match.label });
      const rest = pathname.slice(match.href.length).split("/").filter(Boolean);
      for (const seg of rest) {
        crumbs.push({
          label: seg
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
        });
      }
    }
    return crumbs;
  }

  crumbs.push({ label: "Page" });
  return crumbs;
}

export function getAdminPageMeta(pathname: string): {
  title: string;
  description?: string;
} {
  if (pathname === "/admin" || pathname === "/admin/dashboard") {
    return {
      title: "Dashboard",
      description: "Overview of marketplace activity and platform performance.",
    };
  }
  const flat = flattenAdminNav();
  const match = flat.find(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (match) {
    return { title: match.label, description: match.desc };
  }
  return { title: "Admin" };
}
