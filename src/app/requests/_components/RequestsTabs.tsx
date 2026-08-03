"use client";

import Link from "next/link";

export default function RequestsTabs({
  active,
}: {
  active: "browse" | "submit" | "mine";
}) {
  const items: { key: typeof active; label: string; href: string }[] = [
    { key: "browse", label: "Browse requests", href: "/requests" },
    { key: "submit", label: "Submit request", href: "/requests?tab=submit" },
    { key: "mine", label: "My requests", href: "/requests?tab=mine" },
  ];

  return (
    <div className="inline-flex rounded-[var(--radius-lg)] bg-[var(--surface)]/90 backdrop-blur border border-[var(--border)] p-1.5 shadow-[var(--shadow-sm)] overflow-x-auto max-w-full">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          scroll={false}
          prefetch
          className={`px-3 sm:px-4 py-2.5 rounded-[var(--radius)] text-xs sm:text-sm font-semibold transition-all duration-[var(--duration-normal)] whitespace-nowrap ${
            active === item.key
              ? "bg-[var(--brand)] text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] scale-[1.02]"
              : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
