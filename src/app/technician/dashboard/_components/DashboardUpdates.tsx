"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";

type UpdateRow = {
  _id: string;
  line: string;
  kind: string;
};

/**
 * Compact dated feed of site updates (features, fixes, bug thanks).
 * Dashboard-only — never mounted on the public homepage.
 */
export default function DashboardUpdates() {
  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedInClient()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/updates?limit=8");
        const data = await res.json();
        if (!cancelled && res.ok) {
          setUpdates(data.updates || []);
        }
      } catch {
        if (!cancelled) setUpdates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card className="p-5 mb-6 md:mb-8">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Spinner size="sm" /> Loading updates…
        </div>
      </Card>
    );
  }

  if (updates.length === 0) return null;

  return (
    <Card className="p-5 md:p-6 mb-6 md:mb-8">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h3 className="text-lg md:text-xl font-semibold text-[var(--ink)]">
          Updates
        </h3>
        <p className="text-xs text-[var(--muted)]">Newest first</p>
      </div>
      <ul className="space-y-3">
        {updates.map((u) => (
          <li
            key={u._id}
            className="text-sm text-[var(--ink-secondary)] leading-relaxed border-l-2 border-[var(--brand-muted)] pl-3"
          >
            {u.line}
          </li>
        ))}
      </ul>
    </Card>
  );
}
