"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ToastHost";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { resolvePostAuthPath } from "@/lib/auth/postAuthRedirect";

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
      className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2>
      <p className="text-gray-600 text-center mb-6">
        Login to your SparesX account
      </p>

      <GoogleSignInButton className="mb-6" />

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500 font-medium">
            Or login with email
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 text-red-700 bg-red-100 rounded">{error}</div>
      )}

      <div className="mb-4">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <a
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition"
          >
            Forgot password?
          </a>
        </div>
        <input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Login
      </button>
      <p className="mt-4 text-center text-gray-600">
        Don&apos;t have an account?{" "}
        <a
          href="/register"
          className="text-blue-600 hover:underline font-medium"
        >
          Register
        </a>
      </p>
    </form>
  );
}
