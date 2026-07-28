"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Client-side gate for /admin pages (APIs still enforce requireAdmin). */
export default function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace(`/login?next=${encodeURIComponent("/admin/dashboard")}`);
        return;
      }
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload?.role !== "admin") {
        router.replace("/");
        return;
      }
      setReady(true);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-gray-500">
        Checking admin access…
      </div>
    );
  }

  return <>{children}</>;
}
