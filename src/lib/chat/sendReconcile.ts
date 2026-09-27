import type { ChatMessage } from "@/types/chat";
import { sanitizeChatText } from "@/lib/chat/sanitize";

/** Server clock skew + slow networks: how far apart a pending bubble and its echo may be. */
export const ECHO_WINDOW_MS = 2 * 60 * 1000;

export function isPending(m: ChatMessage): boolean {
  return m.clientStatus === "sending" || m.clientStatus === "failed";
}

function sameContent(pending: ChatMessage, server: ChatMessage): boolean {
  if (pending.type !== server.type) return false;
  if (pending.type === "image") return Boolean(pending.mediaUrl) && pending.mediaUrl === server.mediaUrl;
  return sanitizeChatText(pending.text || "") === (server.text || "");
}

/**
 * Find the server copy of a locally pending message. Used when a send's
 * response was lost (server accepted it) or when a poll lands before the
 * send response, so neither case produces a duplicate or a false "failed".
 * `claimed` holds server ids already matched to confirmed/other bubbles.
 */
export function findServerEcho(
  pending: ChatMessage,
  serverMessages: ChatMessage[],
  claimed: Set<string>,
  windowMs = ECHO_WINDOW_MS,
): ChatMessage | undefined {
  const pendingAt = new Date(pending.createdAt).getTime();
  let best: ChatMessage | undefined;
  let bestGap = Number.POSITIVE_INFINITY;
  for (const m of serverMessages) {
    if (claimed.has(m._id) || isPending(m)) continue;
    if (String(m.senderId) !== String(pending.senderId)) continue;
    if (!sameContent(pending, m)) continue;
    const gap = Math.abs(new Date(m.createdAt).getTime() - pendingAt);
    if (gap > windowMs || gap >= bestGap) continue;
    best = m;
    bestGap = gap;
  }
  return best;
}

/**
 * Merge a fresh server page into the local thread:
 * - server fields win, but read/delivered never go backwards;
 * - pending bubbles whose echo arrived are dropped (ids reported back);
 * - remaining pending bubbles are kept.
 */
export function mergeThread(
  existing: ChatMessage[],
  server: ChatMessage[],
): { messages: ChatMessage[]; resolvedClientIds: string[] } {
  const confirmed = existing.filter((m) => !isPending(m));
  const pending = existing
    .filter(isPending)
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const byId = new Map(confirmed.map((m) => [m._id, m]));
  for (const m of server) {
    const prev = byId.get(m._id);
    byId.set(
      m._id,
      prev
        ? {
            ...prev,
            ...m,
            read: Boolean(prev.read || m.read),
            delivered: Boolean(prev.delivered || m.delivered),
          }
        : m,
    );
  }

  const claimed = new Set(confirmed.map((m) => m._id));
  const survivors: ChatMessage[] = [];
  const resolvedClientIds: string[] = [];
  for (const p of pending) {
    const echo = findServerEcho(p, server, claimed);
    if (echo) {
      claimed.add(echo._id);
      resolvedClientIds.push(p.clientId || p._id);
    } else {
      survivors.push(p);
    }
  }

  const messages = [...byId.values(), ...survivors].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return { messages, resolvedClientIds };
}
