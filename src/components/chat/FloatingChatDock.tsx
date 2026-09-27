"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChatDock } from "@/components/chat/ChatProvider";
import {
  isNearBottom,
  planScroll,
  preservedScrollTop,
  type ListEdges,
  type ScrollMetrics,
} from "@/lib/chat/scrollAnchor";
import { SYNC_STATUS_COPY } from "@/lib/chat/syncStatus";
import { authFetch } from "@/lib/auth/clientAuth";
import { showToast } from "@/components/ToastHost";
import type { ChatMessage } from "@/types/chat";
import ConversationList from "@/components/chat/ConversationList";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageInput from "@/components/chat/MessageInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ProductHeader from "@/components/chat/ProductHeader";
import OnlineStatus from "@/components/chat/OnlineStatus";
import TrustBadges from "@/components/TrustBadges";
import {
  isChatMuted,
  prepareChatSound,
  setChatMuted,
  unlockChatSound,
} from "@/lib/chat/sound";
import { isLoggedInClient } from "@/lib/auth/clientAuth";
import type { ChatConversation } from "@/types/chat";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Avatar, Skeleton } from "@/components/ui/Card";

function PeerTrustStrip({ peer }: { peer?: ChatConversation["peer"] }) {
  if (!peer) return null;
  return (
    <TrustBadges
      density="icons"
      phoneVerified={peer.phoneVerified}
      emailVerified={peer.emailVerified}
      kycVerified={peer.kycVerified}
      businessVerified={peer.businessVerified}
      addressVerified={peer.addressVerified}
      isTrusted={peer.isTrusted}
      trustScore={peer.trustScore}
      badges={peer.badges}
      activeBadgeKeys={peer.activeBadgeKeys}
      className="mt-0.5"
    />
  );
}

function peerOf(c?: ChatConversation | null, userId?: string | null) {
  if (!c) return undefined;
  if (c.peer) return c.peer;
  return c.participants?.find((p) => String(p._id) !== String(userId));
}

const FAB_SIZE = 56;
const FAB_MARGIN = 16;
const NO_MESSAGES: ChatMessage[] = [];

function clampFabPosition(x: number, y: number) {
  if (typeof window === "undefined") return { x, y };
  return {
    x: Math.max(FAB_MARGIN, Math.min(x, window.innerWidth - FAB_SIZE - FAB_MARGIN)),
    y: Math.max(FAB_MARGIN, Math.min(y, window.innerHeight - FAB_SIZE - FAB_MARGIN)),
  };
}

export function reportUserHref(peerId: string, conversationId: string) {
  return `/support/report?type=user&id=${encodeURIComponent(peerId)}&conversationId=${encodeURIComponent(conversationId)}`;
}

export function reportMessageHref(messageId: string, conversationId: string) {
  return `/support/report?type=message&id=${encodeURIComponent(messageId)}&conversationId=${encodeURIComponent(conversationId)}`;
}

/**
 * Block / unblock with confirmation. The server enforces auth and revokes
 * WhatsApp unlocks on block; this only drives the request and feedback.
 */
function usePeerBlockToggle(
  onBlockedChange: (userId: string, blocked: boolean) => void,
) {
  const [busy, setBusy] = useState(false);
  const toggle = useCallback(
    async (
      peer: { _id: string; name?: string },
      currentlyBlocked: boolean,
    ): Promise<boolean> => {
      if (busy) return false;
      if (
        !currentlyBlocked &&
        !window.confirm(
          `Block ${peer.name || "this user"}? They won't be able to message you, and any WhatsApp access between you will be revoked.`,
        )
      ) {
        return false;
      }
      setBusy(true);
      try {
        const res = await authFetch("/api/chat/block", {
          method: currentlyBlocked ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: peer._id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(
            data.message ||
              (currentlyBlocked ? "Could not unblock" : "Could not block"),
            "error",
            3500,
          );
          return false;
        }
        onBlockedChange(String(peer._id), !currentlyBlocked);
        showToast(currentlyBlocked ? "User unblocked" : "User blocked");
        return true;
      } catch {
        showToast("No connection — please try again", "error", 3500);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [busy, onBlockedChange],
  );
  return { toggle, busy };
}

function ThreadMenu({
  conversationId,
  peer,
  peerBlocked,
  onBlockedChange,
}: {
  conversationId: string;
  peer: { _id: string; name?: string };
  peerBlocked: boolean;
  onBlockedChange: (userId: string, blocked: boolean) => void;
}) {
  const chat = useChatDock();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toggle, busy } = usePeerBlockToggle(onBlockedChange);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    chat.closePanel();
    router.push(href);
  };

  return (
    <div className="relative" ref={menuRef}>
      <IconButton
        type="button"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        ⋮
      </IconButton>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-[100] min-w-[180px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] py-1 text-sm"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-3 py-2.5 hover:bg-[var(--surface-2)] text-[var(--ink)]"
            onClick={() => go(`/u/${peer._id}`)}
          >
            View profile
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-3 py-2.5 hover:bg-[var(--surface-2)] text-[var(--ink)]"
            onClick={() => go(reportUserHref(peer._id, conversationId))}
          >
            Report user
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            className="w-full text-left px-3 py-2.5 hover:bg-[var(--surface-2)] text-[var(--danger)] font-semibold disabled:opacity-60"
            onClick={() => {
              setOpen(false);
              void toggle(peer, peerBlocked);
            }}
          >
            {peerBlocked ? "Unblock user" : "Block user"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ThreadBody({
  conversationId,
  compact,
  peerBlocked,
}: {
  conversationId: string;
  compact?: boolean;
  peerBlocked?: boolean;
}) {
  const chat = useChatDock();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<ScrollMetrics>({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  });
  const edgesRef = useRef<ListEdges>({ count: 0 });
  const threadRef = useRef<string | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [draft, setDraft] = useState<{ text: string; nonce: number } | null>(null);
  const messages = chat.messagesById[conversationId] ?? NO_MESSAGES;
  const conversation = chat.getConversation(conversationId);
  const typing = chat.typingById[conversationId];
  const myId = chat.userId;

  const captureMetrics = () => {
    const el = scrollRef.current;
    if (!el) return;
    metricsRef.current = {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    };
  };

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    captureMetrics();
    setShowJump(false);
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    const next: ListEdges = {
      firstId: messages[0]?._id,
      lastId: last?._id,
      count: messages.length,
    };
    const prev = edgesRef.current;
    const plan = planScroll(prev, next, {
      wasNearBottom: isNearBottom(metricsRef.current),
      lastIsMine: Boolean(last) && String(last.senderId) === String(myId),
      threadChanged: threadRef.current !== conversationId,
    });
    // The jump button depends on scroll measurements only available here.
    if (plan === "bottom") {
      el.scrollTop = el.scrollHeight;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowJump(false);
    } else if (plan === "preserve") {
      el.scrollTop = preservedScrollTop(
        metricsRef.current.scrollTop,
        metricsRef.current.scrollHeight,
        el.scrollHeight,
      );
    } else if (next.lastId !== prev.lastId && next.count > 0) {
      setShowJump(true);
    }
    edgesRef.current = next;
    threadRef.current = conversationId;
    captureMetrics();
  }, [messages, conversationId, myId]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !typing) return;
    if (isNearBottom(metricsRef.current)) {
      el.scrollTop = el.scrollHeight;
      captureMetrics();
    }
  }, [typing]);

  const clientIdOf = (m: ChatMessage) => m.clientId || m._id;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--chat-thread)]">
      {!compact && (
        <ProductHeader product={conversation?.productId as any} />
      )}
      <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={() => {
          captureMetrics();
          if (isNearBottom(metricsRef.current)) setShowJump(false);
        }}
        className="h-full overflow-y-auto px-3 py-3"
      >
        {chat.hasMoreById[conversationId] && (
          <div className="text-center mb-2">
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => void chat.loadOlder(conversationId)}
              className="text-xs font-semibold"
            >
              Load older
            </Button>
          </div>
        )}
        {chat.loadingThread && messages.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-10 w-2/3 rounded-xl bg-[var(--surface)]/60"
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-[var(--muted)] py-8">
            No messages yet. Say hello.
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={clientIdOf(m)}
              message={m}
              mine={String(m.senderId) === String(myId)}
              onReport={
                String(m.senderId) === String(myId) || m.clientStatus
                  ? undefined
                  : (msg) => {
                      chat.closePanel();
                      router.push(reportMessageHref(msg._id, conversationId));
                    }
              }
              onRetry={(msg) => void chat.retrySend(conversationId, clientIdOf(msg))}
              onEdit={(msg) => {
                chat.discardFailed(conversationId, clientIdOf(msg));
                setDraft({ text: msg.text || "", nonce: Date.now() });
              }}
              onDiscard={(msg) => chat.discardFailed(conversationId, clientIdOf(msg))}
            />
          ))
        )}
        <TypingIndicator visible={!!typing && !peerBlocked} />
      </div>
      {showJump ? (
        <button
          type="button"
          onClick={jumpToLatest}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--brand)] text-[var(--primary-foreground)] text-xs font-semibold px-3 py-1.5 shadow-[var(--shadow-md)]"
        >
          New messages ↓
        </button>
      ) : null}
      </div>
      {peerBlocked ? (
        <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--muted)] text-center">
          You blocked this user. Unblock to send messages again.
        </div>
      ) : (
        <MessageInput
          onSend={(t) => chat.sendText(conversationId, t)}
          onSendImage={(url) => chat.sendImage(conversationId, url)}
          onTyping={() => chat.onTyping(conversationId)}
          disabled={!chat.userId}
          showQuickReplies={messages.length < 3}
          restoreDraft={draft}
        />
      )}
    </div>
  );
}

function FloatingWindow({
  conversationId,
  index,
  blockedIds,
  onBlockedChange,
}: {
  conversationId: string;
  index: number;
  blockedIds: Set<string>;
  onBlockedChange: (userId: string, blocked: boolean) => void;
}) {
  const chat = useChatDock();
  const conversation = chat.getConversation(conversationId);
  const peer = peerOf(conversation, chat.userId);
  const minimized = chat.minimizedIds.has(conversationId);
  const right = 24 + index * 340;
  const peerBlocked = peer?._id ? blockedIds.has(String(peer._id)) : false;
  const { toggle: toggleBlock, busy: blockBusy } =
    usePeerBlockToggle(onBlockedChange);

  if (minimized) return null;

  return (
    <div
      className="fixed bottom-24 z-[90] w-[min(360px,calc(100vw-1.5rem))] h-[min(520px,calc(100vh-7rem))] glass rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] border border-[var(--glass-border)] overflow-hidden flex flex-col hidden md:flex animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200"
      style={{ right }}
      role="dialog"
      aria-label={`Chat with ${peer?.name || "user"}`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-[var(--brand-hover)] to-[var(--ink)] text-[var(--ink-inverse)]">
        {peer?._id ? (
          <Link
            href={`/u/${peer._id}`}
            className="shrink-0 rounded-full"
            title="View profile"
          >
            <Avatar
              src={peer?.profilePicture}
              name={peer?.name}
              size="sm"
            />
          </Link>
        ) : (
          <Avatar
            src={peer?.profilePicture}
            name={peer?.name}
            size="sm"
          />
        )}
        <div className="min-w-0 flex-1">
          {peer?._id ? (
            <Link
              href={`/u/${peer._id}`}
              className="text-sm font-semibold truncate block hover:underline"
            >
              {peer?.name || "Chat"}
            </Link>
          ) : (
            <p className="text-sm font-semibold truncate">{peer?.name || "Chat"}</p>
          )}
          <OnlineStatus
            online={peer?._id ? chat.onlineMap[peer._id] : false}
            lastSeen={peer?.lastSeen}
            light
            compact
          />
          <PeerTrustStrip peer={peer} />
        </div>
        {peer?._id ? (
          <Link
            href={reportUserHref(peer._id, conversationId)}
            className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-inverse)]/80 hover:text-[var(--ink-inverse)] hover:underline px-1"
            title="Report this user"
          >
            Report
          </Link>
        ) : null}
        {peer?._id ? (
          <button
            type="button"
            disabled={blockBusy}
            className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-inverse)]/80 hover:text-[var(--ink-inverse)] hover:underline px-1 disabled:opacity-60"
            title={peerBlocked ? "Unblock this user" : "Block this user"}
            onClick={() => {
              void toggleBlock(peer, peerBlocked).then((ok) => {
                if (ok && !peerBlocked) chat.closeFloating(conversationId);
              });
            }}
          >
            {peerBlocked ? "Unblock" : "Block"}
          </button>
        ) : null}
        <IconButton
          type="button"
          size="sm"
          onClick={() => chat.minimizeFloating(conversationId)}
          className="text-[var(--ink-inverse)] hover:bg-[var(--ink-inverse)]/10"
          aria-label="Minimize"
        >
          –
        </IconButton>
        <IconButton
          type="button"
          size="sm"
          onClick={() => chat.closeFloating(conversationId)}
          className="text-[var(--ink-inverse)] hover:bg-[var(--ink-inverse)]/10"
          aria-label="Close"
        >
          ×
        </IconButton>
      </div>
      {chat.syncStatus === "offline" || chat.syncStatus === "reconnecting" ? (
        <p
          role="status"
          title={SYNC_STATUS_COPY[chat.syncStatus].title}
          className={`px-3 py-1 text-[11px] font-semibold ${
            chat.syncStatus === "offline"
              ? "bg-[var(--danger-soft)] text-[var(--danger)]"
              : "bg-[var(--warning-soft)] text-[var(--warning)]"
          }`}
        >
          {SYNC_STATUS_COPY[chat.syncStatus].label} —{" "}
          {SYNC_STATUS_COPY[chat.syncStatus].title}
        </p>
      ) : null}
      <div className="flex-1 min-h-0">
        <ThreadBody
          conversationId={conversationId}
          compact
          peerBlocked={peerBlocked}
        />
      </div>
    </div>
  );
}

export default function FloatingChatDock() {
  const chat = useChatDock();
  const [muted, setMuted] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [fabDismissed, setFabDismissed] = useState(false);
  const [chatVisited, setChatVisited] = useState(false);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const handleBlockedChange = useCallback((userId: string, blocked: boolean) => {
    setBlockedIds((prev) => {
      const next = new Set(prev);
      if (blocked) next.add(userId);
      else next.delete(userId);
      return next;
    });
  }, []);
  const statusCopy = SYNC_STATUS_COPY[chat.syncStatus];
  const [fabPosition, setFabPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const dragState = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });
  const suppressClickRef = useRef(false);

  useEffect(() => {
    setMuted(isChatMuted());
    const sync = () => {
      setHasSession(isLoggedInClient());
      setFabDismissed(localStorage.getItem("sparesx_chat_fab_hidden") === "1");
      setChatVisited(localStorage.getItem("sparesx_chat_visited") === "1");
    };
    sync();
    try {
      const raw = localStorage.getItem("sparesx_chat_fab_pos");
      if (raw) {
        const parsed = JSON.parse(raw) as { x?: number; y?: number };
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setFabPosition(clampFabPosition(parsed.x, parsed.y));
        }
      }
    } catch {
      // ignore invalid saved position
    }
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    const unlockAudio = () => {
      void unlockChatSound();
    };
    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);
    const onResize = () => {
      setFabPosition((prev) => (prev ? clampFabPosition(prev.x, prev.y) : prev));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!hasSession) {
      setBlockedIds(new Set());
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { authFetch } = await import("@/lib/auth/clientAuth");
        const res = await authFetch("/api/chat/block");
        const data = await res.json().catch(() => ({}));
        if (cancelled || !res.ok) return;
        const ids = Array.isArray(data.blockedUserIds)
          ? data.blockedUserIds.map(String)
          : [];
        setBlockedIds(new Set(ids));
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasSession]);

  useEffect(() => {
    if (chat.panelOpen || chat.floatingIds.length > 0) {
      setChatVisited(true);
      setFabDismissed(false);
      try {
        localStorage.setItem("sparesx_chat_visited", "1");
        localStorage.removeItem("sparesx_chat_fab_hidden");
      } catch {
        // ignore
      }
    }
  }, [chat.panelOpen, chat.floatingIds.length]);

  useEffect(() => {
    if (chat.unreadTotal > 0 && fabDismissed) {
      setFabDismissed(false);
      try {
        localStorage.removeItem("sparesx_chat_fab_hidden");
      } catch {
        // ignore
      }
    }
  }, [chat.unreadTotal, fabDismissed]);

  useEffect(() => {
    if (!fabPosition) return;
    localStorage.setItem("sparesx_chat_fab_pos", JSON.stringify(fabPosition));
  }, [fabPosition]);

  const handleFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const current = fabPosition || {
      x: window.innerWidth - FAB_SIZE - FAB_MARGIN,
      y: window.innerHeight - FAB_SIZE - 20,
    };
    dragState.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: current.x,
      originY: current.y,
      moved: false,
    };
    suppressClickRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleFabPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragState.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (!dragState.current.moved && Math.hypot(dx, dy) > 6) {
      dragState.current.moved = true;
      suppressClickRef.current = true;
    }
    if (!dragState.current.moved) return;
    setFabPosition(
      clampFabPosition(
        dragState.current.originX + dx,
        dragState.current.originY + dy,
      ),
    );
  };

  const handleFabPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragState.current.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore capture cleanup errors
    }
    dragState.current.pointerId = null;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const togglePanel = () => {
    prepareChatSound();
    if (chat.panelOpen) chat.closePanel();
    else chat.openPanel();
  };

  const dismissFab = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      localStorage.setItem("sparesx_chat_fab_hidden", "1");
    } catch {
      // ignore
    }
    setFabDismissed(true);
    if (chat.panelOpen) chat.closePanel();
  };

  // Guests: no dock
  if (!hasSession && !chat.userId && !chat.panelOpen) return null;

  const chatUiOpen =
    chat.panelOpen ||
    chat.floatingIds.length > 0 ||
    chat.minimizedIds.size > 0;
  const hasMessages =
    (chat.conversations?.length || 0) > 0 || chat.unreadTotal > 0;
  // Hide while chat UI is open; show only when there are messages and not dismissed
  const showFab = !chatUiOpen && hasMessages && !fabDismissed;

  const activeConv = chat.activeId
    ? chat.getConversation(chat.activeId)
    : undefined;
  const activePeer = peerOf(activeConv, chat.userId);

  return (
    <div className="chat-ui">
      {/* Minimized bubbles */}
      <div className="fixed bottom-24 right-4 z-[91] hidden md:flex flex-col gap-2 items-end">
        {chat.floatingIds
          .filter((id) => chat.minimizedIds.has(id))
          .map((id) => {
            const c = chat.getConversation(id);
            const peer = peerOf(c, chat.userId);
            const unread = c?.unreadCount || 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() => chat.restoreFloating(id)}
                className="relative w-12 h-12 rounded-full shadow-lg border-2 border-[var(--surface)] bg-[var(--brand)] text-[var(--ink-inverse)] font-bold overflow-hidden transition-transform duration-200 hover:scale-105 animate-in zoom-in-75"
                title={peer?.name || "Chat"}
              >
                <Avatar
                  src={peer?.profilePicture}
                  name={peer?.name || "?"}
                  size="md"
                  className="w-full h-full text-base"
                />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[var(--danger)] text-[10px] flex items-center justify-center shadow-md animate-pulse">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* Desktop floating windows */}
      {chat.floatingIds.map((id, i) => (
        <FloatingWindow
          key={id}
          conversationId={id}
          index={i}
          blockedIds={blockedIds}
          onBlockedChange={handleBlockedChange}
        />
      ))}

      {/* Inbox / mobile panel */}
      {chat.panelOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[85] bg-[var(--overlay)] md:bg-[var(--overlay)]/40 backdrop-blur-[1px]"
            aria-label="Close chat overlay"
            onClick={() => chat.closePanel()}
          />
          <aside
            className="fixed z-[95] glass shadow-[var(--shadow-modal)] border border-[var(--glass-border)] flex flex-col animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-200
              inset-x-0 bottom-0 h-[min(92vh,720px)] rounded-t-[var(--radius-xl)]
              md:inset-auto md:right-4 md:bottom-24 md:w-[380px] md:h-[min(640px,calc(100vh-7rem))] md:rounded-[var(--radius-lg)]"
            role="dialog"
            aria-modal="true"
            aria-label="Messages"
          >
            <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-[var(--divider)] bg-[var(--surface)] rounded-t-[var(--radius-xl)] md:rounded-t-[var(--radius-lg)]">
              {chat.panelView === "thread" ? (
                <IconButton
                  type="button"
                  size="sm"
                  onClick={chat.backToList}
                  aria-label="Back to conversations"
                >
                  ←
                </IconButton>
              ) : (
                <span className="text-base font-bold text-[var(--ink)] pl-1">
                  Chats
                </span>
              )}
              {chat.panelView === "thread" && (
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--ink)] truncate text-sm leading-tight">
                    {activePeer?.name || "Chat"}
                  </p>
                  <OnlineStatus
                    online={
                      activePeer?._id
                        ? chat.onlineMap[activePeer._id]
                        : false
                    }
                    lastSeen={activePeer?.lastSeen}
                    compact
                  />
                  <PeerTrustStrip peer={activePeer} />
                </div>
              )}
              {chat.panelView === "list" && <div className="flex-1" />}
              <IconButton
                type="button"
                size="sm"
                onClick={() => {
                  const next = !muted;
                  setChatMuted(next);
                  setMuted(next);
                }}
                aria-label={muted ? "Unmute message sounds" : "Mute message sounds"}
                title={muted ? "Unmute sounds" : "Mute sounds"}
                className={
                  muted ? "text-[var(--muted)]" : "text-[var(--ink-secondary)]"
                }
              >
                {muted ? "🔇" : "🔊"}
              </IconButton>
              <span
                className={`${
                  statusCopy.tone === "success" ? "hidden sm:inline-flex" : "inline-flex"
                } items-center gap-1 text-[10px] font-medium text-[var(--muted)] px-1`}
                title={statusCopy.title}
                role="status"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    statusCopy.tone === "success"
                      ? "bg-[var(--success)]"
                      : statusCopy.tone === "warning"
                        ? "bg-[var(--warning)]"
                        : "bg-[var(--danger)]"
                  }`}
                />
                {statusCopy.label}
              </span>
              {chat.panelView === "thread" && activePeer?._id ? (
                <ThreadMenu
                  conversationId={chat.activeId || ""}
                  peer={activePeer}
                  peerBlocked={blockedIds.has(String(activePeer._id))}
                  onBlockedChange={handleBlockedChange}
                />
              ) : null}
              <IconButton
                type="button"
                size="sm"
                onClick={chat.closePanel}
                aria-label="Close"
              >
                ×
              </IconButton>
            </div>

            <div className="flex-1 min-h-0">
              {chat.panelView === "list" ? (
                <ConversationList
                  conversations={chat.conversations}
                  activeId={chat.activeId}
                  onlineMap={chat.onlineMap}
                  loading={chat.loadingList}
                  onSelect={(id) => {
                    const isMobile = window.matchMedia(
                      "(max-width: 767px)",
                    ).matches;
                    if (isMobile) {
                      void chat.openConversation(id, { floating: false });
                    } else {
                      // Desktop: open as floating bubble, keep site usable
                      void chat.openConversation(id, { floating: true });
                      chat.closePanel();
                    }
                  }}
                />
              ) : chat.activeId ? (
                <ThreadBody
                  conversationId={chat.activeId}
                  peerBlocked={
                    activePeer?._id ? blockedIds.has(String(activePeer._id)) : false
                  }
                />
              ) : null}
            </div>
          </aside>
        </>
      )}

      {/* Launcher FAB — hidden while chat open; only if messages exist */}
      {showFab && (
        <div
          className={`fixed z-[96] ${fabPosition ? "" : "chat-fab-default"}`}
          style={
            fabPosition
              ? { left: fabPosition.x, top: fabPosition.y }
              : undefined
          }
        >
          <button
            type="button"
            onPointerDown={handleFabPointerDown}
            onPointerMove={handleFabPointerMove}
            onPointerUp={handleFabPointerUp}
            onPointerCancel={handleFabPointerUp}
            onClick={() => {
              if (suppressClickRef.current) return;
              togglePanel();
            }}
            className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-hover)] text-[var(--primary-foreground)] shadow-[var(--shadow-lg)] shadow-[var(--brand-hover)]/20 hover:shadow-[var(--shadow-modal)] hover:scale-105 flex items-center justify-center transition duration-200 focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)] touch-none select-none"
            aria-label="Open messages"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {chat.unreadTotal > 0 && (
              <span className="absolute -top-1 -left-1 min-w-[1.35rem] h-[1.35rem] px-1 rounded-full bg-[var(--danger)] text-[11px] font-bold flex items-center justify-center border-2 border-[var(--surface)] shadow-md animate-pulse">
                {chat.unreadTotal > 99 ? "99+" : chat.unreadTotal}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={dismissFab}
            className="absolute -top-1.5 -right-1.5 z-[97] w-6 h-6 rounded-full bg-[var(--surface)] text-[var(--ink-secondary)] border border-[var(--border-strong)] shadow-md flex items-center justify-center hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
            aria-label="Hide chat bubble"
            title="Hide"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Login hint never — only when authed */}
      <span className="sr-only">
        <Link href="/messages">Messages</Link>
      </span>
    </div>
  );
}
