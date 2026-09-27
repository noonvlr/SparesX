"use client";

import type { ChatMessage } from "@/types/chat";

function Receipt({ message, mine }: { message: ChatMessage; mine: boolean }) {
  if (!mine) return null;
  if (message.clientStatus === "sending") {
    return (
      <span
        className="text-[var(--chat-timestamp-outgoing)] text-[10px] ml-1"
        aria-label="Sending"
      >
        Sending…
      </span>
    );
  }
  if (message.clientStatus === "failed") return null;
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
  onRetry,
  onEdit,
  onDiscard,
}: {
  message: ChatMessage;
  mine: boolean;
  onReport?: (message: ChatMessage) => void;
  onRetry?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDiscard?: (message: ChatMessage) => void;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const failed = mine && message.clientStatus === "failed";

  return (
    <div
      className={`flex flex-col ${mine ? "items-end" : "items-start"} mb-2`}
    >
      <div
        className={`max-w-[80%] rounded-[var(--radius-lg)] px-3.5 py-2.5 text-[15px] shadow-[var(--shadow-sm)] ${
          mine
            ? "bg-[var(--chat-bubble-outgoing)] text-[var(--chat-bubble-outgoing-fg)] rounded-br-md"
            : "bg-[var(--chat-bubble-incoming)] text-[var(--ink)] border border-[var(--chat-bubble-incoming-border)] rounded-bl-md"
        } ${message.clientStatus ? "opacity-80" : ""} ${
          failed ? "ring-1 ring-[var(--danger)]" : ""
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
              className="text-[10px] font-semibold underline-offset-2 hover:underline ml-1 opacity-80 min-h-6 px-1"
              aria-label="Report this message"
            >
              Report
            </button>
          ) : null}
        </div>
      </div>
      {failed ? (
        <div
          className="mt-1 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[11px]"
          role="alert"
        >
          <span className="font-semibold text-[var(--danger)]">
            Not sent{message.clientError ? ` — ${message.clientError}` : ""}
          </span>
          {onRetry ? (
            <button
              type="button"
              onClick={() => onRetry(message)}
              className="font-semibold text-[var(--brand)] hover:underline min-h-6"
            >
              Retry
            </button>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(message)}
              className="font-semibold text-[var(--ink-secondary)] hover:underline min-h-6"
            >
              Edit
            </button>
          ) : null}
          {onDiscard ? (
            <button
              type="button"
              onClick={() => onDiscard(message)}
              className="font-semibold text-[var(--muted)] hover:underline min-h-6"
            >
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
