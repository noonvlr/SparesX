"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";
import { SupportCaseForm } from "@/components/support/SupportCaseForm";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/20",
  in_progress:
    "bg-[var(--brand-soft)] text-[var(--brand-hover)] border-[var(--brand-muted)]",
  waiting_user:
    "bg-[var(--info-soft)] text-[var(--info)] border-[var(--info)]/20",
  resolved: "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/20",
  closed: "bg-[var(--surface-3)] text-[var(--muted)] border-[var(--border)]",
};

function SupportPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reporter, setReporter] = useState<{ name: string; email: string } | null>(
    null,
  );

  useEffect(() => {
    const type = searchParams.get("type");
    const productId = searchParams.get("productId");
    const reportedUserId = searchParams.get("reportedUserId");
    const messageId = searchParams.get("messageId");
    const conversationId = searchParams.get("conversationId");
    const isReport =
      type === "product" ||
      type === "user" ||
      type === "message" ||
      !!productId ||
      !!reportedUserId ||
      !!messageId;
    if (isReport) {
      const params = new URLSearchParams();
      if (type === "product" || type === "user" || type === "message") {
        params.set("type", type);
      } else if (messageId) params.set("type", "message");
      else if (productId) params.set("type", "product");
      else params.set("type", "user");
      if (productId) params.set("productId", productId);
      if (reportedUserId) params.set("reportedUserId", reportedUserId);
      if (messageId) params.set("messageId", messageId);
      if (conversationId) params.set("conversationId", conversationId);
      if (type === "product" && !productId && searchParams.get("id")) {
        params.set("id", searchParams.get("id") || "");
      }
      router.replace(`/support/report?${params.toString()}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!isLoggedInClient()) {
      setIsAuthenticated(false);
      setAuthChecked(true);
      setLoading(false);
      return;
    }
    setIsAuthenticated(true);
    setAuthChecked(true);
    authFetch("/api/support")
      .then((r) => r.json())
      .then((data) => setTickets(data.tickets || []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));

    authFetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setReporter({ name: data.user.name, email: data.user.email });
        }
      })
      .catch(() => {});
  }, []);

  if (!authChecked) {
    return (
      <main className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--brand-muted)] border-t-[var(--brand)] rounded-full animate-spin" />
      </main>
    );
  }

  if (!isAuthenticated) {
    const qs = typeof window !== "undefined" ? window.location.search : "";
    const next = `/support${qs}`;
    return (
      <main className="min-h-screen bg-[var(--surface-2)] py-12 px-4">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">
            Contact support
          </h1>
          <p className="text-[var(--muted)] mb-6">
            Login to send a request to the SparesX team. We’ll attach your account
            details automatically.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={() =>
                router.push(`/login?next=${encodeURIComponent(next)}`)
              }
            >
              Login
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                router.push(`/register?next=${encodeURIComponent(next)}`)
              }
            >
              Sign up
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--surface-2)] py-8 sm:py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <PageHeader
          title="Support"
          description="Ask for help or follow up on a case. Product, user, and chat reports keep listing context automatically."
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-3 p-5 sm:p-6 space-y-4">
            {reporter ? (
              <div className="rounded-[var(--radius)] bg-[var(--surface-2)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--ink-secondary)]">
                <p className="font-semibold text-[var(--ink)] mb-0.5">
                  Sending as {reporter.name}
                </p>
                <p className="text-[var(--muted)]">{reporter.email}</p>
              </div>
            ) : null}
            <SupportCaseForm
              targetType="none"
              sourcePageType="support"
              initialType={searchParams.get("type") || undefined}
            />
          </Card>

          <Card className="lg:col-span-2 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-bold text-[var(--ink)]">Your cases</h2>
              <Link
                href="/support/cases"
                className="text-xs font-semibold text-[var(--brand)] hover:underline"
              >
                View all
              </Link>
            </div>
            {loading ? (
              <p className="text-sm text-[var(--muted)]">Loading…</p>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No support requests yet.
              </p>
            ) : (
              <ul className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                {tickets.slice(0, 8).map((t) => (
                  <li key={t._id}>
                    <Link
                      href={`/support/cases/${t._id}`}
                      className="block rounded-[var(--radius)] border border-[var(--border)] p-3 text-sm hover:bg-[var(--surface-hover)]"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-[var(--ink)] line-clamp-2">
                          {t.caseNumber ? `${t.caseNumber} · ` : ""}
                          {t.subject}
                        </p>
                        <span
                          className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                            STATUS_STYLE[t.status] || STATUS_STYLE.open
                          }`}
                        >
                          {t.statusLabel || String(t.status || "").replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)]">
                        {t.kindLabel || t.type}
                      </p>
                      {t.adminReply ? (
                        <Alert tone="info" className="mt-2 text-xs">
                          {t.adminReply}
                        </Alert>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[50vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[var(--brand-muted)] border-t-[var(--brand)] rounded-full animate-spin" />
        </main>
      }
    >
      <SupportPageInner />
    </Suspense>
  );
}
