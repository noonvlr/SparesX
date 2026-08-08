"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ToastHost";
import { useOtpResendCooldown } from "@/hooks/useOtpResendCooldown";
import { AuthPage } from "@/components/layout";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Spinner,
  buttonVariants,
} from "@/components/ui";
import { cn } from "@/lib/ui/cn";
import { authFetch, getAccessToken } from "@/lib/auth/clientAuth";

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
  const [phoneSent, setPhoneSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const phoneResend = useOtpResendCooldown(120);
  const emailResend = useOtpResendCooldown(120);

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      router.replace(`/login?next=${encodeURIComponent("/verify")}`);
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch("/api/auth/verify/status");
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
      const res = await authFetch("/api/auth/verify/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to send OTP");
        return;
      }
      showToast(data.message || "OTP sent");
      setPhoneSent(true);
      phoneResend.restart(120);
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
      const res = await authFetch("/api/auth/verify/phone/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const res = await authFetch("/api/auth/verify/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to send email OTP");
        return;
      }
      showToast(data.message || "Email OTP sent");
      setEmailSent(true);
      emailResend.restart(120);
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
      const res = await authFetch("/api/auth/verify/email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      <AuthPage>
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-[var(--brand)]" />
        </div>
      </AuthPage>
    );
  }

  return (
    <AuthPage className="items-start">
      <div className="w-full">
        <h1 className="text-3xl font-bold text-[var(--ink)] mb-2">
          Verify account
        </h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          Phone verification is required before posting a listing. Email
          verification is optional.
        </p>

        {error ? (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        ) : null}

        <Card padding="md" className="mb-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-[var(--ink)]">Phone (required)</h2>
            <Badge tone={status?.phoneVerified ? "success" : "warning"}>
              {status?.phoneVerified ? "Verified" : "Not verified"}
            </Badge>
          </div>
          <p className="text-sm text-[var(--muted)]">
            {status?.countryCode} {status?.mobile}
          </p>
          {!status?.phoneVerified ? (
            <>
              {!phoneSent ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={sendPhone}
                  loading={busy === "phone-send"}
                  disabled={!!busy && busy !== "phone-send"}
                >
                  Send SMS OTP
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={sendPhone}
                  loading={busy === "phone-send"}
                  disabled={
                    (!!busy && busy !== "phone-send") || !phoneResend.canResend
                  }
                >
                  {phoneResend.label}
                </Button>
              )}
              <form onSubmit={confirmPhone} className="flex gap-2 items-end">
                <Field htmlFor="phone-otp" className="flex-1">
                  <Input
                    id="phone-otp"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={phoneOtp}
                    onChange={(e) =>
                      setPhoneOtp(e.target.value.replace(/\D/g, ""))
                    }
                    required
                  />
                </Field>
                <Button
                  type="submit"
                  variant="secondary"
                  loading={busy === "phone-confirm"}
                  disabled={
                    (!!busy && busy !== "phone-confirm") ||
                    phoneOtp.length !== 6
                  }
                >
                  Verify
                </Button>
              </form>
            </>
          ) : null}
        </Card>

        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-[var(--ink)]">Email (optional)</h2>
            <Badge tone={status?.emailVerified ? "success" : "neutral"}>
              {status?.emailVerified ? "Verified" : "Not verified"}
            </Badge>
          </div>
          <p className="text-sm text-[var(--muted)]">{status?.email}</p>
          {!status?.emailVerified ? (
            <>
              {!emailSent ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={sendEmail}
                  loading={busy === "email-send"}
                  disabled={!!busy && busy !== "email-send"}
                >
                  Send email OTP
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={sendEmail}
                  loading={busy === "email-send"}
                  disabled={
                    (!!busy && busy !== "email-send") || !emailResend.canResend
                  }
                >
                  {emailResend.label}
                </Button>
              )}
              <form onSubmit={confirmEmail} className="flex gap-2 items-end">
                <Field htmlFor="email-otp" className="flex-1">
                  <Input
                    id="email-otp"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={emailOtp}
                    onChange={(e) =>
                      setEmailOtp(e.target.value.replace(/\D/g, ""))
                    }
                    required
                  />
                </Field>
                <Button
                  type="submit"
                  variant="secondary"
                  loading={busy === "email-confirm"}
                  disabled={
                    (!!busy && busy !== "email-confirm") ||
                    emailOtp.length !== 6
                  }
                >
                  Verify
                </Button>
              </form>
            </>
          ) : null}
        </Card>

        {status?.phoneVerified ? (
          <div className="mt-6">
            <Link
              href="/technician/products/new"
              className={cn(buttonVariants())}
            >
              Continue to post a listing
            </Link>
          </div>
        ) : null}
      </div>
    </AuthPage>
  );
}
