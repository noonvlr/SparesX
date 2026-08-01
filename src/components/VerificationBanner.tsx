"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Status = {
  phoneVerified: boolean;
  emailVerified: boolean;
  role?: string;
};

export default function VerificationBanner() {
  const pathname = usePathname();
  const [status, setStatus] = useState<Status | null>(null);
  const [dismissedEmail, setDismissedEmail] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/admin") || pathname === "/verify") {
      setStatus(null);
      return;
    }

    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setStatus(null);
        return;
      }
      try {
        const res = await fetch("/api/auth/verify/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setStatus(null);
          return;
        }
        const data = await res.json();
        if (data.role === "admin") {
          setStatus(null);
          return;
        }
        setStatus({
          phoneVerified: !!data.phoneVerified,
          emailVerified: !!data.emailVerified,
          role: data.role,
        });
      } catch {
        setStatus(null);
      }
    };

    void load();
    const onAuth = () => void load();
    window.addEventListener("sparesx-auth-changed", onAuth);
    return () => window.removeEventListener("sparesx-auth-changed", onAuth);
  }, [pathname]);

  if (!status) return null;
  if (status.phoneVerified && (status.emailVerified || dismissedEmail)) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-100">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-amber-950">
        <p>
          {!status.phoneVerified ? (
            <>
              Verify your phone number to post listings.{" "}
              {!status.emailVerified && "You can also verify your email."}
            </>
          ) : (
            <>Your email is not verified yet (optional).</>
          )}
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/verify"
            className="font-semibold text-amber-900 underline underline-offset-2"
          >
            Verify now
          </Link>
          {status.phoneVerified && !status.emailVerified && (
            <button
              type="button"
              className="text-amber-800/70 hover:text-amber-900"
              onClick={() => setDismissedEmail(true)}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
