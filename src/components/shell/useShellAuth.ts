"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useChatDockOptional } from "@/components/chat/ChatProvider";
import { openChatUi } from "@/components/chat/openChat";
import { announceChatOffline } from "@/lib/chat/announceOffline";
import { showToast } from "@/components/ToastHost";
import {
  authFetch,
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth/clientAuth";

export function useShellAuth() {
  const chatDock = useChatDockOptional();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [supportUnread, setSupportUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const [waPending, setWaPending] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setIsAuthenticated(true);
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role);
      } catch {
        setUserRole(null);
      }
    }

    // Cookie-or-Bearer: works even if localStorage was cleared but cookie remains
    authFetch("/api/auth/me")
      .then(async (r) => {
        if (!r.ok) {
          if (!token) {
            setIsAuthenticated(false);
            setUserRole(null);
            setUserName(null);
            setProfilePicture(null);
          }
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data?.user) return;
        setIsAuthenticated(true);
        if (data.user.role) setUserRole(data.user.role);
        if (data.user.name) setUserName(data.user.name);
        setProfilePicture(data.user.profilePicture || null);
      })
      .catch(() => {});
  }, [pathname]);

  // Admin support unread badge — poll + listen for inbox updates
  useEffect(() => {
    if (!isAuthenticated || userRole !== "admin") {
      setSupportUnread(0);
      return;
    }

    const fetchUnread = async () => {
      try {
        const res = await authFetch("/api/admin/support/unread-count");
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
      try {
        const res = await authFetch("/api/whatsapp-connect?box=incoming");
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
      try {
        const res = await authFetch("/api/chat/unread-count");
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
    try {
      await authFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore — client logout still proceeds
    }
    await announceChatOffline();
    try {
      (globalThis as unknown as { __sparesx_socket?: { disconnect?: () => void } })
        .__sparesx_socket?.disconnect?.();
    } catch {
      // ignore
    }
    clearAccessToken();
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName(null);
    setProfilePicture(null);
    setSupportUnread(0);
    setChatUnread(0);
    setWaPending(0);
    setNotifUnread(0);
    showToast("Logged out");
    router.push("/");
  }, [router]);

  // In-app notifications badge
  useEffect(() => {
    if (!isAuthenticated || userRole === "admin") {
      setNotifUnread(0);
      return;
    }

    const fetchNotifs = async () => {
      try {
        const res = await authFetch("/api/notifications/unread-count");
        const data = await res.json();
        if (res.ok) setNotifUnread(data.unreadCount || 0);
      } catch {
        // ignore
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.unreadCount === "number") {
        setNotifUnread(detail.unreadCount);
      } else {
        fetchNotifs();
      }
    };
    window.addEventListener("sparesx-notifications-updated", onUpdated);
    window.addEventListener("focus", fetchNotifs);
    return () => {
      clearInterval(interval);
      window.removeEventListener("sparesx-notifications-updated", onUpdated);
      window.removeEventListener("focus", fetchNotifs);
    };
  }, [isAuthenticated, userRole, pathname]);

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
    notifUnread,
    handleLogout,
    openMessages,
    pathname,
  };
}

export type ShellAuth = ReturnType<typeof useShellAuth>;
