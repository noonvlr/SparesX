"use client";

import { useRef, useState } from "react";

const QUICK_REPLIES = [
  "Is this available?",
  "What's your best price?",
  "Can you share more photos?",
];

export default function MessageInput({
  onSend,
  onSendImage,
  onTyping,
  disabled,
  showQuickReplies,
}: {
  onSend: (text: string) => Promise<void> | void;
  onSendImage: (url: string) => Promise<void> | void;
  onTyping: () => void;
  disabled?: boolean;
  /** Client-only preset chips shown above the input for new/short threads. */
  showQuickReplies?: boolean;
}) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;
    setText("");
    await onSend(value);
  }

  async function handleQuickReply(reply: string) {
    if (disabled || sendingReply) return;
    setSendingReply(reply);
    try {
      await onSend(reply);
    } finally {
      setSendingReply(null);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const headers: HeadersInit = {};
      const token = localStorage.getItem("token");
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch("/api/upload", {
        method: "POST",
        headers,
        body: formData,
      });
      const data = await res.json();
      const url = data.urls?.[0];
      if (!url) throw new Error("Upload failed");
      await onSendImage(url);
    } catch {
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white">
      {showQuickReplies && (
        <div className="flex gap-2 overflow-x-auto px-3 pt-2.5 pb-1 scrollbar-hide">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              disabled={disabled || Boolean(sendingReply)}
              onClick={() => void handleQuickReply(reply)}
              className="btn-press shrink-0 whitespace-nowrap rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 hover:border-teal-300 transition disabled:opacity-50"
            >
              {sendingReply === reply ? "…" : reply}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 p-3 border-t border-gray-100"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
          className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 disabled:opacity-50"
          aria-label="Attach image"
        >
          {uploading ? "…" : "📷"}
        </button>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit(e);
            }
          }}
          rows={1}
          placeholder="Type a message"
          disabled={disabled}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-base leading-5 max-h-28 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-300 chat-input"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="btn-press px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
