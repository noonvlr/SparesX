"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import type { ChatConversation, ChatMessage } from "@/types/chat";
import { playMessageSound, prepareChatSound } from "@/lib/chat/sound";
import { getSocketUrl } from "@/lib/chat/socketUrl";
import { announceChatOffline } from "@/lib/chat/announceOffline";
import { authFetch, getAccessToken, getCachedUserId, resolveSessionUserId } from "@/lib/auth/clientAuth";
const MAX_FLOATING = 3;

function currentUserId(): string | null {
  return currentUserIdFromToken() || getCachedUserId();
}

function currentUserIdFromToken(): string | null {
  try {
    const token = getAccessToken();
    if (!token) return null;
    return String(JSON.parse(atob(token.split(".")[1])).id);
  } catch {
    return null;
  }
}

function normalizeMessage(raw: any): ChatMessage {
  return {
    ...raw,
    _id: String(raw._id),
    conversationId: String(raw.conversationId),
    senderId: String(raw.senderId),
    receiverId: String(raw.receiverId),
  };
}

function normalizeChatUser(raw: any) {
  if (!raw) return raw;
  return {
    ...raw,
    _id: String(raw._id),
    online: Boolean(raw.online),
  };
}

function normalizeConversation(raw: any): ChatConversation {
  const participants = Array.isArray(raw?.participants)
    ? raw.participants.map(normalizeChatUser)
    : [];
  const peer = raw?.peer ? normalizeChatUser(raw.peer) : undefined;
  const product =
    raw?.productId && typeof raw.productId === "object"
      ? { ...raw.productId, _id: String(raw.productId._id) }
      : raw?.productId
        ? String(raw.productId)
        : undefined;

  return {
    ...raw,
    _id: String(raw._id),
    participants,
    peer,
    productId: product,
    unreadCount: raw?.unreadCount || 0,
    peerOnline: Boolean(raw?.peerOnline ?? peer?.online),
    peerTyping: Boolean(raw?.peerTyping),
  };
}

type PanelView = "list" | "thread";

type ChatContextValue = {
  userId: string | null;
  connected: boolean;
  unreadTotal: number;
  conversations: ChatConversation[];
  loadingList: boolean;
  panelOpen: boolean;
  panelView: PanelView;
  activeId: string | null;
  floatingIds: string[];
  minimizedIds: Set<string>;
  messagesById: Record<string, ChatMessage[]>;
  typingById: Record<string, boolean>;
  onlineMap: Record<string, boolean>;
  loadingThread: boolean;
  openPanel: () => void;
  closePanel: () => void;
  backToList: () => void;
  openConversation: (id: string, opts?: { floating?: boolean }) => Promise<void>;
  startChat: (peerId: string, productId?: string) => Promise<void>;
  closeFloating: (id: string) => void;
  minimizeFloating: (id: string) => void;
  restoreFloating: (id: string) => void;
  sendText: (conversationId: string, text: string) => Promise<void>;
  sendImage: (conversationId: string, mediaUrl: string) => Promise<void>;
  onTyping: (conversationId: string) => void;
  loadOlder: (conversationId: string) => Promise<void>;
  hasMoreById: Record<string, boolean>;
  getConversation: (id: string) => ChatConversation | undefined;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatDock() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatDock must be used within ChatProvider");
  return ctx;
}

export function useChatDockOptional() {
  return useContext(ChatContext);
}

export default function ChatProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(() =>
    typeof window !== "undefined" ? currentUserId() : null,
  );
  const [socketConnected, setSocketConnected] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [floatingIds, setFloatingIds] = useState<string[]>([]);
  const [minimizedIds, setMinimizedIds] = useState<Set<string>>(new Set());
  const [messagesById, setMessagesById] = useState<Record<string, ChatMessage[]>>(
    {},
  );
  const [cursorById, setCursorById] = useState<Record<string, string | null>>({});
  const [hasMoreById, setHasMoreById] = useState<Record<string, boolean>>({});
  const [typingById, setTypingById] = useState<Record<string, boolean>>({});
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const [loadingThread, setLoadingThread] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const floatingRef = useRef<string[]>([]);
  const minimizedRef = useRef<Set<string>>(new Set());
  const panelOpenRef = useRef(false);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const remoteTypingTimers = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  activeIdRef.current = activeId;
  floatingRef.current = floatingIds;
  minimizedRef.current = minimizedIds;
  panelOpenRef.current = panelOpen;

  const bumpUnread = useCallback((n: number) => {
    setUnreadTotal(n);
    window.dispatchEvent(
      new CustomEvent("chat-unread-updated", { detail: { unreadTotal: n } }),
    );
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await authFetch("/api/chat/unread-count");
      const data = await res.json();
      if (res.ok) bumpUnread(data.unreadTotal || 0);
    } catch {
      // ignore
    }
  }, [bumpUnread, userId]);

  const loadConversations = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoadingList(true);
    try {
      const res = await authFetch("/api/chat/conversations?limit=50");
      const data = await res.json();
      if (res.ok) {
        const normalized = (data.conversations || []).map(normalizeConversation);
        setConversations(normalized);
        bumpUnread(data.unreadTotal || 0);
        setOnlineMap((prev) => {
          const next = { ...prev };
          for (const conversation of normalized) {
            const peer =
              conversation.peer ||
              conversation.participants?.find(
                (p: { _id: string }) => String(p._id) !== String(userId),
              );
            if (!peer?._id) continue;
            next[peer._id] = Boolean(
              conversation.peerOnline ?? peer.online ?? false,
            );
          }
          return next;
        });
        setTypingById((prev) => {
          const next = { ...prev };
          for (const conversation of normalized) {
            next[conversation._id] = Boolean(conversation.peerTyping);
          }
          return next;
        });
      }
    } finally {
      if (!opts?.silent) setLoadingList(false);
    }
  }, [bumpUnread, userId]);

  const appendMessage = useCallback((conversationId: string, msg: ChatMessage) => {
    const id = String(conversationId);
    const normalized = normalizeMessage(msg);
    setMessagesById((prev) => {
      const list = prev[id] || [];
      if (list.some((m) => m._id === normalized._id)) return prev;
      return { ...prev, [id]: [...list, normalized] };
    });
  }, []);

  const loadMessages = useCallback(
    async (
      conversationId: string,
      cursor?: string,
      opts?: { silent?: boolean },
    ) => {
      const id = String(conversationId);
      if (!opts?.silent) setLoadingThread(true);
      try {
        const params = new URLSearchParams({ limit: "40" });
        if (cursor) params.set("cursor", cursor);
        const res = await authFetch(`/api/chat/messages/${id}?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load");
        const msgs = (data.messages || []).map(normalizeMessage);
        setMessagesById((prev) => {
          if (cursor) {
            const existing = prev[id] || [];
            const merged = [...msgs, ...existing];
            const seen = new Set<string>();
            return {
              ...prev,
              [id]: merged.filter((m) => {
                if (seen.has(m._id)) return false;
                seen.add(m._id);
                return true;
              }),
            };
          }
          // Silent refresh: merge new messages without wiping local optimistic ones
          if (opts?.silent) {
            const existing = prev[id] || [];
            const byId = new Map(existing.map((m) => [m._id, m]));
            for (const m of msgs) byId.set(m._id, m);
            const merged = [...byId.values()].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
            return { ...prev, [id]: merged };
          }
          return { ...prev, [id]: msgs };
        });
        if (!opts?.silent) {
          setCursorById((p) => ({ ...p, [id]: data.nextCursor || null }));
          setHasMoreById((p) => ({ ...p, [id]: Boolean(data.hasMore) }));
        }
      } finally {
        if (!opts?.silent) setLoadingThread(false);
      }
    },
    [],
  );

  const markRead = useCallback(
    async (conversationId: string) => {
      const id = String(conversationId);
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit("join-conversation", { conversationId: id });
        socket.emit("mark-read", { conversationId: id });
      } else {
        await authFetch("/api/chat/messages/read", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: id }),
        });
      }
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c)),
      );
      void refreshUnread();
    },
    [refreshUnread],
  );

  const ensureConversationInList = useCallback(async (conversationId: string) => {
    const id = String(conversationId);
    const res = await authFetch(`/api/chat/conversations/${id}`);
    const data = await res.json();
    if (!res.ok || !data.conversation) {
      await loadConversations();
      return;
    }
    const conv = normalizeConversation(data.conversation);
    setConversations((prev) => {
      const exists = prev.some((c) => c._id === id);
      if (exists) {
        return prev.map((c) => (c._id === id ? { ...c, ...conv } : c));
      }
      return [conv, ...prev];
    });
  }, [loadConversations]);

  const openConversation = useCallback(
    async (conversationId: string, opts?: { floating?: boolean }) => {
      const id = String(conversationId);
      const useFloating = opts?.floating ?? false;
      const isMobile =
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 767px)").matches;

      // Open UI immediately so clicks always feel responsive
      if (useFloating && !isMobile) {
        setFloatingIds((prev) => {
          const next = [id, ...prev.filter((x) => x !== id)].slice(
            0,
            MAX_FLOATING,
          );
          return next;
        });
        setMinimizedIds((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
        setPanelOpen(false);
      } else {
        setActiveId(id);
        setPanelView("thread");
        setPanelOpen(true);
      }

      try {
        await ensureConversationInList(id);
        await loadMessages(id);
        await markRead(id);
      } catch (err) {
        console.error("[chat] openConversation failed", err);
        // Keep window open; show empty/error state via existing loading flags
      }
    },
    [ensureConversationInList, loadMessages, markRead],
  );

  const openPanel = useCallback(() => {
    const uid = currentUserId();
    if (!uid) {
      router.push(`/login?next=${encodeURIComponent("/")}`);
      return;
    }
    try {
      localStorage.setItem("sparesx_chat_visited", "1");
      localStorage.removeItem("sparesx_chat_fab_hidden");
    } catch {
      // ignore
    }
    setUserId(uid);
    setPanelOpen(true);
    setPanelView("list");
    setActiveId(null);
    void loadConversations();
  }, [loadConversations, router]);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setPanelView("list");
    setActiveId(null);
  }, []);

  const backToList = useCallback(() => {
    setPanelView("list");
    setActiveId(null);
    void loadConversations();
  }, [loadConversations]);

  const startChat = useCallback(
    async (peerId: string, productId?: string) => {
      const uid = currentUserId();
      if (!uid) {
        router.push(`/login?next=${encodeURIComponent("/")}`);
        return;
      }
      setUserId(uid);
      if (String(peerId) === String(uid)) {
        alert("You cannot message yourself.");
        return;
      }

      // Show inbox immediately while conversation is created
      setPanelOpen(true);
      setPanelView("list");
      setLoadingList(true);

      try {
        const res = await authFetch("/api/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ peerId, productId }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to start chat");
        }
        const id = String(data.conversation._id);
        await loadConversations();
        const isMobile = window.matchMedia("(max-width: 767px)").matches;
        await openConversation(id, { floating: !isMobile });
      } catch (err) {
        console.error("[chat] startChat failed", err);
        alert(
          err instanceof Error
            ? err.message
            : "Could not start chat. Please try again.",
        );
        setPanelOpen(true);
        setPanelView("list");
      } finally {
        setLoadingList(false);
      }
    },
    [loadConversations, openConversation, router],
  );

  const closeFloating = useCallback((id: string) => {
    const cid = String(id);
    setFloatingIds((prev) => prev.filter((x) => x !== cid));
    setMinimizedIds((prev) => {
      const n = new Set(prev);
      n.delete(cid);
      return n;
    });
    socketRef.current?.emit("leave-conversation", { conversationId: cid });
  }, []);

  const minimizeFloating = useCallback((id: string) => {
    setMinimizedIds((prev) => new Set(prev).add(String(id)));
  }, []);

  const restoreFloating = useCallback((id: string) => {
    const cid = String(id);
    setMinimizedIds((prev) => {
      const n = new Set(prev);
      n.delete(cid);
      return n;
    });
    void markRead(cid);
  }, [markRead]);

  const sendText = useCallback(
    async (conversationId: string, text: string) => {
      const id = String(conversationId);
      const clean = text.trim();
      if (!clean) return;
      const peer = conversations.find((c) => c._id === id)?.peer;
      const socket = socketRef.current;
      if (typingTimers.current[id]) {
        clearTimeout(typingTimers.current[id]);
        delete typingTimers.current[id];
      }
      if (socket?.connected && peer?._id) {
        socket.emit("typing-stop", { conversationId: id, peerId: peer._id });
      } else {
        void authFetch("/api/chat/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: id, typing: false }),
        }).catch(() => {});
      }

      // Optimistic placeholder
      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessage = {
        _id: tempId,
        conversationId: id,
        senderId: userId || "",
        receiverId: peer?._id || "",
        type: "text",
        text: clean,
        delivered: false,
        read: false,
        createdAt: new Date().toISOString(),
      };
      appendMessage(id, optimistic);

      try {
        if (socket?.connected) {
          await new Promise<void>((resolve, reject) => {
            socket
              .timeout(8000)
              .emit(
                "send-message",
                {
                  conversationId: id,
                  type: "text",
                  text: clean,
                  peerId: peer?._id,
                },
                (err: Error | null, res: any) => {
                  if (err || !res?.ok) {
                    reject(err || new Error(res?.message || "Send failed"));
                    return;
                  }
                  if (res.message) {
                    setMessagesById((prev) => {
                      const list = (prev[id] || []).filter((m) => m._id !== tempId);
                      const msg = normalizeMessage(res.message);
                      if (!list.some((m) => m._id === msg._id)) list.push(msg);
                      return { ...prev, [id]: list };
                    });
                  }
                  resolve();
                },
              );
          });
        } else {
          const res = await authFetch("/api/chat/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId: id, type: "text", text: clean }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Send failed");
          setMessagesById((prev) => {
            const list = (prev[id] || []).filter((m) => m._id !== tempId);
            list.push(normalizeMessage(data.message));
            return { ...prev, [id]: list };
          });
        }
        void loadConversations();
      } catch {
        setMessagesById((prev) => ({
          ...prev,
          [id]: (prev[id] || []).filter((m) => m._id !== tempId),
        }));
        throw new Error("Failed to send");
      }
    },
    [appendMessage, conversations, loadConversations, userId],
  );

  const sendImage = useCallback(
    async (conversationId: string, mediaUrl: string) => {
      const id = String(conversationId);
      if (!mediaUrl) return;
      const peer = conversations.find((c) => c._id === id)?.peer;
      const socket = socketRef.current;
      if (typingTimers.current[id]) {
        clearTimeout(typingTimers.current[id]);
        delete typingTimers.current[id];
      }
      if (socket?.connected && peer?._id) {
        socket.emit("typing-stop", { conversationId: id, peerId: peer._id });
      }
      if (socket?.connected) {
        await new Promise<void>((resolve, reject) => {
          socket.timeout(8000).emit(
            "send-message",
            {
              conversationId: id,
              type: "image",
              mediaUrl,
              peerId: peer?._id,
            },
            (err: Error | null, res: any) => {
              if (err || !res?.ok) reject(err || new Error("Send failed"));
              else {
                if (res.message) appendMessage(id, res.message);
                resolve();
              }
            },
          );
        });
      } else {
        const res = await authFetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: id,
            type: "image",
            mediaUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Send failed");
        appendMessage(id, data.message);
      }
      void loadConversations();
    },
    [appendMessage, conversations, loadConversations],
  );

  const onTyping = useCallback(
    (conversationId: string) => {
      const id = String(conversationId);
      const peer = conversations.find((c) => c._id === id)?.peer;
      const socket = socketRef.current;
      prepareChatSound();

      if (socket?.connected && peer?._id) {
        socket.emit("typing-start", { conversationId: id, peerId: peer._id });
        if (typingTimers.current[id]) clearTimeout(typingTimers.current[id]);
        typingTimers.current[id] = setTimeout(() => {
          socket.emit("typing-stop", { conversationId: id, peerId: peer._id });
        }, 1200);
        return;
      }

      // Vercel REST fallback
      void authFetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id, typing: true }),
      }).catch(() => {});
      if (typingTimers.current[id]) clearTimeout(typingTimers.current[id]);
      typingTimers.current[id] = setTimeout(() => {
        void authFetch("/api/chat/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: id, typing: false }),
        }).catch(() => {});
      }, 1500);
    },
    [conversations],
  );

  const loadOlder = useCallback(
    async (conversationId: string) => {
      const id = String(conversationId);
      const cursor = cursorById[id];
      if (!cursor) return;
      await loadMessages(id, cursor);
    },
    [cursorById, loadMessages],
  );

  const getConversation = useCallback(
    (id: string) => conversations.find((c) => c._id === String(id)),
    [conversations],
  );

  useEffect(() => {
    const syncAuth = () => {
      void resolveSessionUserId().then((id) => setUserId(id));
    };
    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("focus", syncAuth);
    window.addEventListener("sparesx-auth-changed", syncAuth);

    const onPageHide = () => {
      void announceChatOffline();
      try {
        socketRef.current?.disconnect();
      } catch {
        // ignore
      }
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("focus", syncAuth);
      window.removeEventListener("sparesx-auth-changed", syncAuth);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  // Auth + socket lifecycle
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const uid =
        currentUserIdFromToken() || (await resolveSessionUserId());
      if (cancelled) return;
      setUserId(uid);
      if (!uid) {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocketConnected(false);
        return;
      }

      void loadConversations();
      void refreshUnread();

      const socketUrl = getSocketUrl();
      if (!socketUrl) {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocketConnected(false);
        return;
      }

      const token = getAccessToken();
      let socket = socketRef.current;
      if (!socket || !socket.connected) {
        socket = io(socketUrl, {
          auth: token ? { token } : {},
          withCredentials: true,
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 500,
          reconnectionDelayMax: 3000,
          timeout: 10000,
        });
        socketRef.current = socket;
        (globalThis as any).__sparesx_socket = socket;
      }

      const onConnect = () => setSocketConnected(true);
      const onDisconnect = () => setSocketConnected(false);
      const onConnectError = (error: Error) => {
        console.error("[chat] socket connect_error", error.message);
        setSocketConnected(false);
      };
      const onPresenceSnapshot = (payload: { userIds?: string[] }) => {
        const ids = new Set((payload.userIds || []).map(String));
        setOnlineMap((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            next[key] = ids.has(key);
          }
          for (const id of ids) {
            if (id !== String(uid)) next[id] = true;
          }
          return next;
        });
      };

      const isViewing = (conversationId: string) => {
        const id = String(conversationId);
        if (activeIdRef.current === id && panelOpenRef.current) return true;
        return (
          floatingRef.current.includes(id) && !minimizedRef.current.has(id)
        );
      };

      const onNew = (payload: {
        message: ChatMessage;
        conversationId: string;
      }) => {
        const cid = String(payload.conversationId);
        const msg = normalizeMessage(payload.message);
        appendMessage(cid, msg);

        const mine = String(msg.senderId) === String(uid);
        if (!mine) {
          playMessageSound();
          if (isViewing(cid)) {
            socket?.emit("mark-read", { conversationId: cid });
          } else {
            setConversations((prev) => {
              const exists = prev.some((c) => c._id === cid);
              if (!exists) {
                void loadConversations();
                return prev;
              }
              return prev
                .map((c) =>
                  c._id === cid
                    ? {
                        ...c,
                        lastMessage:
                          msg.type === "image" ? "📷 Photo" : msg.text,
                        lastMessageTime: msg.createdAt,
                        unreadCount: (c.unreadCount || 0) + 1,
                      }
                    : c,
                )
                .sort(
                  (a, b) =>
                    new Date(b.lastMessageTime || 0).getTime() -
                    new Date(a.lastMessageTime || 0).getTime(),
                );
            });
            void refreshUnread();
          }
        }
      };

      const onSent = (payload: {
        message: ChatMessage;
        conversationId: string;
      }) => {
        appendMessage(String(payload.conversationId), payload.message);
        void loadConversations();
      };

      const onDelivered = (payload: { messageId: string }) => {
        const mid = String(payload.messageId);
        setMessagesById((prev) => {
          const next: typeof prev = {};
          for (const [cid, list] of Object.entries(prev)) {
            next[cid] = list.map((m) =>
              m._id === mid ? { ...m, delivered: true } : m,
            );
          }
          return next;
        });
      };

      const onRead = (payload: { conversationId: string }) => {
        const cid = String(payload.conversationId);
        setMessagesById((prev) => ({
          ...prev,
          [cid]: (prev[cid] || []).map((m) =>
            String(m.senderId) === String(uid)
              ? { ...m, read: true, delivered: true }
              : m,
          ),
        }));
      };

      const onTyping = (payload: {
        conversationId: string;
        userId: string;
      }) => {
        if (String(payload.userId) === String(uid)) return;
        const cid = String(payload.conversationId);
        setTypingById((p) => ({ ...p, [cid]: true }));
        if (remoteTypingTimers.current[cid]) {
          clearTimeout(remoteTypingTimers.current[cid]);
        }
        remoteTypingTimers.current[cid] = setTimeout(() => {
          setTypingById((p) => ({ ...p, [cid]: false }));
        }, 1800);
      };
      const onStopTyping = (payload: { conversationId: string }) => {
        const cid = String(payload.conversationId);
        if (remoteTypingTimers.current[cid]) {
          clearTimeout(remoteTypingTimers.current[cid]);
          delete remoteTypingTimers.current[cid];
        }
        setTypingById((p) => ({
          ...p,
          [cid]: false,
        }));
      };
      const onOnline = (p: { userId: string }) =>
        setOnlineMap((m) => ({ ...m, [p.userId]: true }));
      const onOffline = (p: { userId: string }) =>
        setOnlineMap((m) => ({ ...m, [p.userId]: false }));
      const onConversationUpdated = () => {
        void loadConversations();
      };

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("connect_error", onConnectError);
      socket.on("presence-snapshot", onPresenceSnapshot);
      socket.on("new-message", onNew);
      socket.on("message-sent", onSent);
      socket.on("message-delivered", onDelivered);
      socket.on("message-read", onRead);
      socket.on("typing", onTyping);
      socket.on("stop-typing", onStopTyping);
      socket.on("user-online", onOnline);
      socket.on("user-offline", onOffline);
      socket.on("conversation-updated", onConversationUpdated);
      if (socket.connected) setSocketConnected(true);

      const poll = setInterval(refreshUnread, 20000);

      cleanup = () => {
        clearInterval(poll);
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onConnectError);
        socket.off("presence-snapshot", onPresenceSnapshot);
        socket.off("new-message", onNew);
        socket.off("message-sent", onSent);
        socket.off("message-delivered", onDelivered);
        socket.off("message-read", onRead);
        socket.off("typing", onTyping);
        socket.off("stop-typing", onStopTyping);
        socket.off("user-online", onOnline);
        socket.off("user-offline", onOffline);
        socket.off("conversation-updated", onConversationUpdated);
        Object.values(remoteTypingTimers.current).forEach(clearTimeout);
        remoteTypingTimers.current = {};
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendMessage, loadConversations, refreshUnread, userId]);

  // Vercel-safe REST realtime: presence heartbeat + poll open threads
  useEffect(() => {
    if (!userId || socketConnected) return;

    const heartbeat = () => {
      void authFetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => {});
    };

    heartbeat();
    const presenceTimer = setInterval(heartbeat, 25000);
    const listTimer = setInterval(() => {
      void loadConversations({ silent: true });
      void refreshUnread();
    }, 4000);

    const openIds = () => {
      const ids = new Set<string>();
      if (activeIdRef.current && panelOpenRef.current) {
        ids.add(activeIdRef.current);
      }
      for (const id of floatingRef.current) {
        if (!minimizedRef.current.has(id)) ids.add(id);
      }
      return [...ids];
    };

    const threadTimer = setInterval(() => {
      for (const id of openIds()) {
        void loadMessages(id, undefined, { silent: true });
      }
    }, 2000);

    return () => {
      clearInterval(presenceTimer);
      clearInterval(listTimer);
      clearInterval(threadTimer);
    };
  }, [userId, socketConnected, loadConversations, loadMessages, refreshUnread]);

  // Live for UI: socket OR Vercel REST sync path
  const connected = socketConnected || Boolean(userId && !getSocketUrl());

  // Custom event for product buttons / navbar / deep-links
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      try {
        if (detail.peerId) {
          void startChat(String(detail.peerId), detail.productId).catch(
            (err) => {
              console.error(err);
              alert(
                err instanceof Error ? err.message : "Could not open chat",
              );
            },
          );
        } else if (detail.conversationId) {
          const isMobile = window.matchMedia("(max-width: 767px)").matches;
          void openConversation(String(detail.conversationId), {
            floating: !isMobile,
          });
        } else {
          openPanel();
        }
      } catch (err) {
        console.error("[chat] open event failed", err);
        openPanel();
      }
    };
    window.addEventListener("sparesx-open-chat", handler as EventListener);
    return () =>
      window.removeEventListener("sparesx-open-chat", handler as EventListener);
  }, [openConversation, openPanel, startChat]);

  const value = useMemo<ChatContextValue>(
    () => ({
      userId,
      connected,
      unreadTotal,
      conversations,
      loadingList,
      panelOpen,
      panelView,
      activeId,
      floatingIds,
      minimizedIds,
      messagesById,
      typingById,
      onlineMap,
      loadingThread,
      openPanel,
      closePanel,
      backToList,
      openConversation,
      startChat,
      closeFloating,
      minimizeFloating,
      restoreFloating,
      sendText,
      sendImage,
      onTyping,
      loadOlder,
      hasMoreById,
      getConversation,
    }),
    [
      userId,
      connected,
      unreadTotal,
      conversations,
      loadingList,
      panelOpen,
      panelView,
      activeId,
      floatingIds,
      minimizedIds,
      messagesById,
      typingById,
      onlineMap,
      loadingThread,
      openPanel,
      closePanel,
      backToList,
      openConversation,
      startChat,
      closeFloating,
      minimizeFloating,
      restoreFloating,
      sendText,
      sendImage,
      onTyping,
      loadOlder,
      hasMoreById,
      getConversation,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
