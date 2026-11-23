"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch, getCachedRole } from "@/lib/auth/clientAuth";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Client-side gate for /admin (APIs still enforce requireAdmin).
 * Uses cached role for instant first paint; verifies with /api/auth/me.
 * Does not remount the shell on in-admin navigations (layout-owned).
 */
export default function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(() => {
    if (typeof window === "undefined") return false;
    return getCachedRole() === "admin";
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (getCachedRole() === "admin") {
          setReady(true);
        }
        const res = await authFetch("/api/auth/me");
        if (!res.ok) {
          router.replace(
            `/login?next=${encodeURIComponent("/admin/dashboard")}`,
          );
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (data?.user?.role !== "admin") {
          router.replace("/");
          return;
        }
        setReady(true);
      } catch {
        router.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-[var(--admin-bg,var(--surface-2))] text-sm text-[var(--muted)]">
        <Spinner />
        <p>Checking admin access…</p>
      </div>
    );
  }

  return <>{children}</>;
}
