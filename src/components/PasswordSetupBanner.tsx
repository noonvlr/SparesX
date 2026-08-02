"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Amber site banner prompting Google / passwordless users to set a password. */
export default function PasswordSetupBanner() {
  const pathname = usePathname();
  const [needsPassword, setNeedsPassword] = useState(false);

  useEffect(() => {
    if (
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/technician/profile") ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/complete-profile"
    ) {
      setNeedsPassword(false);
      return;
    }

    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setNeedsPassword(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/verify/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setNeedsPassword(false);
          return;
        }
        const data = await res.json();
        if (data.role === "admin") {
          setNeedsPassword(false);
          return;
        }
        setNeedsPassword(!data.hasPassword);
      } catch {
        setNeedsPassword(false);
      }
    };

    void load();
    const onAuth = () => void load();
    window.addEventListener("sparesx-auth-changed", onAuth);
    window.addEventListener("sparesx-profile-updated", onAuth);
    return () => {
      window.removeEventListener("sparesx-auth-changed", onAuth);
      window.removeEventListener("sparesx-profile-updated", onAuth);
    };
  }, [pathname]);

  if (!needsPassword) return null;

  return (
    <Link
      href="/technician/profile#security"
      className="block bg-[var(--brand-soft)] border-b border-[var(--brand-muted)] hover:bg-[var(--brand-muted)]/60 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-[var(--brand-hover)]">
        <p>
          Set a password so you can also sign in with email. Google Sign-In
          still works.
        </p>
        <span className="font-semibold underline underline-offset-2 shrink-0">
          Set password
        </span>
      </div>
    </Link>
  );
}
