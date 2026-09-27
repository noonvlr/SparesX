export type ChatSyncStatus =
  | "live"
  | "connected"
  | "syncing"
  | "paused"
  | "reconnecting"
  | "offline";

/** Consecutive failed syncs before the UI says "Offline" instead of "Reconnecting". */
export const OFFLINE_AFTER_FAILURES = 3;

export function deriveSyncStatus(s: {
  loggedIn: boolean;
  socketConnected: boolean;
  browserOnline: boolean;
  hidden: boolean;
  failures: number;
  hasSynced: boolean;
}): ChatSyncStatus {
  if (!s.loggedIn) return "offline";
  if (s.socketConnected) return "live";
  if (!s.browserOnline) return "offline";
  if (s.failures >= OFFLINE_AFTER_FAILURES) return "offline";
  if (s.failures > 0) return "reconnecting";
  if (!s.hasSynced) return "syncing";
  if (s.hidden) return "paused";
  return "connected";
}

export const SYNC_STATUS_COPY: Record<
  ChatSyncStatus,
  { label: string; title: string; tone: "success" | "warning" | "danger" }
> = {
  live: {
    label: "Live",
    title: "Real-time connection active",
    tone: "success",
  },
  connected: {
    label: "Connected",
    title: "Checking for new messages every few seconds",
    tone: "success",
  },
  syncing: {
    label: "Syncing…",
    title: "Loading your conversations",
    tone: "warning",
  },
  paused: {
    label: "Paused",
    title: "Sync paused while this tab is in the background",
    tone: "warning",
  },
  reconnecting: {
    label: "Reconnecting…",
    title: "Could not reach SparesX — retrying",
    tone: "warning",
  },
  offline: {
    label: "Offline",
    title: "No connection — messages will sync when you are back online",
    tone: "danger",
  },
};
