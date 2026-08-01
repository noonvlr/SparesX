"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ToastHost";

type Status = {
  email: string;
  mobile: string;
  countryCode: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    "Content-Type": "application/json",
  });

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent("/verify")}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load status");
        return;
      }
      setStatus(data);
    } catch {
      setError("Failed to load status");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendPhone() {
    setBusy("phone-send");
    setError("");
    try {
      const res = await fetch("/api/auth/verify/phone/send", {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to send OTP");
        return;
      }
      showToast(data.message || "OTP sent");
    } catch {
      setError("Failed to send OTP");
    } finally {
      setBusy(null);
    }
  }

  async function confirmPhone(e: React.FormEvent) {
    e.preventDefault();
    setBusy("phone-confirm");
    setError("");
    try {
      const res = await fetch("/api/auth/verify/phone/confirm", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ otp: phoneOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid OTP");
        return;
      }
      showToast("Phone verified");
      setPhoneOtp("");
      window.dispatchEvent(new Event("sparesx-auth-changed"));
      await load();
    } catch {
      setError("Verification failed");
    } finally {
      setBusy(null);
    }
  }

  async function sendEmail() {
    setBusy("email-send");
    setError("");
    try {
      const res = await fetch("/api/auth/verify/email/send", {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to send email OTP");
        return;
      }
      showToast(data.message || "Email OTP sent");
    } catch {
      setError("Failed to send email OTP");
    } finally {
      setBusy(null);
    }
  }

  async function confirmEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email-confirm");
    setError("");
    try {
      const res = await fetch("/api/auth/verify/email/confirm", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ otp: emailOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid OTP");
        return;
      }
      showToast("Email verified");
      setEmailOtp("");
      window.dispatchEvent(new Event("sparesx-auth-changed"));
      await load();
    } catch {
      setError("Verification failed");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <main className="max-w-lg mx-auto py-12 px-4 text-gray-600">Loading…</main>
    );
  }

  return (
    <main className="max-w-lg mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify account</h1>
      <p className="text-sm text-gray-600 mb-6">
        Phone verification is required before posting a listing. Email
        verification is optional.
      </p>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm mb-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900">Phone (required)</h2>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              status?.phoneVerified
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {status?.phoneVerified ? "Verified" : "Not verified"}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          {status?.countryCode} {status?.mobile}
        </p>
        {!status?.phoneVerified && (
          <>
            <button
              type="button"
              onClick={sendPhone}
              disabled={!!busy}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {busy === "phone-send" ? "Sending…" : "Send SMS OTP"}
            </button>
            <form onSubmit={confirmPhone} className="flex gap-2">
              <input
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit OTP"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
              <button
                type="submit"
                disabled={!!busy || phoneOtp.length !== 6}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold disabled:opacity-50"
              >
                Verify
              </button>
            </form>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900">Email (optional)</h2>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              status?.emailVerified
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-50 text-gray-600"
            }`}
          >
            {status?.emailVerified ? "Verified" : "Not verified"}
          </span>
        </div>
        <p className="text-sm text-gray-600">{status?.email}</p>
        {!status?.emailVerified && (
          <>
            <button
              type="button"
              onClick={sendEmail}
              disabled={!!busy}
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              {busy === "email-send" ? "Sending…" : "Send email OTP"}
            </button>
            <form onSubmit={confirmEmail} className="flex gap-2">
              <input
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit OTP"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
              <button
                type="submit"
                disabled={!!busy || emailOtp.length !== 6}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold disabled:opacity-50"
              >
                Verify
              </button>
            </form>
          </>
        )}
      </section>

      {status?.phoneVerified && (
        <div className="mt-6">
          <Link
            href="/technician/products/new"
            className="inline-flex px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            Continue to post a listing
          </Link>
        </div>
      )}
    </main>
  );
}
