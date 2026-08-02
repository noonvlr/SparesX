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
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium ${
          light ? "text-[var(--success-soft)]" : "text-[var(--success)]"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            light ? "bg-[var(--success-soft)]" : "bg-[var(--success)]"
          }`}
        />
        Online
      </span>
    );
  }
  if (lastSeen) {
    const d = new Date(lastSeen);
    return (
      <span
        className={`text-xs ${
          light ? "text-[var(--ink-inverse)]/70" : "text-[var(--muted)]"
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
        light ? "text-[var(--ink-inverse)]/50" : "text-[var(--muted)]"
      }`}
    >
      Offline
    </span>
  );
}
