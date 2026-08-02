"use client";

/** Dispatch chat open request (handled by ChatProvider). */
export function openChatUi(detail: {
  peerId?: string;
  productId?: string;
  conversationId?: string;
} = {}) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("sparesx_chat_visited", "1");
    localStorage.removeItem("sparesx_chat_fab_hidden");
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("sparesx-open-chat", { detail }));
}
