"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const TYPES = [
  { value: "bug", label: "Bug / Error" },
  { value: "issue", label: "Issue / Problem" },
  { value: "abuse", label: "Report misuse / abuse" },
  { value: "change_request", label: "Change request" },
  { value: "feature", label: "Feature idea" },
  { value: "other", label: "Other" },
];

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-gray-50 text-gray-600 border-gray-200",
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

  const loadTickets = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTickets(data.tickets || []);

      const hasUnread = (data.tickets || []).some((t: any) => t.userUnread);
      if (hasUnread) {
        await fetch("/api/support", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setAuthChecked(true);
      setLoading(false);
      return;
    }
    setIsAuthenticated(true);
    setAuthChecked(true);
    loadTickets(token);

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
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
    const token = localStorage.getItem("token");
    if (!token) return;

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
      loadTickets(token);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!authChecked) {
    return (
      <main className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </main>
    );
  }

  if (!isAuthenticated) {
    const qs =
      typeof window !== "undefined" ? window.location.search : "";
    const next = `/support${qs}`;
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contact Admin</h1>
          <p className="text-gray-600 mb-6">
            Login to raise a bug report, change request, or issue with the SparesX
            team.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                router.push(`/login?next=${encodeURIComponent(next)}`)
              }
              className="py-3 rounded-xl bg-blue-600 text-white font-semibold"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(`/register?next=${encodeURIComponent(next)}`)
              }
              className="py-3 rounded-xl border border-gray-300 font-semibold"
            >
              Sign up
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 sm:py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Support & Admin
          </h1>
          <p className="text-gray-600">
            Report bugs, request changes, or flag misuse. Admins will reply on
            this page.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4"
          >
            <h2 className="text-lg font-bold text-gray-900">New request</h2>
            {reporter && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-gray-700">
                <p className="font-semibold text-gray-900 mb-0.5">
                  Sending as {reporter.name}
                </p>
                <p className="text-gray-500">{reporter.email}</p>
              </div>
            )}
            {form.type === "abuse" &&
              (form.productId || form.reportedUserId) && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-900">
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
                </div>
              )}
            {message && (
              <div className="rounded-lg bg-green-50 text-green-700 px-4 py-3 text-sm">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Subject
              </label>
              <input
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
                placeholder="Short summary"
                maxLength={140}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Details
              </label>
              <textarea
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm min-h-[140px]"
                placeholder={
                  form.type === "abuse"
                    ? "Describe the misuse: what happened, when, and any evidence…"
                    : "Describe the issue in detail…"
                }
                maxLength={4000}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send to admin"}
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your tickets</h2>
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-gray-500">No support requests yet.</p>
            ) : (
              <ul className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                {tickets.map((t) => (
                  <li
                    key={t._id}
                    className="rounded-xl border border-gray-100 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-gray-900 line-clamp-2">
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
                    <p className="text-xs text-gray-500 capitalize mb-2">
                      {String(t.type || "").replace("_", " ")}
                    </p>
                    {t.adminReply && (
                      <div className="rounded-lg bg-blue-50 text-blue-900 px-3 py-2 text-xs">
                        <span className="font-semibold">Admin:</span>{" "}
                        {t.adminReply}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
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
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </main>
      }
    >
      <SupportPageInner />
    </Suspense>
  );
}
