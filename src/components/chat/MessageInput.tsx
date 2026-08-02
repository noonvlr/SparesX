"use client";

import { useRef, useState } from "react";

export default function MessageInput({
  onSend,
  onSendImage,
  onTyping,
  disabled,
}: {
  onSend: (text: string) => Promise<void> | void;
  onSendImage: (url: string) => Promise<void> | void;
  onTyping: () => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;
    setText("");
    await onSend(value);
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
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-3 border-t border-gray-100 bg-white"
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
        className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
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
        className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-base leading-5 max-h-28 focus:outline-none focus:ring-2 focus:ring-blue-500 chat-input"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}
