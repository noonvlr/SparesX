"use client";

import Link from "next/link";
import type { ChatConversation } from "@/types/chat";
import OnlineStatus from "@/components/chat/OnlineStatus";
import TrustBadges from "@/components/TrustBadges";
import { Avatar, Skeleton } from "@/components/ui/Card";

function formatChatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

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
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-[var(--muted)]">
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
              className={`w-full text-left px-3 py-3 rounded-xl hover:bg-[var(--brand-soft)]/70 transition flex items-start gap-3 ${
                activeId === c._id
                  ? "bg-[var(--brand-soft)] ring-1 ring-[var(--brand-muted)]"
                  : unread
                    ? "bg-[var(--brand-soft)]/30"
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
                  <Avatar
                    src={peer?.profilePicture}
                    name={peer?.name}
                    size="md"
                    className="w-11 h-11"
                  />
                </Link>
              ) : (
                <Avatar
                  src={peer?.profilePicture}
                  name={peer?.name}
                  size="md"
                  className="w-11 h-11"
                />
              )}
              <button
                type="button"
                onClick={() => onSelect(c._id)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm truncate min-w-0 ${
                      unread
                        ? "font-bold text-[var(--ink)]"
                        : "font-semibold text-[var(--ink-secondary)]"
                    }`}
                  >
                    {peer?.name || "User"}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {c.lastMessageTime ? (
                      <time
                        dateTime={c.lastMessageTime}
                        className="text-[10px] text-[var(--muted)] tabular-nums whitespace-nowrap"
                      >
                        {formatChatTime(c.lastMessageTime)}
                      </time>
                    ) : null}
                    {unread > 0 && (
                      <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[var(--brand)] text-[var(--primary-foreground)] text-[10px] font-bold flex items-center justify-center">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-0.5">
                  <TrustBadges
                    density="icons"
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
                <p className="text-xs text-[var(--muted)] truncate mt-0.5">
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
