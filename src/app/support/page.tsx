"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TYPES = [
  { value: "bug", label: "Bug / Error" },
  { value: "issue", label: "Issue / Problem" },
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

export default function SupportPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "issue",
    subject: "",
    message: "",
  });

  const loadTickets = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTickets(data.tickets || []);

      // Mark admin replies as read once the user sees their inbox
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
  }, []);

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
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to submit");
        return;
      }
      setMessage("Request sent to admin. We’ll update you here when they reply.");
      setForm({ type: "issue", subject: "", message: "" });
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
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contact Admin</h1>
          <p className="text-gray-600 mb-6">
            Login to raise a bug report, change request, or issue with the SparesX team.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                router.push(`/login?next=${encodeURIComponent("/support")}`)
              }
              className="py-3 rounded-xl bg-blue-600 text-white font-semibold"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(`/register?next=${encodeURIComponent("/support")}`)
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support & Admin</h1>
          <p className="text-gray-600">
            Report bugs, request changes, or flag issues. Admins will reply on this page.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4"
          >
            <h2 className="text-lg font-bold text-gray-900">New request</h2>
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
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
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
                placeholder="Describe the issue, steps to reproduce, or the change you need..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send to admin"}
            </button>
          </form>

          <aside className="lg:col-span-2 space-y-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Your requests</h2>
              {loading ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : tickets.length === 0 ? (
                <p className="text-sm text-gray-500">No requests yet.</p>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {tickets.map((ticket) => {
                    const unread = Boolean(ticket.userUnread);
                    return (
                      <article
                        key={ticket._id}
                        className={`rounded-xl border p-3 transition ${
                          unread
                            ? "border-green-200 bg-emerald-50/50"
                            : "border-gray-100 hover:border-blue-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-start gap-2 min-w-0">
                            {unread && (
                              <span
                                className="mt-1.5 w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
                                aria-label="New reply"
                              />
                            )}
                            <h3
                              className={`text-sm line-clamp-2 ${
                                unread
                                  ? "font-bold text-gray-900"
                                  : "font-semibold text-gray-900"
                              }`}
                            >
                              {ticket.subject}
                            </h3>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize whitespace-nowrap ${STATUS_STYLE[ticket.status] || STATUS_STYLE.open}`}
                          >
                            {String(ticket.status).replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2 capitalize">
                          {unread ? "New reply · " : ""}
                          {String(ticket.type).replace("_", " ")} ·{" "}
                          {new Date(ticket.createdAt).toLocaleDateString("en-IN")}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                          {ticket.message}
                        </p>
                        {ticket.adminReply && (
                          <div
                            className={`rounded-lg border p-2.5 ${
                              unread
                                ? "bg-green-50 border-green-200"
                                : "bg-blue-50 border-blue-100"
                            }`}
                          >
                            <p
                              className={`text-[11px] font-semibold mb-1 ${
                                unread ? "text-green-700" : "text-blue-700"
                              }`}
                            >
                              {unread ? "New admin reply" : "Admin reply"}
                            </p>
                            <p
                              className={`text-sm whitespace-pre-wrap ${
                                unread ? "text-green-900 font-medium" : "text-blue-900"
                              }`}
                            >
                              {ticket.adminReply}
                            </p>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
            <Link
              href="/products"
              className="block text-center text-sm text-blue-600 hover:underline"
            >
              ← Back to products
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
