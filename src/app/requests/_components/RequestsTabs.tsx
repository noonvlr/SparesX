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
    <div className="inline-flex rounded-2xl bg-white/90 backdrop-blur border border-gray-200 p-1.5 shadow-sm overflow-x-auto max-w-full">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          scroll={false}
          prefetch
          className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
            active === item.key
              ? "bg-blue-600 text-white shadow-md scale-[1.02]"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
