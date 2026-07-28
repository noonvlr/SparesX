"use client";

export default function OnlineStatus({
  online,
  lastSeen,
}: {
  online?: boolean;
  lastSeen?: string;
}) {
  if (online) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Online
      </span>
    );
  }
  if (lastSeen) {
    const d = new Date(lastSeen);
    return (
      <span className="text-xs text-gray-500">
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
  return <span className="text-xs text-gray-400">Offline</span>;
}
