"use client";

import { useRouter } from "next/navigation";

export default function RequestsTabs({
  active,
}: {
  active: "browse" | "submit" | "mine";
}) {
  const router = useRouter();
  const btn = (key: typeof active, label: string, href: string) => (
    <button
      type="button"
      onClick={() => router.replace(href)}
      className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
        active === key
          ? "bg-blue-600 text-white shadow-md scale-[1.02]"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="inline-flex rounded-2xl bg-white/90 backdrop-blur border border-gray-200 p-1.5 shadow-sm overflow-x-auto max-w-full">
      {btn("browse", "Browse requests", "/requests")}
      {btn("submit", "Submit request", "/requests?tab=submit")}
      {btn("mine", "My requests", "/requests/mine")}
    </div>
  );
}
