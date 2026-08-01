"use client";

import type { ChatConversation } from "@/types/chat";
import OnlineStatus from "@/components/chat/OnlineStatus";
import TrustBadges from "@/components/TrustBadges";

export default function ConversationList({
  conversations,
  activeId,
  onlineMap,
  loading,
  onSelect,
}: {
  conversations: ChatConversation[];
  activeId: string | null;
  onlineMap: Record<string, boolean>;
  loading?: boolean;
  onSelect: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        No conversations yet. Open a product and tap{" "}
        <span className="font-semibold">In-app chat</span>.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 overflow-y-auto h-full">
      {conversations.map((c) => {
        const peer = c.peer || c.participants?.find(Boolean);
        const unread = c.unreadCount || 0;
        const online = peer?._id ? onlineMap[peer._id] : false;
        return (
          <li key={c._id}>
            <button
              type="button"
              onClick={() => onSelect(c._id)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                activeId === c._id ? "bg-blue-50" : unread ? "bg-emerald-50/40" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                {peer?.profilePicture ? (
                  <img
                    src={peer.profilePicture}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold">
                    {(peer?.name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                      <p
                        className={`text-sm truncate ${
                          unread ? "font-bold text-gray-900" : "font-semibold text-gray-800"
                        }`}
                      >
                        {peer?.name || "User"}
                      </p>
                      <TrustBadges
                        phoneVerified={peer?.phoneVerified}
                        emailVerified={peer?.emailVerified}
                        isTrusted={peer?.isTrusted}
                      />
                    </div>
                    {unread > 0 && (
                      <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {c.lastMessage || "No messages yet"}
                  </p>
                  <div className="mt-1">
                    <OnlineStatus online={online} lastSeen={peer?.lastSeen} />
                  </div>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
