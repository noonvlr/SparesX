"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOtpResendCooldown } from "@/hooks/useOtpResendCooldown";
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
} from "@/components/ui";

type Step = "email" | "otp" | "newPassword" | "success";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const resend = useOtpResendCooldown(120);

  async function requestOtp(isResend = false) {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(
          isResend
            ? `OTP resent to ${email}. Check inbox and spam.`
            : `OTP sent to ${email}. Check inbox and spam.`,
        );
        setStep("otp");
        resend.restart(120);
        if (isResend) setOtp("");
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault();
    await requestOtp(false);
  }

  async function handleResendOTP() {
    if (!resend.canResend || loading) return;
    await requestOtp(true);
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("OTP verified successfully");
        setStep("newPassword");
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Password reset successfully!");
        setStep("success");
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--brand)] rounded-[var(--radius-lg)] flex items-center justify-center mx-auto mb-4 shadow-[var(--shadow-md)]">
          <svg
            className="w-8 h-8 text-[var(--ink-inverse)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-[var(--ink)] mb-2">
          Reset Password
        </h1>
        <p className="text-[var(--muted)]">
          {step === "email" && "Enter your email to receive an OTP"}
          {step === "otp" && "Enter the OTP sent to your email"}
          {step === "newPassword" && "Create a new password"}
          {step === "success" && "Your password has been reset"}
        </p>
      </div>

      <Card padding="lg" variant="elevated">
        {error ? (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        ) : null}

        {success && step !== "success" ? (
          <Alert tone="success" className="mb-4">
            {success}
          </Alert>
        ) : null}

        {step === "email" && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <Field label="Email Address" htmlFor="forgot-email" required>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
              />
            </Field>
            <Button type="submit" className="w-full" loading={loading}>
              Send OTP
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <Field label="OTP Code" htmlFor="forgot-otp" required>
              <Input
                id="forgot-otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                required
              />
            </Field>
            <Button type="submit" className="w-full" loading={loading}>
              Verify OTP
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendOTP}
              disabled={!resend.canResend || loading}
            >
              {resend.label}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => {
                setStep("email");
                setSuccess("");
                setError("");
              }}
            >
              Back to Email
            </Button>
          </form>
        )}

        {step === "newPassword" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Field label="New Password" htmlFor="forgot-new-password" required>
              <div className="relative">
                <Input
                  id="forgot-new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="pr-16"
                  minLength={6}
                  required
                />
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </Button>
              </div>
            </Field>
            <Field
              label="Confirm Password"
              htmlFor="forgot-confirm-password"
              required
            >
              <div className="relative">
                <Input
                  id="forgot-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="pr-16"
                  minLength={6}
                  required
                />
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </Button>
              </div>
            </Field>
            <Button type="submit" className="w-full" loading={loading}>
              Reset Password
            </Button>
          </form>
        )}

        {step === "success" && (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-[var(--ink)]">
              Password Reset Successfully!
            </h2>
            <p className="text-[var(--muted)]">
              You can now login with your new password.
            </p>
            <Button className="w-full" onClick={() => router.push("/login")}>
              Back to Login
            </Button>
          </div>
        )}
      </Card>

      {step === "email" && (
        <div className="text-center mt-6">
          <p className="text-[var(--muted)]">
            Remember your password?{" "}
            <a
              href="/login"
              className="text-[var(--brand)] font-semibold hover:text-[var(--brand-hover)]"
            >
              Login here
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
