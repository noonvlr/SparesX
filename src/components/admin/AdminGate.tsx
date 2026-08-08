"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth/clientAuth";

/** Client-side gate for /admin pages (APIs still enforce requireAdmin). */
export default function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-[var(--muted)]">
        Checking admin access…
      </div>
    );
  }

  return <>{children}</>;
}
