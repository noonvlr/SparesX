"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/20",
  in_progress:
    "bg-[var(--brand-soft)] text-[var(--brand-hover)] border-[var(--brand-muted)]",
  waiting_user:
    "bg-[var(--info-soft)] text-[var(--info)] border-[var(--info)]/20",
  resolved: "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/20",
  closed: "bg-[var(--surface-3)] text-[var(--muted)] border-[var(--border)]",
};

type CaseRow = {
  _id: string;
  caseNumber?: string;
  kindLabel?: string;
  subject: string;
  status: string;
  statusLabel?: string;
  createdAt: string;
  updatedAt: string;
  userUnread?: boolean;
};

export default function SupportCasesPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedInClient()) {
      router.replace("/login?next=/support/cases");
      return;
    }
    authFetch("/api/support")
      .then((r) => r.json())
      .then((data) => setTickets(data.tickets || []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="min-h-screen bg-[var(--surface-2)] py-8 sm:py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Your support cases"
          description="Track reports and support requests you’ve submitted."
          actions={
            <Link href="/support">
              <Button type="button" size="sm">
                New request
              </Button>
            </Link>
          }
        />
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-[var(--muted)]">Loading…</p>
          ) : tickets.length === 0 ? (
            <p className="p-6 text-sm text-[var(--muted)]">
              No support cases yet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {tickets.map((t) => (
                <li key={t._id}>
                  <Link
                    href={`/support/cases/${t._id}`}
                    className="block p-4 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--ink)]">
                          {t.caseNumber ? `${t.caseNumber} · ` : ""}
                          {t.subject}
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-1">
                          {t.kindLabel || "Support"} ·{" "}
                          {new Date(t.createdAt).toLocaleString("en-IN")}
                          {t.userUnread ? " · New reply" : ""}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                          STATUS_STYLE[t.status] || STATUS_STYLE.open
                        }`}
                      >
                        {t.statusLabel || t.status.replace("_", " ")}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
