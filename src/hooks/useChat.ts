"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { ChatConversation, ChatMessage } from "@/types/chat";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function currentUserId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).id as string;
  } catch {
    return null;
  }
}

export function useChat(initialConversationId?: string | null) {
  const { socket, connected, emitAck } = useSocket();
  const userId = useMemo(() => currentUserId(), []);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(
    initialConversationId || null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typing, setTyping] = useState(false);
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/chat/conversations", {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");
      setConversations(data.conversations || []);
      setUnreadTotal(data.unreadTotal || 0);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load chats");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string, cursor?: string) => {
      setLoadingMessages(true);
      try {
        const params = new URLSearchParams({ limit: "40" });
        if (cursor) params.set("cursor", cursor);
        const res = await fetch(
          `/api/chat/messages/${conversationId}?${params}`,
          { headers: authHeaders() },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load messages");
        if (cursor) {
          setMessages((prev) => [...(data.messages || []), ...prev]);
        } else {
          setMessages(data.messages || []);
        }
        setNextCursor(data.nextCursor);
        setHasMore(Boolean(data.hasMore));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    },
    [],
  );

  const openConversation = useCallback(
    async (conversationId: string) => {
      if (activeIdRef.current && socket) {
        socket.emit("leave-conversation", {
          conversationId: activeIdRef.current,
        });
      }
      setActiveId(conversationId);
      await loadMessages(conversationId);
      try {
        await emitAck("join-conversation", { conversationId });
      } catch {
        await fetch("/api/chat/messages/read", {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ conversationId }),
        });
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId ? { ...c, unreadCount: 0 } : c,
        ),
      );
      window.dispatchEvent(new CustomEvent("chat-unread-updated"));
    },
    [emitAck, loadMessages, socket],
  );

  const startChat = useCallback(
    async (peerId: string, productId?: string) => {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ peerId, productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to start chat");
      await loadConversations();
      const id = String(data.conversation._id);
      await openConversation(id);
      return id;
    },
    [loadConversations, openConversation],
  );

  const sendText = useCallback(
    async (text: string) => {
      if (!activeId || !text.trim()) return;
      const peer = conversations.find((c) => c._id === activeId)?.peer;
      try {
        const res = await emitAck<{
          ok: boolean;
          message?: ChatMessage;
          conversationId?: string;
        }>("send-message", {
          conversationId: activeId,
          type: "text",
          text,
          peerId: peer?._id,
        });
        if (!res.ok) throw new Error("Send failed");
      } catch {
        // REST fallback
        const res = await fetch("/api/chat/messages", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            conversationId: activeId,
            type: "text",
            text,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Send failed");
        setMessages((prev) => [...prev, data.message]);
        await loadConversations();
      }
    },
    [activeId, conversations, emitAck, loadConversations],
  );

  const sendImage = useCallback(
    async (mediaUrl: string) => {
      if (!activeId || !mediaUrl) return;
      const peer = conversations.find((c) => c._id === activeId)?.peer;
      try {
        await emitAck("send-message", {
          conversationId: activeId,
          type: "image",
          mediaUrl,
          peerId: peer?._id,
        });
      } catch {
        const res = await fetch("/api/chat/messages", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            conversationId: activeId,
            type: "image",
            mediaUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Send failed");
        setMessages((prev) => [...prev, data.message]);
        await loadConversations();
      }
    },
    [activeId, conversations, emitAck, loadConversations],
  );

  const emitTyping = useCallback(
    (start: boolean) => {
      if (!activeId || !socket) return;
      const peer = conversations.find((c) => c._id === activeId)?.peer;
      if (!peer?._id) return;
      socket.emit(start ? "typing-start" : "typing-stop", {
        conversationId: activeId,
        peerId: peer._id,
      });
    },
    [activeId, conversations, socket],
  );

  const onInputTyping = useCallback(() => {
    emitTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 1500);
  }, [emitTyping]);

  const loadOlder = useCallback(async () => {
    if (!activeId || !nextCursor || loadingMessages) return;
    await loadMessages(activeId, nextCursor);
  }, [activeId, nextCursor, loadingMessages, loadMessages]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (initialConversationId) {
      openConversation(initialConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId]);

  useEffect(() => {
    if (!socket) return;

    const onNew = (payload: { message: ChatMessage; conversationId: string }) => {
      const msg = payload.message;
      if (payload.conversationId === activeIdRef.current) {
        setMessages((prev) =>
          prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
        );
        socket.emit("mark-read", { conversationId: payload.conversationId });
      }
      loadConversations();
    };

    const onSent = (payload: { message: ChatMessage; conversationId: string }) => {
      const msg = payload.message;
      if (payload.conversationId === activeIdRef.current) {
        setMessages((prev) =>
          prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
        );
      }
      loadConversations();
    };

    const onDelivered = (payload: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === payload.messageId ? { ...m, delivered: true } : m,
        ),
      );
    };

    const onRead = (payload: { conversationId: string }) => {
      if (payload.conversationId === activeIdRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === userId ? { ...m, read: true, delivered: true } : m,
          ),
        );
      }
    };

    const onTyping = (payload: { conversationId: string; userId: string }) => {
      if (
        payload.conversationId === activeIdRef.current &&
        payload.userId !== userId
      ) {
        setTyping(true);
      }
    };
    const onStopTyping = (payload: { conversationId: string }) => {
      if (payload.conversationId === activeIdRef.current) setTyping(false);
    };

    const onOnline = (payload: { userId: string }) => {
      setOnlineMap((m) => ({ ...m, [payload.userId]: true }));
    };
    const onOffline = (payload: { userId: string }) => {
      setOnlineMap((m) => ({ ...m, [payload.userId]: false }));
    };

    const onNotification = () => {
      loadConversations();
      window.dispatchEvent(new CustomEvent("chat-unread-updated"));
    };

    socket.on("new-message", onNew);
    socket.on("message-sent", onSent);
    socket.on("message-delivered", onDelivered);
    socket.on("message-read", onRead);
    socket.on("typing", onTyping);
    socket.on("stop-typing", onStopTyping);
    socket.on("user-online", onOnline);
    socket.on("user-offline", onOffline);
    socket.on("notification", onNotification);
    socket.on("conversation-updated", onNotification);

    return () => {
      socket.off("new-message", onNew);
      socket.off("message-sent", onSent);
      socket.off("message-delivered", onDelivered);
      socket.off("message-read", onRead);
      socket.off("typing", onTyping);
      socket.off("stop-typing", onStopTyping);
      socket.off("user-online", onOnline);
      socket.off("user-offline", onOffline);
      socket.off("notification", onNotification);
      socket.off("conversation-updated", onNotification);
    };
  }, [socket, userId, loadConversations]);

  const active = conversations.find((c) => c._id === activeId) || null;

  return {
    userId,
    connected,
    conversations,
    active,
    activeId,
    messages,
    hasMore,
    loadingList,
    loadingMessages,
    typing,
    onlineMap,
    unreadTotal,
    error,
    openConversation,
    startChat,
    sendText,
    sendImage,
    onInputTyping,
    loadOlder,
    loadConversations,
    setActiveId,
  };
}
