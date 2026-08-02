"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirect legacy buyer requests stub to My Requests tab. */
export default function BuyerRequestsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/requests?tab=mine");
  }, [router]);

  return (
    <main className="p-8 text-sm text-[var(--muted)]">
      Redirecting to{" "}
      <Link
        href="/requests?tab=mine"
        className="text-[var(--brand)] hover:underline"
      >
        My requests
      </Link>
      …
    </main>
  );
}
