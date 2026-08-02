"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Status = {
  phoneVerified: boolean;
  emailVerified: boolean;
  hasPassword: boolean;
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
          hasPassword: !!data.hasPassword,
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

  const onProfile = pathname?.startsWith("/technician/profile");
  const needsPhone = !status.phoneVerified;
  const needsPassword = !status.hasPassword && !onProfile;
  const needsEmail =
    status.phoneVerified && !status.emailVerified && !dismissedEmail;

  if (!needsPhone && !needsPassword && !needsEmail) {
    return null;
  }

  let message: ReactNode;
  let ctaHref = "/verify";
  let ctaLabel = "Verify now";
  let showDismiss = false;

  if (needsPhone) {
    message = (
      <>
        Verify your phone number to post listings.{" "}
        {!status.emailVerified && "You can also verify your email."}
        {needsPassword &&
          " Also set a password so you can sign in with email."}
      </>
    );
  } else if (needsPassword) {
    message = (
      <>
        Set a password so you can also sign in with email. Google Sign-In still
        works.
      </>
    );
    ctaHref = "/technician/profile#security";
    ctaLabel = "Set password";
  } else {
    message = <>Your email is not verified yet (optional).</>;
    showDismiss = true;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-100">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-amber-950">
        <p>{message}</p>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={ctaHref}
            className="font-semibold text-amber-900 underline underline-offset-2"
          >
            {ctaLabel}
          </Link>
          {showDismiss && (
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
