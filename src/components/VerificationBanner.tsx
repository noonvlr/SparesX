"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authFetch, getAccessToken } from "@/lib/auth/clientAuth";

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
      if (!getAccessToken()) {
        setStatus(null);
        return;
      }
      try {
        const res = await authFetch("/api/auth/verify/status");
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
    window.addEventListener("sparesx-profile-updated", onAuth);
    return () => {
      window.removeEventListener("sparesx-auth-changed", onAuth);
      window.removeEventListener("sparesx-profile-updated", onAuth);
    };
  }, [pathname]);

  if (!status) return null;
  if (status.phoneVerified && (status.emailVerified || dismissedEmail)) {
    return null;
  }

  let message: ReactNode;
  let showDismiss = false;

  if (!status.phoneVerified) {
    message = (
      <>
        Verify your phone number to post listings.{" "}
        {!status.emailVerified && "You can also verify your email."}
      </>
    );
  } else {
    message = <>Your email is not verified yet (optional).</>;
    showDismiss = true;
  }

  return (
    <div className="bg-[var(--warning-soft)] border-b border-[var(--warning)]/20">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-[var(--warning)]">
        <p>{message}</p>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/verify"
            className="font-semibold underline underline-offset-2"
          >
            Verify now
          </Link>
          {showDismiss && (
            <button
              type="button"
              className="opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-[var(--radius-sm)] px-1"
              onClick={() => setDismissedEmail(true)}
              aria-label="Dismiss email verification reminder"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
