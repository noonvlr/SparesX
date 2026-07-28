"use client";

/** Tell the server this user went offline (must run while token still exists). */
export async function announceChatOffline() {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    await fetch("/api/chat/presence", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "offline" }),
      keepalive: true,
    });
  } catch {
    // ignore — logout should still proceed
  }
}
