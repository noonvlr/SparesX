"use client";

/** Dispatch chat open request (handled by ChatProvider). */
export function openChatUi(detail: {
  peerId?: string;
  productId?: string;
  conversationId?: string;
} = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("sparesx-open-chat", { detail }));
}
