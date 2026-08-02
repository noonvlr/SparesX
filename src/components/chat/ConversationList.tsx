"use client";

import Link from "next/link";
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
    <ul className="overflow-y-auto h-full p-2 space-y-1">
      {conversations.map((c) => {
        const peer = c.peer || c.participants?.find(Boolean);
        const unread = c.unreadCount || 0;
        const online = peer?._id ? onlineMap[peer._id] : false;
        return (
          <li key={c._id}>
            <div
              className={`w-full text-left px-3 py-3 rounded-xl hover:bg-teal-50/70 transition flex items-start gap-3 ${
                activeId === c._id
                  ? "bg-teal-50 ring-1 ring-teal-100"
                  : unread
                    ? "bg-teal-50/30"
                    : ""
              }`}
            >
              {peer?._id ? (
                <Link
                  href={`/u/${peer._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0"
                  title="View profile"
                >
                  {peer?.profilePicture ? (
                    <img
                      src={peer.profilePicture}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-bold">
                      {(peer?.name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-bold">
                  {(peer?.name || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => onSelect(c._id)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                    <p
                      className={`text-sm truncate ${
                        unread
                          ? "font-bold text-gray-900"
                          : "font-semibold text-gray-800"
                      }`}
                    >
                      {peer?.name || "User"}
                    </p>
                    <TrustBadges
                      phoneVerified={peer?.phoneVerified}
                      emailVerified={peer?.emailVerified}
                      kycVerified={peer?.kycVerified}
                      businessVerified={peer?.businessVerified}
                      addressVerified={peer?.addressVerified}
                      isTrusted={peer?.isTrusted}
                      trustScore={peer?.trustScore}
                      badges={peer?.badges}
                      activeBadgeKeys={peer?.activeBadgeKeys}
                    />
                  </div>
                  {unread > 0 && (
                    <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
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
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
