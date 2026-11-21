"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui/cn";

const LINKS: Array<{ href: string; label: string; exact?: boolean }> = [
  { href: "/admin/ads", label: "Overview", exact: true },
  { href: "/admin/ads/campaigns", label: "Campaigns" },
  { href: "/admin/ads/placements", label: "Placements" },
];

export default function AdsSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Ads management"
      className="mb-6 flex flex-wrap gap-1 border-b border-[var(--border)] pb-px"
    >
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-[var(--brand)] text-[var(--brand)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
