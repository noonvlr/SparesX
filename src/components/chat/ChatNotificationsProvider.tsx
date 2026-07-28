"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getSocketUrl } from "@/lib/chat/socketUrl";
import { getSharedSocket } from "@/hooks/useSocket";

type Toast = {
  id: number;
  preview: string;
  conversationId?: string;
};

/**
 * Keeps a global socket + unread polling alive on every page so receivers
 * get toasts and navbar badges even when not on /messages.
 */
export default function ChatNotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const onMessagesPage = pathname?.startsWith("/messages");

  useEffect(() => {
    const syncAuth = () => setAuthToken(localStorage.getItem("token"));
    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("focus", syncAuth);
    window.addEventListener("sparesx-auth-changed", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("focus", syncAuth);
      window.removeEventListener("sparesx-auth-changed", syncAuth);
    };
  }, []);

  const refreshUnread = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("/api/chat/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        window.dispatchEvent(
          new CustomEvent("chat-unread-updated", {
            detail: { unreadTotal: data.unreadTotal || 0 },
          }),
        );
      }
    } catch {
      // ignore
    }
  }, []);

  const showToast = useCallback(
    (preview: string, conversationId?: string) => {
      if (onMessagesPage) return;
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({
        id: Date.now(),
        preview: preview || "New message",
        conversationId,
      });
      toastTimer.current = setTimeout(() => setToast(null), 8000);
      refreshUnread();
    },
    [onMessagesPage, refreshUnread],
  );

  useEffect(() => {
    if (!authToken) return;

    refreshUnread();
    const poll = setInterval(refreshUnread, 12000);

    const socketUrl = getSocketUrl();
    let socket: Socket | null = null;
    if (socketUrl) {
      socket = getSharedSocket();
      if (!socket || socket.disconnected) {
        socket = io(socketUrl, {
          auth: { token: authToken },
          transports: ["websocket", "polling"],
          autoConnect: true,
        });
        (globalThis as any).__sparesx_socket = socket;
      }
      socketRef.current = socket;

      const onNotification = (payload: {
        preview?: string;
        conversationId?: string;
      }) => {
        showToast(payload.preview || "New message", payload.conversationId);
      };

      const onNewMessage = (payload: {
        conversationId?: string;
        message?: { text?: string; type?: string };
      }) => {
        const preview =
          payload.message?.type === "image"
            ? "📷 Photo"
            : payload.message?.text || "New message";
        showToast(preview, payload.conversationId);
      };

      socket.on("notification", onNotification);
      socket.on("new-message", onNewMessage);

      return () => {
        clearInterval(poll);
        socket?.off("notification", onNotification);
        socket?.off("new-message", onNewMessage);
        if (toastTimer.current) clearTimeout(toastTimer.current);
      };
    }

    return () => {
      clearInterval(poll);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [authToken, pathname, refreshUnread, showToast]);

  return (
    <>
      {children}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[100] max-w-sm w-[calc(100%-2rem)] animate-in slide-in-from-bottom-4">
          <div className="bg-white border border-blue-100 shadow-xl rounded-2xl p-4 flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              ✉
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900">New message</p>
              <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                {toast.preview}
              </p>
              <Link
                href={
                  toast.conversationId
                    ? `/messages?open=${encodeURIComponent(toast.conversationId)}`
                    : "/messages"
                }
                onClick={() => setToast(null)}
                className="inline-block mt-2 text-sm font-semibold text-blue-600 hover:underline"
              >
                Open chat →
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
