"use client";

export default function OnlineStatus({
  online,
  lastSeen,
  light,
}: {
  online?: boolean;
  lastSeen?: string;
  light?: boolean;
}) {
  if (online) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--success)]">
        <span className="w-2 h-2 rounded-full bg-[var(--success)] shadow-[0_0_0_3px_var(--success-soft)]" />
        Online
      </span>
    );
  }
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
