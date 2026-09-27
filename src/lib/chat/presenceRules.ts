/**
 * Pure presence / notification rules shared by the chat service (server)
 * and ChatProvider (client). No DB or browser imports here.
 */

/** Consider online if lastSeen within this window (REST presence). */
export const ONLINE_WINDOW_MS = 90_000;
export const TYPING_WINDOW_MS = 4_000;

/** Client presence heartbeat while the tab is visible. */
export const PRESENCE_HEARTBEAT_MS = 25_000;
/**
 * Viewing lease length. Must outlive one missed heartbeat so a single dropped
 * request does not flip the user to "not viewing", but stay short so a crashed
 * tab stops suppressing notifications within a minute.
 */
export const VIEWING_TTL_MS = 55_000;
/** Desktop allows 3 floating windows + the panel thread. */
export const MAX_VIEWING_IDS = 5;

/** Minimum gap between follow-up chat emails for one thread. */
export const CHAT_EMAIL_COOLDOWN_MS = 60 * 60 * 1000;

function toMs(value: Date | string | number | null | undefined): number {
  if (value === null || value === undefined) return NaN;
  return new Date(value).getTime();
}

export function isRecentlyOnline(
  lastSeen: Date | string | null | undefined,
  now = Date.now(),
): boolean {
  const t = toMs(lastSeen);
  if (Number.isNaN(t)) return false;
  return now - t < ONLINE_WINDOW_MS;
}

type ViewingMap =
  | Map<string, Date | string>
  | Record<string, Date | string | undefined>
  | null
  | undefined;

/** True while `userId` holds an unexpired viewing lease on the conversation. */
export function isViewingConversation(
  viewingUntil: ViewingMap,
  userId: string,
  now = Date.now(),
): boolean {
  if (!viewingUntil || !userId) return false;
  const raw =
    viewingUntil instanceof Map
      ? viewingUntil.get(String(userId))
      : viewingUntil[String(userId)];
  const t = toMs(raw);
  if (Number.isNaN(t)) return false;
  return t > now;
}

/**
 * Email decision for a chat notification. Mirrors the original rules:
 * a freshly created notification on the first unread burst emails;
 * collapsed follow-ups email only when the recipient looks offline and the
 * last email for the thread is older than the cooldown.
 */
export function decideChatEmail(params: {
  sendEmail: boolean;
  created: boolean;
  isFirstUnreadBurst: boolean;
  receiverOnline: boolean;
  lastEmailAt?: string | number | Date | null;
  now?: number;
}): boolean {
  const now = params.now ?? Date.now();
  if (!params.sendEmail) return false;
  if (params.created) return true;
  if (params.receiverOnline) return false;
  const lastMs = toMs(params.lastEmailAt ?? null);
  if (Number.isNaN(lastMs) || !lastMs) return true;
  return now - lastMs >= CHAT_EMAIL_COOLDOWN_MS;
}
