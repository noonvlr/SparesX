"use client";

export default function OnlineStatus({
  online,
  lastSeen,
  light,
  /** list rows: online label only; hide noisy last-seen */
  compact,
}: {
  online?: boolean;
  lastSeen?: string;
  light?: boolean;
  compact?: boolean;
}) {
  if (online) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-medium text-[var(--success)] ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
        Online
      </span>
    );
  }

  if (compact) return null;

  if (lastSeen) {
    const d = new Date(lastSeen);
    return (
      <span
        className={`text-xs ${
          light ? "text-[var(--chat-timestamp-outgoing)]" : "text-[var(--muted)]"
        }`}
      >
        Last seen{" "}
        {d.toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    );
  }
  return (
    <span
      className={`text-xs ${
        light ? "text-[var(--chat-timestamp-outgoing)]" : "text-[var(--muted)]"
      }`}
    >
      Offline
    </span>
  );
}
