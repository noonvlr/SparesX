/**
 * In-memory presence. Swap for Redis adapter later for multi-instance.
 */
export type PresenceState = {
  /** userId -> set of socket ids */
  sockets: Map<string, Set<string>>;
  /** userId -> conversationId currently viewing */
  viewing: Map<string, string>;
};

export const presence: PresenceState = {
  sockets: new Map(),
  viewing: new Map(),
};

export function addSocket(userId: string, socketId: string): boolean {
  let set = presence.sockets.get(userId);
  const wasOffline = !set || set.size === 0;
  if (!set) {
    set = new Set();
    presence.sockets.set(userId, set);
  }
  set.add(socketId);
  return wasOffline;
}

export function removeSocket(
  userId: string,
  socketId: string,
): { wentOffline: boolean } {
  const set = presence.sockets.get(userId);
  if (!set) return { wentOffline: false };
  set.delete(socketId);
  if (set.size === 0) {
    presence.sockets.delete(userId);
    presence.viewing.delete(userId);
    return { wentOffline: true };
  }
  return { wentOffline: false };
}

export function isOnline(userId: string): boolean {
  const set = presence.sockets.get(userId);
  return Boolean(set && set.size > 0);
}

export function listOnlineUserIds(): string[] {
  return [...presence.sockets.entries()]
    .filter(([, sockets]) => sockets.size > 0)
    .map(([userId]) => userId);
}

export function setViewing(userId: string, conversationId: string | null) {
  if (!conversationId) presence.viewing.delete(userId);
  else presence.viewing.set(userId, conversationId);
}

export function isViewing(userId: string, conversationId: string): boolean {
  return presence.viewing.get(userId) === conversationId;
}
