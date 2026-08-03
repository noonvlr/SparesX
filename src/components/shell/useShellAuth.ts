"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useChatDockOptional } from "@/components/chat/ChatProvider";
import { openChatUi } from "@/components/chat/openChat";
import { announceChatOffline } from "@/lib/chat/announceOffline";
import { showToast } from "@/components/ToastHost";

export function useShellAuth() {
  const chatDock = useChatDockOptional();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [supportUnread, setSupportUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const [waPending, setWaPending] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role);
      } catch {
        setUserRole(null);
      }

      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.user?.name) setUserName(data.user.name);
          setProfilePicture(data.user?.profilePicture || null);
        })
        .catch(() => {});
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
      setUserName(null);
      setProfilePicture(null);
    }
  }, [pathname]);

  // Admin support unread badge — poll + listen for inbox updates
  useEffect(() => {
    if (!isAuthenticated || userRole !== "admin") {
      setSupportUnread(0);
      return;
    }

    const fetchUnread = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/admin/support/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setSupportUnread(data.unreadCount || 0);
      } catch {
        // ignore transient errors
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.unreadCount === "number") {
        setSupportUnread(detail.unreadCount);
      } else {
        fetchUnread();
      }
    };
    window.addEventListener("support-unread-updated", onUpdated);
    window.addEventListener("focus", fetchUnread);

    return () => {
      clearInterval(interval);
      window.removeEventListener("support-unread-updated", onUpdated);
      window.removeEventListener("focus", fetchUnread);
    };
  }, [isAuthenticated, userRole, pathname]);

  // Pending WhatsApp connect requests (incoming)
  useEffect(() => {
    if (!isAuthenticated || userRole === "admin") {
      setWaPending(0);
      return;
    }

    const fetchPending = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/whatsapp-connect?box=incoming", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const count =
            typeof data.pendingIncoming === "number"
              ? data.pendingIncoming
              : (data.items || []).filter(
                  (i: { status: string }) => i.status === "pending",
                ).length;
          setWaPending(count);
        }
      } catch {
        // ignore
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    window.addEventListener("sparesx-wa-connect-changed", fetchPending);
    window.addEventListener("focus", fetchPending);
    return () => {
      clearInterval(interval);
      window.removeEventListener("sparesx-wa-connect-changed", fetchPending);
      window.removeEventListener("focus", fetchPending);
    };
  }, [isAuthenticated, userRole, pathname]);

  // Chat unread badge for any authenticated user
  useEffect(() => {
    if (!isAuthenticated) {
      setChatUnread(0);
      return;
    }

    const fetchUnread = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/chat/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setChatUnread(data.unreadTotal || 0);
      } catch {
        // ignore
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 12000);
    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.unreadTotal === "number") {
        setChatUnread(detail.unreadTotal);
      } else {
        fetchUnread();
      }
    };
    window.addEventListener("chat-unread-updated", onUpdated);
    window.addEventListener("focus", fetchUnread);

    return () => {
      clearInterval(interval);
      window.removeEventListener("chat-unread-updated", onUpdated);
      window.removeEventListener("focus", fetchUnread);
    };
  }, [isAuthenticated, pathname]);

  const handleLogout = useCallback(async () => {
    await announceChatOffline();
    try {
      (globalThis as unknown as { __sparesx_socket?: { disconnect?: () => void } })
        .__sparesx_socket?.disconnect?.();
    } catch {
      // ignore
    }
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("sparesx-auth-changed"));
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName(null);
    setProfilePicture(null);
    setSupportUnread(0);
    setChatUnread(0);
    setWaPending(0);
    showToast("Logged out");
    router.push("/");
  }, [router]);

  const openMessages = useCallback(() => {
    if (chatDock?.openPanel) chatDock.openPanel();
    else openChatUi({});
  }, [chatDock]);

  return {
    isAuthenticated,
    userRole,
    userName,
    profilePicture,
    supportUnread,
    chatUnread,
    waPending,
    handleLogout,
    openMessages,
    pathname,
  };
}

export type ShellAuth = ReturnType<typeof useShellAuth>;
