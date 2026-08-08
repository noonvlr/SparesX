"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/auth/clientAuth";

export default function SavedCountStat() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch("/api/saved?count=1");
        const data = await res.json();
        if (res.ok) setTotal(typeof data.total === "number" ? data.total : 0);
        else setTotal(0);
      } catch {
        setTotal(0);
      }
    };

    load();
    const onChanged = () => load();
    window.addEventListener("sparesx-saved-changed", onChanged);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("sparesx-saved-changed", onChanged);
      window.removeEventListener("focus", load);
    };
  }, []);

  return (
    <div className="p-5 rounded-[var(--radius)] bg-[var(--success-soft)] border border-[var(--border)] hover:shadow-[var(--shadow-sm)] transition">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[var(--success)]">Saved Items</p>
        <div className="p-2 bg-[var(--success)]/15 rounded-[var(--radius-sm)]">
          <svg
            className="w-5 h-5 text-[var(--success)]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
          </svg>
        </div>
      </div>
      <p className="text-3xl font-semibold text-[var(--ink)]">
        {total === null ? "—" : total}
      </p>
      <p className="text-xs text-[var(--success)] mt-2">
        {total && total > 0 ? (
          <Link href="/dashboard/buyer/saved" className="underline hover:no-underline">
            View saved items
          </Link>
        ) : (
          "Start saving parts"
        )}
      </p>
    </div>
  );
}
