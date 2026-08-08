"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getAccessToken } from "@/lib/auth/clientAuth";

/**
 * Deep-link entry: opens floating dock via event, then returns to browsing.
 */
export default function MessagesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const peerId = searchParams.get("peer");
  const productId = searchParams.get("product") || undefined;
  const openId = searchParams.get("open");
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    setAuthed(Boolean(token));
    if (!token) return;

    if (peerId) {
      window.dispatchEvent(
        new CustomEvent("sparesx-open-chat", {
          detail: { peerId, productId },
        }),
      );
    } else if (openId) {
      window.dispatchEvent(
        new CustomEvent("sparesx-open-chat", {
          detail: { conversationId: openId },
        }),
      );
    } else {
      window.dispatchEvent(new CustomEvent("sparesx-open-chat", { detail: {} }));
    }

    const t = setTimeout(() => router.replace("/"), 80);
    return () => clearTimeout(t);
  }, [peerId, productId, openId, router]);

  if (authed === false) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Messages</h1>
          <p className="text-[var(--muted)] mb-4">
            Login to chat with sellers and buyers.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent("/messages")}`}
            className="inline-block px-5 py-2.5 rounded-xl bg-[var(--brand)] text-[var(--ink-inverse)] font-semibold"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[40vh] flex items-center justify-center text-sm text-[var(--muted)]">
      Opening chat…
    </main>
  );
}
