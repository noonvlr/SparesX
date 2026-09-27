import type { ChatConversation } from "@/types/chat";

export type InboxSnapshot = Map<string, { lastMessageAt: number; unread: number }>;

export type IncomingNotice = {
  conversationId: string;
  peerName: string;
  preview: string;
  at: number;
};

function timeOf(value?: string): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Compare an inbox refresh with the previous one and return genuinely new
 * incoming messages. The first call (prev = null) only records a baseline so
 * existing unread threads do not chime on page load.
 */
export function detectIncoming(
  prev: InboxSnapshot | null,
  conversations: ChatConversation[],
  opts: { userId: string; viewingIds?: Set<string> },
): { incoming: IncomingNotice[]; snapshot: InboxSnapshot } {
  const snapshot: InboxSnapshot = new Map();
  const incoming: IncomingNotice[] = [];

  for (const c of conversations) {
    const at = timeOf(c.lastMessageTime);
    const unread = c.unreadCount || 0;
    snapshot.set(c._id, { lastMessageAt: at, unread });
    if (!prev) continue;

    const before = prev.get(c._id);
    const newer = before ? at > before.lastMessageAt : unread > 0;
    const fromPeer =
      Boolean(c.lastMessageSenderId) &&
      String(c.lastMessageSenderId) !== String(opts.userId);
    const unreadGrew = unread > (before?.unread ?? 0);
    if (!newer || !fromPeer || !unreadGrew) continue;
    if (opts.viewingIds?.has(c._id)) continue;

    incoming.push({
      conversationId: c._id,
      peerName: c.peer?.name || "Someone",
      preview: c.lastMessage || "New message",
      at,
    });
  }

  return { incoming, snapshot };
}

export function incomingToastText(incoming: IncomingNotice[]): string {
  if (incoming.length === 0) return "";
  if (incoming.length === 1) {
    const [n] = incoming;
    const preview = n.preview.length > 60 ? `${n.preview.slice(0, 57)}…` : n.preview;
    return `${n.peerName}: ${preview}`;
  }
  return `${incoming.length} new messages`;
}
