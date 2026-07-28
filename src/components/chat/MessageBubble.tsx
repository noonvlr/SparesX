"use client";

import type { ChatMessage } from "@/types/chat";

function Receipt({ message, mine }: { message: ChatMessage; mine: boolean }) {
  if (!mine) return null;
  if (message.read) {
    return <span className="text-sky-300 text-[10px] ml-1">✓✓</span>;
  }
  if (message.delivered) {
    return <span className="text-white/70 text-[10px] ml-1">✓✓</span>;
  }
  return <span className="text-white/70 text-[10px] ml-1">✓</span>;
}

export default function MessageBubble({
  message,
  mine,
}: {
  message: ChatMessage;
  mine: boolean;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          mine
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
        }`}
      >
        {message.type === "image" && message.mediaUrl ? (
          <a href={message.mediaUrl} target="_blank" rel="noreferrer">
            <img
              src={message.mediaUrl}
              alt="Shared"
              className="max-w-full rounded-lg max-h-64 object-cover mb-1"
            />
          </a>
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        )}
        <div
          className={`flex items-center justify-end gap-1 mt-0.5 ${
            mine ? "text-white/70" : "text-gray-400"
          }`}
        >
          <span className="text-[10px]">{time}</span>
          <Receipt message={message} mine={mine} />
        </div>
      </div>
    </div>
  );
}
