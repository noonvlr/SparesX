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
import { playMessageSound, prepareChatSound, installChatSoundUnlock } from "@/lib/chat/sound";
import { getSocketUrl } from "@/lib/chat/socketUrl";
import { announceChatOffline } from "@/lib/chat/announceOffline";
import { authFetch, getCachedUserId, resolveSessionUserId } from "@/lib/auth/clientAuth";
import { showToast } from "@/components/ToastHost";
import { createAdaptivePoller, type AdaptivePoller } from "@/lib/chat/poller";
import { createTypingThrottle, type TypingThrottle } from "@/lib/chat/typingThrottle";
import {
  detectIncoming,
  incomingToastText,
  type InboxSnapshot,
} from "@/lib/chat/incoming";
import { isPending, mergeThread } from "@/lib/chat/sendReconcile";
import { createSendGuard, runRetry, runSend } from "@/lib/chat/sendGuard";
import { deriveSyncStatus, type ChatSyncStatus } from "@/lib/chat/syncStatus";
import { PRESENCE_HEARTBEAT_MS } from "@/lib/chat/presenceRules";

const MAX_FLOATING = 3;

/** REST sync cadence (production has no socket server). */
const INBOX_POLL_MS = 4_000;
const INBOX_IDLE_POLL_MS = 12_000;
const THREAD_POLL_MS = 2_000;
const THREAD_IDLE_POLL_MS = 6_000;
/** No user activity and no changes for this long → idle cadence. */
const IDLE_AFTER_MS = 60_000;
const MAX_BACKOFF_MS = 60_000;
const ACTIVITY_POKE_THROTTLE_MS = 5_000;

function currentUserId(): string | null {
  return getCachedUserId();
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
    lastMessageSenderId: raw?.lastMessageSenderId
      ? String(raw.lastMessageSenderId)
      : undefined,
    unreadCount: raw?.unreadCount || 0,
    peerOnline: Boolean(raw?.peerOnline ?? peer?.online),
    peerTyping: Boolean(raw?.peerTyping),
  };
}

function inboxSignature(list: ChatConversation[]): string {
  return list
    .map((c) =>
      [
        c._id,
        c.lastMessageTime || "",
        c.unreadCount || 0,
        c.peerTyping ? 1 : 0,
        c.peerOnline ? 1 : 0,
        c.lastMessage || "",
      ].join("|"),
    )
    .join(";");
}

function threadSignature(list: ChatMessage[]): string {
  return list
    .map((m) => `${m._id}:${m.read ? 1 : 0}${m.delivered ? 1 : 0}`)
    .join(",");
}

async function readJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function friendlySendError(err: unknown, what = "Message"): string {
  const message = err instanceof Error ? err.message : "";
  if (!message || /failed to fetch|network|load failed|timed out/i.test(message)) {
    return `No connection — ${what.toLowerCase()} not sent.`;
  }
  return message;
}

function newClientId() {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type PanelView = "list" | "thread";

type ChatContextValue = {
  userId: string | null;
  /** True when messages are syncing (socket live, or REST sync healthy). */
  connected: boolean;
  syncStatus: ChatSyncStatus;
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
  retrySend: (conversationId: string, clientId: string) => Promise<void>;
  discardFailed: (conversationId: string, clientId: string) => void;
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
  const [hidden, setHidden] = useState(false);
  const [browserOnline, setBrowserOnline] = useState(true);
  const [restFailures, setRestFailures] = useState(0);
  const [restSynced, setRestSynced] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const floatingRef = useRef<string[]>([]);
  const minimizedRef = useRef<Set<string>>(new Set());
  const panelOpenRef = useRef(false);
  const userIdRef = useRef<string | null>(userId);
  const socketConnectedRef = useRef(false);
  const conversationsRef = useRef<ChatConversation[]>([]);
  const messagesRef = useRef<Record<string, ChatMessage[]>>({});
  const openIdsRef = useRef<string[]>([]);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const remoteTypingTimers = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const typingThrottles = useRef<Record<string, TypingThrottle>>({});
  const inboxSnapshotRef = useRef<InboxSnapshot | null>(null);
  const inboxSigRef = useRef<string>("");
  const lastUnreadRef = useRef<number | null>(null);
  const threadSigRef = useRef<Record<string, string>>({});
  const readThroughRef = useRef<Record<string, number>>({});
  const markReadInFlight = useRef<Set<string>>(new Set());
  const sendGuard = useRef(createSendGuard());
  const viewingSentRef = useRef<Set<string>>(new Set());
  const inboxPollerRef = useRef<AdaptivePoller | null>(null);
  const threadPollerRef = useRef<AdaptivePoller | null>(null);
  const presencePollerRef = useRef<AdaptivePoller | null>(null);

  activeIdRef.current = activeId;
  floatingRef.current = floatingIds;
  minimizedRef.current = minimizedIds;
  panelOpenRef.current = panelOpen;
  userIdRef.current = userId;
  socketConnectedRef.current = socketConnected;
  conversationsRef.current = conversations;
  messagesRef.current = messagesById;

  const openThreadIds = useMemo(() => {
    const ids = new Set<string>();
    if (activeId && panelOpen) ids.add(activeId);
    for (const id of floatingIds) {
      if (!minimizedIds.has(id)) ids.add(id);
    }
    return [...ids];
  }, [activeId, panelOpen, floatingIds, minimizedIds]);
  openIdsRef.current = openThreadIds;
  const openThreadKey = openThreadIds.slice().sort().join(",");
  const hasOpenThreads = openThreadIds.length > 0;

  /** Thread window is on screen (panel thread or non-minimized floating). */
  const isThreadOpen = useCallback((conversationId: string) => {
    const id = String(conversationId);
    if (activeIdRef.current === id && panelOpenRef.current) return true;
    return floatingRef.current.includes(id) && !minimizedRef.current.has(id);
  }, []);

  /** Open and the tab is actually visible. */
  const isViewing = useCallback(
    (conversationId: string) =>
      isThreadOpen(conversationId) &&
      typeof document !== "undefined" &&
      document.visibilityState === "visible",
    [isThreadOpen],
  );

  const bumpUnread = useCallback((n: number) => {
    setUnreadTotal(n);
    if (lastUnreadRef.current === n) return;
    lastUnreadRef.current = n;
    window.dispatchEvent(
      new CustomEvent("chat-unread-updated", { detail: { unreadTotal: n } }),
    );
  }, []);

  /** Socket mode only — REST gets the total from the inbox / read responses. */
  const refreshUnread = useCallback(async () => {
    try {
      const res = await authFetch("/api/chat/unread-count");
      const data = await readJson(res);
      if (res.ok) bumpUnread(data.unreadTotal || 0);
    } catch {
      // ignore
    }
  }, [bumpUnread]);

  const loadConversations = useCallback(
    async (opts?: { silent?: boolean; throwOnError?: boolean }) => {
      if (!opts?.silent) setLoadingList(true);
      try {
        const res = await authFetch("/api/chat/conversations?limit=50");
        const data = await readJson(res);
        if (!res.ok) {
          if (opts?.throwOnError) {
            throw new Error(data.message || "Failed to load conversations");
          }
          return false;
        }
        const normalized: ChatConversation[] = (data.conversations || []).map(
          normalizeConversation,
        );
        const sig = inboxSignature(normalized);
        const changed = sig !== inboxSigRef.current;
        inboxSigRef.current = sig;
        bumpUnread(data.unreadTotal || 0);

        if (changed) {
          setConversations(normalized);
          setOnlineMap((prev) => {
            const next = { ...prev };
            for (const conversation of normalized) {
              const peer =
                conversation.peer ||
                conversation.participants?.find(
                  (p: { _id: string }) =>
                    String(p._id) !== String(userIdRef.current),
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

        const uid = userIdRef.current;
        if (uid && !socketConnectedRef.current) {
          const viewingIds = new Set(
            normalized.map((c) => c._id).filter((id) => isViewing(id)),
          );
          const { incoming, snapshot } = detectIncoming(
            inboxSnapshotRef.current,
            normalized,
            { userId: uid, viewingIds },
          );
          inboxSnapshotRef.current = snapshot;
          if (incoming.length > 0) {
            playMessageSound();
            showToast(incomingToastText(incoming), "info", 3500);
          }
        }
        return changed;
      } catch (err) {
        if (opts?.throwOnError) throw err;
        return false;
      } finally {
        if (!opts?.silent) setLoadingList(false);
      }
    },
    [bumpUnread, isViewing],
  );

  const appendMessage = useCallback((conversationId: string, msg: ChatMessage) => {
    const id = String(conversationId);
    const normalized = normalizeMessage(msg);
    setMessagesById((prev) => {
      const list = prev[id] || [];
      if (list.some((m) => m._id === normalized._id)) return prev;
      return { ...prev, [id]: [...list, normalized] };
    });
  }, []);

  const markRead = useCallback(
    async (conversationId: string, opts?: { opened?: boolean }) => {
      const id = String(conversationId);
      const opened = opts?.opened ?? true;
      if (!opened && markReadInFlight.current.has(id)) return;
      markReadInFlight.current.add(id);
      const uid = userIdRef.current;
      const through = (messagesRef.current[id] || [])
        .filter((m) => m.receiverId === uid && !isPending(m))
        .reduce((max, m) => Math.max(max, new Date(m.createdAt).getTime()), 0);
      try {
        const socket = socketRef.current;
        if (socket?.connected) {
          socket.emit("join-conversation", { conversationId: id });
          socket.emit("mark-read", { conversationId: id });
          void refreshUnread();
        } else {
          const res = await authFetch("/api/chat/messages/read", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId: id, opened }),
          });
          const data = await readJson(res);
          if (!res.ok) return;
          if (typeof data.unreadTotal === "number") bumpUnread(data.unreadTotal);
          readThroughRef.current[id] = Math.max(
            readThroughRef.current[id] || 0,
            through,
          );
        }
        setConversations((prev) =>
          prev.map((c) => (c._id === id && c.unreadCount ? { ...c, unreadCount: 0 } : c)),
        );
        setMessagesById((prev) => {
          const list = prev[id];
          if (!list?.some((m) => m.receiverId === uid && !m.read)) return prev;
          return {
            ...prev,
            [id]: list.map((m) =>
              m.receiverId === uid && !m.read
                ? { ...m, read: true, delivered: true }
                : m,
            ),
          };
        });
      } catch {
        // next poll retries
      } finally {
        markReadInFlight.current.delete(id);
      }
    },
    [bumpUnread, refreshUnread],
  );

  const loadMessages = useCallback(
    async (
      conversationId: string,
      cursor?: string,
      opts?: { silent?: boolean; throwOnError?: boolean },
    ) => {
      const id = String(conversationId);
      if (!opts?.silent) setLoadingThread(true);
      try {
        const params = new URLSearchParams({ limit: "40" });
        if (cursor) params.set("cursor", cursor);
        const res = await authFetch(`/api/chat/messages/${id}?${params}`);
        const data = await readJson(res);
        if (!res.ok) {
          if (opts?.throwOnError || !opts?.silent) {
            throw new Error(data.message || "Failed to load");
          }
          return false;
        }
        const msgs: ChatMessage[] = (data.messages || []).map(normalizeMessage);

        if (cursor) {
          setMessagesById((prev) => {
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
          });
          setCursorById((p) => ({ ...p, [id]: data.nextCursor || null }));
          setHasMoreById((p) => ({ ...p, [id]: Boolean(data.hasMore) }));
          return true;
        }

        const sig = threadSignature(msgs);
        const changed = sig !== threadSigRef.current[id];
        threadSigRef.current[id] = sig;
        const hasPending = (messagesRef.current[id] || []).some(isPending);

        if (!opts?.silent || changed || hasPending) {
          setMessagesById((prev) => {
            const base = opts?.silent ? prev[id] || [] : (prev[id] || []).filter(isPending);
            const { messages, resolvedClientIds: resolved } = mergeThread(base, msgs);
            for (const clientId of resolved) sendGuard.current.resolve(clientId);
            return { ...prev, [id]: messages };
          });
        }
        if (!opts?.silent) {
          setCursorById((p) => ({ ...p, [id]: data.nextCursor || null }));
          setHasMoreById((p) => ({ ...p, [id]: Boolean(data.hasMore) }));
        }
        if (typeof data.peerTyping === "boolean") {
          const typing = data.peerTyping;
          setTypingById((p) => (p[id] === typing ? p : { ...p, [id]: typing }));
        }

        // Keep read receipts current while the thread is on screen.
        const uid = userIdRef.current;
        if (opts?.silent && uid && !socketConnectedRef.current && isViewing(id)) {
          const readThrough = readThroughRef.current[id] || 0;
          const needsRead = msgs.some(
            (m) =>
              m.receiverId === uid &&
              !m.read &&
              new Date(m.createdAt).getTime() > readThrough,
          );
          if (needsRead) void markRead(id, { opened: false });
        }
        return changed;
      } finally {
        if (!opts?.silent) setLoadingThread(false);
      }
    },
    [isViewing, markRead],
  );

  const ensureConversationInList = useCallback(async (conversationId: string) => {
    const id = String(conversationId);
    const res = await authFetch(`/api/chat/conversations/${id}`);
    const data = await readJson(res);
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

  const stopTypingFor = useCallback(
    (conversationId: string, opts?: { notify?: boolean }) => {
      const id = String(conversationId);
      const socket = socketRef.current;
      if (typingTimers.current[id]) {
        clearTimeout(typingTimers.current[id]);
        delete typingTimers.current[id];
      }
      if (socket?.connected) {
        const peer = conversationsRef.current.find((c) => c._id === id)?.peer;
        if (peer?._id) {
          socket.emit("typing-stop", { conversationId: id, peerId: peer._id });
        }
        return;
      }
      typingThrottles.current[id]?.stop({ notify: opts?.notify });
    },
    [],
  );

  const closePanel = useCallback(() => {
    if (activeIdRef.current) stopTypingFor(activeIdRef.current, { notify: true });
    setPanelOpen(false);
    setPanelView("list");
    setActiveId(null);
  }, [stopTypingFor]);

  const backToList = useCallback(() => {
    if (activeIdRef.current) stopTypingFor(activeIdRef.current, { notify: true });
    setPanelView("list");
    setActiveId(null);
    void loadConversations();
  }, [loadConversations, stopTypingFor]);

  const startChat = useCallback(
    async (peerId: string, productId?: string) => {
      const uid = currentUserId();
      if (!uid) {
        router.push(`/login?next=${encodeURIComponent("/")}`);
        return;
      }
      setUserId(uid);
      if (String(peerId) === String(uid)) {
        showToast("You cannot message yourself.", "error", 3000);
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
        const data = await readJson(res);
        if (!res.ok) {
          throw new Error(data.message || "Failed to start chat");
        }
        const id = String(data.conversation._id);
        await loadConversations();
        const isMobile = window.matchMedia("(max-width: 767px)").matches;
        await openConversation(id, { floating: !isMobile });
      } catch (err) {
        console.error("[chat] startChat failed", err);
        showToast(
          err instanceof Error
            ? err.message
            : "Could not start chat. Please try again.",
          "error",
          3500,
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
    stopTypingFor(cid, { notify: true });
    setFloatingIds((prev) => prev.filter((x) => x !== cid));
    setMinimizedIds((prev) => {
      const n = new Set(prev);
      n.delete(cid);
      return n;
    });
    socketRef.current?.emit("leave-conversation", { conversationId: cid });
  }, [stopTypingFor]);

  const minimizeFloating = useCallback((id: string) => {
    stopTypingFor(String(id), { notify: true });
    setMinimizedIds((prev) => new Set(prev).add(String(id)));
  }, [stopTypingFor]);

  const restoreFloating = useCallback((id: string) => {
    const cid = String(id);
    setMinimizedIds((prev) => {
      const n = new Set(prev);
      n.delete(cid);
      return n;
    });
    void markRead(cid);
  }, [markRead]);

  const updatePending = useCallback(
    (conversationId: string, clientId: string, patch: Partial<ChatMessage>) => {
      setMessagesById((prev) => {
        const list = prev[conversationId];
        if (!list?.some((m) => (m.clientId || m._id) === clientId)) return prev;
        return {
          ...prev,
          [conversationId]: list.map((m) =>
            (m.clientId || m._id) === clientId ? { ...m, ...patch } : m,
          ),
        };
      });
    },
    [],
  );

  const refreshInboxSoon = useCallback(() => {
    inboxPollerRef.current?.poke();
    threadPollerRef.current?.poke();
    if (inboxPollerRef.current) inboxPollerRef.current.trigger();
    else void loadConversations({ silent: true });
  }, [loadConversations]);

  const deliver = useCallback(
    async (conversationId: string, pending: ChatMessage): Promise<ChatMessage> => {
      const peer = conversationsRef.current.find((c) => c._id === conversationId)?.peer;
      const socket = socketRef.current;
      const payload = {
        conversationId,
        type: pending.type,
        ...(pending.type === "image"
          ? { mediaUrl: pending.mediaUrl }
          : { text: pending.text }),
      };
      if (socket?.connected) {
        return new Promise<ChatMessage>((resolve, reject) => {
          socket
            .timeout(8000)
            .emit(
              "send-message",
              { ...payload, peerId: peer?._id },
              (err: Error | null, res: any) => {
                if (err || !res?.ok || !res.message) {
                  reject(err || new Error(res?.message || "Message not sent"));
                  return;
                }
                resolve(normalizeMessage(res.message));
              },
            );
        });
      }
      const res = await authFetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJson(res);
      if (!res.ok || !data.message) {
        throw new Error(data.message || "Message not sent");
      }
      return normalizeMessage(data.message);
    },
    [],
  );

  const attemptSend = useCallback(
    (conversationId: string, pending: ChatMessage) => {
      const id = conversationId;
      const clientId = pending.clientId || pending._id;
      return runSend({
        clientId,
        guard: sendGuard.current,
        deliver: () => deliver(id, pending),
        onSending: () =>
          updatePending(id, clientId, {
            clientStatus: "sending",
            clientError: undefined,
          }),
        onSuccess: (saved) => {
          setMessagesById((prev) => {
            const list = (prev[id] || []).filter(
              (m) => (m.clientId || m._id) !== clientId,
            );
            if (!list.some((m) => m._id === saved._id)) list.push(saved);
            return { ...prev, [id]: list };
          });
          refreshInboxSoon();
        },
        onFailure: (err) => {
          const message = friendlySendError(err);
          updatePending(id, clientId, { clientStatus: "failed", clientError: message });
          showToast(message, "error", 4000);
        },
      });
    },
    [deliver, refreshInboxSoon, updatePending],
  );

  const sendText = useCallback(
    async (conversationId: string, text: string) => {
      const id = String(conversationId);
      const clean = text.trim();
      if (!clean) return;
      const peer = conversationsRef.current.find((c) => c._id === id)?.peer;
      // Server clears the sender's typing state when the message lands.
      stopTypingFor(id);

      const clientId = newClientId();
      const optimistic: ChatMessage = {
        _id: clientId,
        clientId,
        clientStatus: "sending",
        conversationId: id,
        senderId: userIdRef.current || "",
        receiverId: peer?._id || "",
        type: "text",
        text: clean,
        delivered: false,
        read: false,
        createdAt: new Date().toISOString(),
      };
      appendMessage(id, optimistic);
      await attemptSend(id, optimistic);
    },
    [appendMessage, attemptSend, stopTypingFor],
  );

  const retrySend = useCallback(
    async (conversationId: string, clientId: string) => {
      const id = String(conversationId);
      const pending = (messagesRef.current[id] || []).find(
        (m) => (m.clientId || m._id) === clientId && m.clientStatus === "failed",
      );
      if (!pending) return;
      await runRetry({
        clientId,
        guard: sendGuard.current,
        onSending: () =>
          updatePending(id, clientId, {
            clientStatus: "sending",
            clientError: undefined,
          }),
        // The earlier attempt may have reached the server even though the
        // response was lost — reconcile first so Retry never duplicates.
        reconcile: async () => {
          await loadMessages(id, undefined, { silent: true, throwOnError: true });
        },
        resend: () => attemptSend(id, pending),
      });
    },
    [attemptSend, loadMessages, updatePending],
  );

  const discardFailed = useCallback((conversationId: string, clientId: string) => {
    const id = String(conversationId);
    setMessagesById((prev) => {
      const list = prev[id];
      if (!list) return prev;
      return {
        ...prev,
        [id]: list.filter(
          (m) => !((m.clientId || m._id) === clientId && m.clientStatus === "failed"),
        ),
      };
    });
  }, []);

  const sendImage = useCallback(
    async (conversationId: string, mediaUrl: string) => {
      const id = String(conversationId);
      if (!mediaUrl) return;
      stopTypingFor(id);
      const pending: ChatMessage = {
        _id: newClientId(),
        conversationId: id,
        senderId: userIdRef.current || "",
        receiverId: "",
        type: "image",
        mediaUrl,
        delivered: false,
        read: false,
        createdAt: new Date().toISOString(),
      };
      try {
        const saved = await deliver(id, pending);
        appendMessage(id, saved);
        refreshInboxSoon();
      } catch (err) {
        throw new Error(friendlySendError(err, "Photo"));
      }
    },
    [appendMessage, deliver, refreshInboxSoon, stopTypingFor],
  );

  const onTyping = useCallback(
    (conversationId: string) => {
      const id = String(conversationId);
      const socket = socketRef.current;
      prepareChatSound();

      if (socket?.connected) {
        const peer = conversationsRef.current.find((c) => c._id === id)?.peer;
        if (!peer?._id) return;
        socket.emit("typing-start", { conversationId: id, peerId: peer._id });
        if (typingTimers.current[id]) clearTimeout(typingTimers.current[id]);
        typingTimers.current[id] = setTimeout(() => {
          socket.emit("typing-stop", { conversationId: id, peerId: peer._id });
        }, 1200);
        return;
      }

      let throttle = typingThrottles.current[id];
      if (!throttle) {
        throttle = createTypingThrottle({
          send: (typing) => {
            void authFetch("/api/chat/presence", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ conversationId: id, typing }),
            }).catch(() => {});
          },
        });
        typingThrottles.current[id] = throttle;
      }
      throttle.keystroke();
    },
    [],
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
    installChatSoundUnlock();
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

  // Navbar badge asks for the current total when it mounts.
  useEffect(() => {
    const onRequest = () => {
      if (!userIdRef.current || lastUnreadRef.current === null) return;
      window.dispatchEvent(
        new CustomEvent("chat-unread-updated", {
          detail: { unreadTotal: lastUnreadRef.current },
        }),
      );
    };
    window.addEventListener("chat-unread-request", onRequest);
    return () => window.removeEventListener("chat-unread-request", onRequest);
  }, []);

  // Tab visibility, connectivity and user activity drive the REST pollers.
  useEffect(() => {
    const syncVisibility = () => setHidden(document.visibilityState === "hidden");
    const onOnline = () => {
      setBrowserOnline(true);
      inboxPollerRef.current?.trigger();
      threadPollerRef.current?.trigger();
      presencePollerRef.current?.trigger();
    };
    const onOffline = () => setBrowserOnline(false);
    let lastPoke = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastPoke < ACTIVITY_POKE_THROTTLE_MS) return;
      lastPoke = now;
      inboxPollerRef.current?.poke();
      threadPollerRef.current?.poke();
    };

    syncVisibility();
    setBrowserOnline(navigator.onLine !== false);
    document.addEventListener("visibilitychange", syncVisibility);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, []);

  useEffect(() => {
    if (hidden && viewingSentRef.current.size > 0) {
      // Release viewing leases right away so notifications resume while away.
      const stopViewing = [...viewingSentRef.current];
      viewingSentRef.current = new Set();
      void authFetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopViewing }),
        keepalive: true,
      }).catch(() => {});
    }
    inboxPollerRef.current?.setHidden(hidden);
    threadPollerRef.current?.setHidden(hidden);
    presencePollerRef.current?.setHidden(hidden);
  }, [hidden]);

  // Auth + socket lifecycle
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const uid = await resolveSessionUserId();
      if (cancelled) return;
      setUserId(uid);
      if (!uid) {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocketConnected(false);
        inboxSnapshotRef.current = null;
        inboxSigRef.current = "";
        lastUnreadRef.current = null;
        return;
      }

      const socketUrl = getSocketUrl();
      if (!socketUrl) {
        // REST mode: the inbox poller performs the initial sync.
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocketConnected(false);
        return;
      }

      void loadConversations();
      void refreshUnread();

      let socket = socketRef.current;
      if (!socket || !socket.connected) {
        socket = io(socketUrl, {
          auth: {},
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
          if (isThreadOpen(cid)) {
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

      const onSocketTyping = (payload: {
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
      socket.on("typing", onSocketTyping);
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
        socket.off("typing", onSocketTyping);
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

  // REST inbox sync: conversation list + authoritative unread total.
  useEffect(() => {
    if (!userId || socketConnected) return;
    const poller = createAdaptivePoller({
      task: async () => ({
        changed: await loadConversations({ silent: true, throwOnError: true }),
      }),
      intervalMs: INBOX_POLL_MS,
      idleIntervalMs: INBOX_IDLE_POLL_MS,
      idleAfterMs: IDLE_AFTER_MS,
      maxBackoffMs: MAX_BACKOFF_MS,
      onStatus: (s) => {
        setRestFailures(s.failures);
        if (s.lastSuccessAt) setRestSynced(true);
      },
    });
    poller.setHidden(document.visibilityState === "hidden");
    inboxPollerRef.current = poller;
    poller.start();
    return () => {
      poller.stop();
      if (inboxPollerRef.current === poller) inboxPollerRef.current = null;
    };
  }, [userId, socketConnected, loadConversations]);

  // REST thread sync: only while at least one thread window is open.
  useEffect(() => {
    if (!userId || socketConnected || !hasOpenThreads) return;
    const poller = createAdaptivePoller({
      task: async () => {
        const ids = openIdsRef.current;
        if (ids.length === 0) return { changed: false };
        const results = await Promise.all(
          ids.map((id) =>
            loadMessages(id, undefined, { silent: true, throwOnError: true }),
          ),
        );
        return { changed: results.some(Boolean) };
      },
      intervalMs: THREAD_POLL_MS,
      idleIntervalMs: THREAD_IDLE_POLL_MS,
      idleAfterMs: IDLE_AFTER_MS,
      maxBackoffMs: MAX_BACKOFF_MS,
    });
    poller.setHidden(document.visibilityState === "hidden");
    threadPollerRef.current = poller;
    // Opening a thread already fetches it; first poll waits one interval.
    poller.start({ immediate: false });
    return () => {
      poller.stop();
      if (threadPollerRef.current === poller) threadPollerRef.current = null;
    };
  }, [userId, socketConnected, hasOpenThreads, loadMessages]);

  // REST presence heartbeat + viewing leases for open threads.
  useEffect(() => {
    if (!userId || socketConnected) return;
    const poller = createAdaptivePoller({
      task: async () => {
        const viewing = openIdsRef.current.slice(0, 5);
        const current = new Set(viewing);
        const stopViewing = [...viewingSentRef.current].filter(
          (id) => !current.has(id),
        );
        const res = await authFetch("/api/chat/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ viewing, stopViewing }),
        });
        if (!res.ok) throw new Error("presence failed");
        viewingSentRef.current = current;
      },
      intervalMs: PRESENCE_HEARTBEAT_MS,
      maxBackoffMs: MAX_BACKOFF_MS,
    });
    poller.setHidden(document.visibilityState === "hidden");
    presencePollerRef.current = poller;
    poller.start();
    return () => {
      poller.stop();
      if (presencePollerRef.current === poller) presencePollerRef.current = null;
      viewingSentRef.current = new Set();
    };
  }, [userId, socketConnected]);

  // Viewing set changed (thread opened / closed / minimized) → tell the server now.
  const firstViewingSync = useRef(true);
  useEffect(() => {
    if (firstViewingSync.current) {
      firstViewingSync.current = false;
      return;
    }
    presencePollerRef.current?.trigger();
  }, [openThreadKey]);

  const syncStatus = deriveSyncStatus({
    loggedIn: Boolean(userId),
    socketConnected,
    browserOnline,
    hidden,
    failures: restFailures,
    hasSynced: restSynced,
  });
  const connected =
    syncStatus === "live" || syncStatus === "connected" || syncStatus === "paused";

  // Custom event for product buttons / navbar / deep-links
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      try {
        if (detail.peerId) {
          void startChat(String(detail.peerId), detail.productId).catch(
            (err) => {
              console.error(err);
              showToast(
                err instanceof Error ? err.message : "Could not open chat",
                "error",
                3500,
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
      syncStatus,
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
      retrySend,
      discardFailed,
      sendImage,
      onTyping,
      loadOlder,
      hasMoreById,
      getConversation,
    }),
    [
      userId,
      connected,
      syncStatus,
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
      retrySend,
      discardFailed,
      sendImage,
      onTyping,
      loadOlder,
      hasMoreById,
      getConversation,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
