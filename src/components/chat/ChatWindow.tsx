"use client";

import { useEffect, useRef } from "react";
import type { ChatConversation, ChatMessage } from "@/types/chat";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageInput from "@/components/chat/MessageInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ProductHeader from "@/components/chat/ProductHeader";
import OnlineStatus from "@/components/chat/OnlineStatus";
import TrustBadges from "@/components/TrustBadges";

export default function ChatWindow({
  userId,
  conversation,
  messages,
  typing,
  online,
  connected,
  loading,
  hasMore,
  onLoadOlder,
  onSend,
  onSendImage,
  onTyping,
}: {
  userId: string | null;
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  typing: boolean;
  online?: boolean;
  connected: boolean;
  loading?: boolean;
  hasMore?: boolean;
  onLoadOlder: () => void;
  onSend: (text: string) => Promise<void> | void;
  onSendImage: (url: string) => Promise<void> | void;
  onTyping: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typing, conversation?._id]);

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-500 p-8">
        Select a conversation to start messaging
      </div>
    );
  }

  const peer = conversation.peer;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#f0f2f5]">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        {peer?.profilePicture ? (
          <img
            src={peer.profilePicture}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            {(peer?.name || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {peer?.name || "Chat"}
            </p>
            <TrustBadges
              phoneVerified={peer?.phoneVerified}
              emailVerified={peer?.emailVerified}
              kycVerified={peer?.kycVerified}
              businessVerified={peer?.businessVerified}
              addressVerified={peer?.addressVerified}
              isTrusted={peer?.isTrusted}
              trustScore={peer?.trustScore}
              trustLabel={peer?.trustLabel}
              badges={peer?.badges}
              activeBadgeKeys={peer?.activeBadgeKeys}
            />
          </div>
          <OnlineStatus online={online} lastSeen={peer?.lastSeen} />
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            connected
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {connected ? "Live" : "REST mode"}
        </span>
      </div>

      <ProductHeader product={conversation.productId as any} />

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 py-3">
        {hasMore && (
          <div className="text-center mb-3">
            <button
              type="button"
              onClick={onLoadOlder}
              disabled={loading}
              className="text-xs text-blue-600 font-medium disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load older messages"}
            </button>
          </div>
        )}
        {loading && messages.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-2/3 bg-white/70 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m._id}
              message={m}
              mine={String(m.senderId) === String(userId)}
            />
          ))
        )}
        <TypingIndicator visible={typing} />
        <div ref={bottomRef} />
      </div>

      <MessageInput
        onSend={onSend}
        onSendImage={onSendImage}
        onTyping={onTyping}
        disabled={!userId}
      />
    </div>
  );
}
