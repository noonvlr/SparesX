"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ToastHost";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { resolvePostAuthPath } from "@/lib/auth/postAuthRedirect";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] w-full max-w-md"
    >
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

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-strong)]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[var(--surface)] text-[var(--muted)] font-medium">
            Or login with email
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 text-[var(--danger)] bg-[var(--danger-soft)] rounded-[var(--radius)] text-sm font-medium">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[var(--ink-secondary)] mb-2"
        >
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[var(--ink-secondary)]"
          >
            Password
          </label>
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

      <Button type="submit" className="w-full" size="lg">
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
  );
}
