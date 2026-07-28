"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useChatDock } from "@/components/chat/ChatProvider";
import ConversationList from "@/components/chat/ConversationList";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageInput from "@/components/chat/MessageInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ProductHeader from "@/components/chat/ProductHeader";
import OnlineStatus from "@/components/chat/OnlineStatus";
import { isChatMuted, setChatMuted } from "@/lib/chat/sound";
import type { ChatConversation } from "@/types/chat";

function peerOf(c?: ChatConversation | null, userId?: string | null) {
  if (!c) return undefined;
  if (c.peer) return c.peer;
  return c.participants?.find((p) => String(p._id) !== String(userId));
}

function ThreadBody({
  conversationId,
  compact,
}: {
  conversationId: string;
  compact?: boolean;
}) {
  const chat = useChatDock();
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = chat.messagesById[conversationId] || [];
  const conversation = chat.getConversation(conversationId);
  const peer = peerOf(conversation, chat.userId);
  const typing = chat.typingById[conversationId];
  const online = peer?._id ? chat.onlineMap[peer._id] : false;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typing, conversationId]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#efeae2]">
      {!compact && (
        <ProductHeader product={conversation?.productId as any} />
      )}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {chat.hasMoreById[conversationId] && (
          <div className="text-center mb-2">
            <button
              type="button"
              onClick={() => void chat.loadOlder(conversationId)}
              className="text-xs text-blue-700 font-medium"
            >
              Load older
            </button>
          </div>
        )}
        {chat.loadingThread && messages.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 w-2/3 bg-white/60 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">
            No messages yet. Say hello.
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m._id}
              message={m}
              mine={String(m.senderId) === String(chat.userId)}
            />
          ))
        )}
        <TypingIndicator visible={!!typing} />
        <div ref={bottomRef} />
      </div>
      <MessageInput
        onSend={(t) => chat.sendText(conversationId, t)}
        onSendImage={(url) => chat.sendImage(conversationId, url)}
        onTyping={() => chat.onTyping(conversationId)}
        disabled={!chat.userId}
      />
    </div>
  );
}

function FloatingWindow({
  conversationId,
  index,
}: {
  conversationId: string;
  index: number;
}) {
  const chat = useChatDock();
  const conversation = chat.getConversation(conversationId);
  const peer = peerOf(conversation, chat.userId);
  const minimized = chat.minimizedIds.has(conversationId);
  const right = 24 + index * 340;

  if (minimized) return null;

  return (
    <div
      className="fixed bottom-24 z-[90] w-[min(360px,calc(100vw-1.5rem))] h-[min(520px,calc(100vh-7rem))] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col hidden md:flex"
      style={{ right }}
      role="dialog"
      aria-label={`Chat with ${peer?.name || "user"}`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-900 text-white">
        {peer?.profilePicture ? (
          <img
            src={peer.profilePicture}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
            {(peer?.name || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{peer?.name || "Chat"}</p>
          <OnlineStatus
            online={peer?._id ? chat.onlineMap[peer._id] : false}
            lastSeen={peer?.lastSeen}
            light
          />
        </div>
        <button
          type="button"
          onClick={() => chat.minimizeFloating(conversationId)}
          className="p-1.5 hover:bg-white/10 rounded-lg text-lg leading-none"
          aria-label="Minimize"
        >
          –
        </button>
        <button
          type="button"
          onClick={() => chat.closeFloating(conversationId)}
          className="p-1.5 hover:bg-white/10 rounded-lg text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <ThreadBody conversationId={conversationId} compact />
      </div>
    </div>
  );
}

export default function FloatingChatDock() {
  const chat = useChatDock();
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isChatMuted());
  }, []);

  if (!chat.userId) return null;

  const activeConv = chat.activeId
    ? chat.getConversation(chat.activeId)
    : undefined;
  const activePeer = peerOf(activeConv, chat.userId);

  return (
    <>
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
                className="relative w-12 h-12 rounded-full shadow-lg border-2 border-white bg-blue-600 text-white font-bold overflow-hidden"
                title={peer?.name || "Chat"}
              >
                {peer?.profilePicture ? (
                  <img
                    src={peer.profilePicture}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (peer?.name || "?").charAt(0).toUpperCase()
                )}
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-green-500 text-[10px] flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* Desktop floating windows */}
      {chat.floatingIds.map((id, i) => (
        <FloatingWindow key={id} conversationId={id} index={i} />
      ))}

      {/* Inbox / mobile panel */}
      {chat.panelOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[85] bg-black/30 md:bg-transparent md:pointer-events-none"
            aria-label="Close chat overlay"
            onClick={() => chat.closePanel()}
          />
          <aside
            className="fixed z-[95] bg-white shadow-2xl border border-gray-200 flex flex-col
              inset-x-0 bottom-0 h-[min(92vh,720px)] rounded-t-3xl
              md:inset-auto md:right-4 md:bottom-24 md:w-[380px] md:h-[min(640px,calc(100vh-7rem))] md:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Messages"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white rounded-t-3xl md:rounded-t-2xl">
              {chat.panelView === "thread" ? (
                <button
                  type="button"
                  onClick={chat.backToList}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                  aria-label="Back to conversations"
                >
                  ←
                </button>
              ) : (
                <span className="text-lg font-bold text-gray-900">Chats</span>
              )}
              {chat.panelView === "thread" && (
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">
                    {activePeer?.name || "Chat"}
                  </p>
                  <OnlineStatus
                    online={
                      activePeer?._id
                        ? chat.onlineMap[activePeer._id]
                        : false
                    }
                    lastSeen={activePeer?.lastSeen}
                  />
                </div>
              )}
              {chat.panelView === "list" && <div className="flex-1" />}
              <button
                type="button"
                onClick={() => {
                  const next = !muted;
                  setChatMuted(next);
                  setMuted(next);
                }}
                className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-600"
                title={muted ? "Unmute sounds" : "Mute sounds"}
              >
                {muted ? "Muted" : "Sound"}
              </button>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  chat.connected
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {chat.connected ? "Live" : "Offline"}
              </span>
              <button
                type="button"
                onClick={chat.closePanel}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                ×
              </button>
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
                <ThreadBody conversationId={chat.activeId} />
              ) : null}
            </div>
          </aside>
        </>
      )}

      {/* Launcher FAB */}
      <button
        type="button"
        onClick={() => (chat.panelOpen ? chat.closePanel() : chat.openPanel())}
        className="fixed bottom-5 right-4 z-[96] w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 flex items-center justify-center transition focus:outline-none focus:ring-4 focus:ring-blue-300"
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
          <span className="absolute -top-1 -right-1 min-w-[1.35rem] h-[1.35rem] px-1 rounded-full bg-green-500 text-[11px] font-bold flex items-center justify-center border-2 border-white">
            {chat.unreadTotal > 99 ? "99+" : chat.unreadTotal}
          </span>
        )}
      </button>

      {/* Login hint never — only when authed */}
      <span className="sr-only">
        <Link href="/messages">Messages</Link>
      </span>
    </>
  );
}
