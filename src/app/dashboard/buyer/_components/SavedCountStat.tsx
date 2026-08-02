"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SavedCountStat() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setTotal(0);
        return;
      }
      try {
        const res = await fetch("/api/saved?count=1", {
          headers: { Authorization: `Bearer ${token}` },
        });
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
    <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-green-700">Saved Items</p>
        <div className="p-2 bg-green-200 rounded-lg">
          <svg
            className="w-5 h-5 text-green-700"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
          </svg>
        </div>
      </div>
      <p className="text-3xl font-bold text-green-900">
        {total === null ? "—" : total}
      </p>
      <p className="text-xs text-green-600 mt-2">
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
