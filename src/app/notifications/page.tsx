"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardPage } from "@/components/layout";
import { Card, EmptyState, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/feedback";
import { authFetch } from "@/lib/auth/clientAuth";

type Notif = {
  _id: string;
  type: string;
  title: string;
  body: string;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/api/notifications?limit=40");
      if (res.status === 401) {
        setError("Please log in to view notifications");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load");
        return;
      }
      setItems(data.items || []);
      setError("");
    } catch {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAllRead() {
    setMarking(true);
    try {
      await authFetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setItems((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
      );
      window.dispatchEvent(
        new CustomEvent("sparesx-notifications-updated", {
          detail: { unreadCount: 0 },
        }),
      );
    } finally {
      setMarking(false);
    }
  }

  if (loading) {
    return (
      <DashboardPage>
        <LoadingState label="Loading notifications…" />
      </DashboardPage>
    );
  }

  if (error && items.length === 0) {
    return (
      <DashboardPage>
        <ErrorState title="Notifications" description={error} />
      </DashboardPage>
    );
  }

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <DashboardPage
      title="Notifications"
      description="WhatsApp requests, chat alerts, and marketplace updates"
      actions={
        unread > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={marking}
            onClick={() => void markAllRead()}
          >
            Mark all read
          </Button>
        ) : null
      }
    >
      {items.length === 0 ? (
        <Card>
          <EmptyState
            title="No notifications yet"
            description="Approvals, WhatsApp requests, and important updates will show up here."
          />
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const content = (
              <div
                className={`rounded-[var(--radius-lg)] border px-4 py-3 transition-colors ${
                  n.readAt
                    ? "border-[var(--border)] bg-[var(--surface)]"
                    : "border-[var(--brand-muted)] bg-[var(--brand-soft)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--ink-secondary)]">
                      {n.body}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">
                      {new Date(n.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  {!n.readAt ? (
                    <Badge tone="brand" className="shrink-0">
                      New
                    </Badge>
                  ) : null}
                </div>
              </div>
            );

            return (
              <li key={n._id}>
                {n.href ? (
                  <Link href={n.href} className="block hover:opacity-95">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPage>
  );
}
