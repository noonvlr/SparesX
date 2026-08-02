"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ToastHost";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { resolvePostAuthPath } from "@/lib/auth/postAuthRedirect";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        window.dispatchEvent(new Event("sparesx-auth-changed"));
        showToast("Logged in successfully");

        if (data.profileComplete === false && data.role !== "admin") {
          showToast("Please complete your profile to continue", "info");
        } else if (data.role !== "admin" && data.phoneVerified === false) {
          showToast("Please verify your phone number", "info");
        }

        router.push(resolvePostAuthPath(data));
      } else {
        setError(data.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="lg" variant="elevated" className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 text-xl font-bold tracking-tight">
            <span className="text-[var(--brand)]">Spares</span>
            <span className="text-[var(--ink)]">X</span>
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-1.5 text-center text-[var(--ink)]">
          Welcome Back
        </h2>
        <p className="text-[var(--muted)] text-center mb-6">
          Login to your SparesX account
        </p>

        <GoogleSignInButton className="mb-6" />

        <Divider label="Or login with email" className="mb-6" />

        {error ? (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        ) : null}

        <Field label="Email Address" htmlFor="email" required className="mb-4">
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="password" className="mb-0">
              Password
              <span className="text-[var(--danger)] ml-0.5" aria-hidden>
                *
              </span>
            </Label>
            <a
              href="/forgot-password"
              className="text-sm text-[var(--brand)] hover:text-[var(--brand-hover)] font-medium transition"
            >
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Login
        </Button>
        <p className="mt-4 text-center text-[var(--muted)]">
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            className="text-[var(--brand)] hover:text-[var(--brand-hover)] hover:underline font-medium"
          >
            Register
          </a>
        </p>
      </form>
    </Card>
  );
}
