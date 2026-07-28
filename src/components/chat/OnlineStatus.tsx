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
          light ? "text-emerald-300" : "text-emerald-600"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${light ? "bg-emerald-400" : "bg-emerald-500"}`}
        />
        Online
      </span>
    );
  }
  if (lastSeen) {
    const d = new Date(lastSeen);
    return (
      <span className={`text-xs ${light ? "text-white/70" : "text-gray-500"}`}>
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
    <span className={`text-xs ${light ? "text-white/50" : "text-gray-400"}`}>
      Offline
    </span>
  );
}
