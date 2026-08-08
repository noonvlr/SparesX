"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/auth/clientAuth";
import { showToast } from "@/components/ToastHost";
import { Button } from "@/components/ui/Button";

type BlockedUser = { _id: string; name: string };

/** Manage peer blocks (unblock) from profile security. */
export default function BlockedUsersPanel() {
  const [items, setItems] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/api/chat/block");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setItems(Array.isArray(data.blockedUsers) ? data.blockedUsers : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function unblock(userId: string) {
    setBusyId(userId);
    try {
      const res = await authFetch("/api/chat/block", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || "Could not unblock", "error");
        return;
      }
      setItems((prev) => prev.filter((u) => u._id !== userId));
      showToast("User unblocked");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading blocked users…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No blocked users. You can block someone from a chat window.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((u) => (
        <li
          key={u._id}
          className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
        >
          <Link
            href={`/u/${u._id}`}
            className="text-sm font-medium text-[var(--ink)] hover:underline truncate"
          >
            {u.name}
          </Link>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busyId === u._id}
            onClick={() => void unblock(u._id)}
          >
            {busyId === u._id ? "…" : "Unblock"}
          </Button>
        </li>
      ))}
    </ul>
  );
}
