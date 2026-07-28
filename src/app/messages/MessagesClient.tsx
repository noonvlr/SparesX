"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useChat } from "@/hooks/useChat";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";

export default function MessagesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const peerId = searchParams.get("peer");
  const productId = searchParams.get("product") || undefined;
  const openId = searchParams.get("open");
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const chat = useChat();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthed(false);
      setAuthChecked(true);
      return;
    }
    setAuthed(true);
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!authed || !peerId || starting) return;
    setStarting(true);
    chat
      .startChat(peerId, productId)
      .then(() => {
        setMobileShowChat(true);
        router.replace("/messages");
      })
      .catch((e) => alert(e.message || "Could not start chat"))
      .finally(() => setStarting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, peerId, productId]);

  useEffect(() => {
    if (!authed || !openId || peerId) return;
    chat.openConversation(openId).then(() => {
      setMobileShowChat(true);
      router.replace("/messages");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, openId, peerId]);

  if (!authChecked) {
    return (
      <main className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Messages</h1>
          <p className="text-gray-600 mb-4">
            Login to chat with sellers and buyers.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent("/messages")}`}
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-2 sm:px-4 py-4">
      <div className="flex items-center justify-between mb-3 px-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-xs text-gray-500">
            {chat.connected
              ? "Realtime connected"
              : "Connecting… messages still work over HTTP"}
          </p>
        </div>
        {chat.activeId && (
          <button
            type="button"
            className="md:hidden text-sm text-blue-600 font-medium"
            onClick={() => setMobileShowChat(false)}
          >
            ← Chats
          </button>
        )}
      </div>

      {chat.error && (
        <p className="text-sm text-red-600 px-2 mb-2">{chat.error}</p>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-[calc(100vh-10rem)] min-h-[480px] grid grid-cols-1 md:grid-cols-5">
        <div
          className={`md:col-span-2 border-r border-gray-100 min-h-0 ${
            mobileShowChat ? "hidden md:block" : "block"
          }`}
        >
          <ConversationList
            conversations={chat.conversations}
            activeId={chat.activeId}
            onlineMap={chat.onlineMap}
            loading={chat.loadingList || starting}
            onSelect={(id) => {
              chat.openConversation(id);
              setMobileShowChat(true);
            }}
          />
        </div>
        <div
          className={`md:col-span-3 min-h-0 ${
            mobileShowChat ? "block" : "hidden md:block"
          }`}
        >
          <ChatWindow
            userId={chat.userId}
            conversation={chat.active}
            messages={chat.messages}
            typing={chat.typing}
            online={
              chat.active?.peer?._id
                ? chat.onlineMap[chat.active.peer._id]
                : false
            }
            connected={chat.connected}
            loading={chat.loadingMessages}
            hasMore={chat.hasMore}
            onLoadOlder={chat.loadOlder}
            onSend={chat.sendText}
            onSendImage={chat.sendImage}
            onTyping={chat.onInputTyping}
          />
        </div>
      </div>
    </main>
  );
}
