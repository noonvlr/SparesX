"use client";

import type { ChatMessage } from "@/types/chat";

function Receipt({ message, mine }: { message: ChatMessage; mine: boolean }) {
  if (!mine) return null;
  if (message.read) {
    return (
      <span className="text-[var(--brand-hover)] text-[10px] ml-1 opacity-90">
        ✓✓
      </span>
    );
  }
  if (message.delivered) {
    return (
      <span className="text-[var(--chat-timestamp-outgoing)] text-[10px] ml-1">
        ✓✓
      </span>
    );
  }
  return (
    <span className="text-[var(--chat-timestamp-outgoing)] text-[10px] ml-1">
      ✓
    </span>
  );
}

export default function MessageBubble({
  message,
  mine,
  onReport,
}: {
  message: ChatMessage;
  mine: boolean;
  onReport?: (message: ChatMessage) => void;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[80%] rounded-[var(--radius-lg)] px-3.5 py-2.5 text-[15px] shadow-[var(--shadow-sm)] ${
          mine
            ? "bg-[var(--chat-bubble-outgoing)] text-[var(--chat-bubble-outgoing-fg)] rounded-br-md"
            : "bg-[var(--chat-bubble-incoming)] text-[var(--ink)] border border-[var(--chat-bubble-incoming-border)] rounded-bl-md"
        }`}
      >
        {message.type === "image" && message.mediaUrl ? (
          <a href={message.mediaUrl} target="_blank" rel="noreferrer">
            {/* Product/chat images keep natural colors — never invert */}
            <img
              src={message.mediaUrl}
              alt="Shared"
              className="max-w-full rounded-lg max-h-64 object-cover mb-1"
            />
          </a>
        ) : (
          <p className="chat-bubble-text whitespace-pre-wrap break-words">
            {message.text}
          </p>
        )}
        <div
          className={`flex items-center justify-end gap-1 mt-0.5 ${
            mine
              ? "text-[var(--chat-timestamp-outgoing)]"
              : "text-[var(--chat-timestamp)]"
          }`}
        >
          <span className="text-[10px]">{time}</span>
          <Receipt message={message} mine={mine} />
          {!mine && onReport ? (
            <button
              type="button"
              onClick={() => onReport(message)}
              className="text-[10px] font-semibold underline-offset-2 hover:underline ml-1 opacity-80"
              aria-label="Report this message"
            >
              Report
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
