"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";

const TYPES = [
  { value: "bug", label: "Bug / Error" },
  { value: "issue", label: "Issue / Problem" },
  { value: "abuse", label: "Report misuse / abuse" },
  { value: "change_request", label: "Change request" },
  { value: "feature", label: "Feature idea" },
  { value: "other", label: "Other" },
];

const STATUS_STYLE: Record<string, string> = {
  open: "bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/20",
  in_progress:
    "bg-[var(--brand-soft)] text-[var(--brand-hover)] border-[var(--brand-muted)]",
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
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reporter, setReporter] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [form, setForm] = useState({
    type: "issue",
    subject: "",
    message: "",
    productId: "",
    reportedUserId: "",
  });

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/support");
      const data = await res.json();
      setTickets(data.tickets || []);

      const hasUnread = (data.tickets || []).some((t: any) => t.userUnread);
      if (hasUnread) {
        await authFetch("/api/support", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
      }
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedInClient()) {
      setIsAuthenticated(false);
      setAuthChecked(true);
      setLoading(false);
      return;
    }
    setIsAuthenticated(true);
    setAuthChecked(true);
    void loadTickets();

    authFetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setReporter({ name: data.user.name, email: data.user.email });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const type = searchParams.get("type");
    const subject = searchParams.get("subject");
    const productId = searchParams.get("productId");
    const reportedUserId = searchParams.get("reportedUserId");
    const next: Partial<typeof form> = {};
    if (type && TYPES.some((t) => t.value === type)) next.type = type;
    if (subject) next.subject = subject.slice(0, 140);
    if (productId) next.productId = productId;
    if (reportedUserId) next.reportedUserId = reportedUserId;
    if (Object.keys(next).length) {
      setForm((f) => ({ ...f, ...next }));
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedInClient()) return;

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await authFetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: form.type,
          subject: form.subject,
          message: form.message,
          productId: form.productId || undefined,
          reportedUserId: form.reportedUserId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to submit");
        return;
      }
      setMessage(
        form.type === "abuse"
          ? "Report sent to SparesX admins. We’ll update you here when they reply."
          : "Request sent to admin. We’ll update you here when they reply.",
      );
      setForm({
        type: "issue",
        subject: "",
        message: "",
        productId: "",
        reportedUserId: "",
      });
      if (searchParams.get("type") === "abuse") {
        router.replace("/support");
      }
      loadTickets();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!authChecked) {
    return (
      <main className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--brand-muted)] border-t-[var(--brand)] rounded-full animate-spin" />
      </main>
    );
  }

  if (!isAuthenticated) {
    const qs =
      typeof window !== "undefined" ? window.location.search : "";
    const next = `/support${qs}`;
    return (
      <main className="min-h-screen bg-[var(--surface-2)] py-12 px-4">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">
            Contact Admin
          </h1>
          <p className="text-[var(--muted)] mb-6">
            Login to raise a bug report, change request, or issue with the SparesX
            team.
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
          title="Support & Admin"
          description="Report bugs, request changes, or flag misuse. Admins will reply on this page."
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-3 space-y-4"
          >
            <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-bold text-[var(--ink)]">New request</h2>
            {reporter && (
              <div className="rounded-[var(--radius)] bg-[var(--surface-2)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--ink-secondary)]">
                <p className="font-semibold text-[var(--ink)] mb-0.5">
                  Sending as {reporter.name}
                </p>
                <p className="text-[var(--muted)]">{reporter.email}</p>
              </div>
            )}
            {form.type === "abuse" &&
              (form.productId || form.reportedUserId) && (
                <Alert tone="danger">
                  Abuse report linked to this listing
                  {form.productId ? (
                    <>
                      {" "}
                      (
                      <Link
                        href={`/product/${form.productId}`}
                        className="underline font-semibold"
                      >
                        view product
                      </Link>
                      )
                    </>
                  ) : null}
                  . Your profile details are attached automatically for admin
                  review.
                </Alert>
              )}
            {message && <Alert tone="success">{message}</Alert>}
            {error && <Alert tone="danger">{error}</Alert>}

            <Field label="Type" htmlFor="support-type">
              <Select
                id="support-type"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
                size="sm"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Subject" htmlFor="support-subject" required>
              <Input
                id="support-subject"
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                placeholder="Short summary"
                maxLength={140}
                required
                size="sm"
              />
            </Field>

            <Field label="Details" htmlFor="support-message" required>
              <Textarea
                id="support-message"
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                className="min-h-[140px]"
                placeholder={
                  form.type === "abuse"
                    ? "Describe the misuse: what happened, when, and any evidence…"
                    : "Describe the issue in detail…"
                }
                maxLength={4000}
                required
              />
            </Field>

            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "Sending…" : "Send to admin"}
            </Button>
            </Card>
          </form>

          <Card className="lg:col-span-2 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[var(--ink)] mb-4">
              Your tickets
            </h2>
            {loading ? (
              <p className="text-sm text-[var(--muted)]">Loading…</p>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No support requests yet.
              </p>
            ) : (
              <ul className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                {tickets.map((t) => (
                  <li
                    key={t._id}
                    className="rounded-[var(--radius)] border border-[var(--border)] p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-[var(--ink)] line-clamp-2">
                        {t.subject}
                      </p>
                      <span
                        className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                          STATUS_STYLE[t.status] || STATUS_STYLE.open
                        }`}
                      >
                        {String(t.status || "").replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)] capitalize mb-2">
                      {String(t.type || "").replace("_", " ")}
                    </p>
                    {t.adminReply && (
                      <div className="rounded-lg bg-[var(--brand-soft)] text-[var(--brand-hover)] px-3 py-2 text-xs">
                        <span className="font-semibold">Admin:</span>{" "}
                        {t.adminReply}
                      </div>
                    )}
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
