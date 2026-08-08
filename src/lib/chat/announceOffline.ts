"use client";

import { authFetch } from "@/lib/auth/clientAuth";

/** Tell the server this user went offline (must run while session still exists). */
export async function announceChatOffline() {
  if (typeof window === "undefined") return;

  try {
    await authFetch("/api/chat/presence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "offline" }),
      keepalive: true,
    });
  } catch {
    // ignore — logout should still proceed
  }
}
