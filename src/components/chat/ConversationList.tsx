"use client";

import Link from "next/link";
import type { ChatConversation } from "@/types/chat";
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

function AvatarWithPresence({
  src,
  name,
  online,
  href,
}: {
  src?: string | null;
  name?: string;
  online?: boolean;
  href?: string;
}) {
  const avatar = (
    <span className="relative inline-flex shrink-0">
      <Avatar src={src} name={name} size="md" className="w-11 h-11" />
      {online ? (
        <span
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[var(--success)] border-2 border-[var(--surface)]"
          title="Online"
          aria-label="Online"
        />
      ) : null}
    </span>
  );

  if (!href) return avatar;
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className="shrink-0"
      title="View profile"
    >
      {avatar}
    </Link>
  );
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
      <div className="p-3 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 rounded-[var(--radius-lg)]" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-[var(--muted)]">
        No conversations yet. Open a product and tap{" "}
        <span className="font-semibold text-[var(--ink)]">In-app chat</span>.
      </div>
    );
  }

  return (
    <ul className="overflow-y-auto h-full py-1">
      {conversations.map((c) => {
        const peer = c.peer || c.participants?.find(Boolean);
        const unread = c.unreadCount || 0;
        const online = peer?._id ? !!onlineMap[peer._id] : false;
        const active = activeId === c._id;

        return (
          <li key={c._id}>
            <button
              type="button"
              onClick={() => onSelect(c._id)}
              className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                active
                  ? "bg-[var(--brand-soft)]"
                  : unread
                    ? "bg-[var(--brand-soft)]/35 hover:bg-[var(--brand-soft)]/55"
                    : "hover:bg-[var(--surface-3)]"
              }`}
            >
              <AvatarWithPresence
                src={peer?.profilePicture}
                name={peer?.name}
                online={online}
                href={peer?._id ? `/u/${peer._id}` : undefined}
              />

              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm truncate ${
                      unread
                        ? "font-bold text-[var(--ink)]"
                        : "font-semibold text-[var(--ink)]"
                    }`}
                  >
                    {peer?.name || "User"}
                  </span>
                  {c.lastMessageTime ? (
                    <time
                      dateTime={c.lastMessageTime}
                      className={`text-[10px] tabular-nums whitespace-nowrap shrink-0 ${
                        unread
                          ? "text-[var(--brand)] font-semibold"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {formatChatTime(c.lastMessageTime)}
                    </time>
                  ) : null}
                </span>

                <span className="mt-0.5 flex items-center gap-2 min-w-0">
                  <span
                    className={`text-xs truncate min-w-0 flex-1 ${
                      unread
                        ? "text-[var(--ink-secondary)] font-medium"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {c.lastMessage || "No messages yet"}
                  </span>
                  {unread > 0 ? (
                    <span className="min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-[var(--brand)] text-[var(--primary-foreground)] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
