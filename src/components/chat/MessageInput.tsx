"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Textarea } from "@/components/ui/Input";
import { authFetch } from "@/lib/auth/clientAuth";
import { showToast } from "@/components/ToastHost";

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
  restoreDraft,
}: {
  onSend: (text: string) => Promise<void> | void;
  onSendImage: (url: string) => Promise<void> | void;
  onTyping: () => void;
  disabled?: boolean;
  /** Client-only preset chips shown above the input for new/short threads. */
  showQuickReplies?: boolean;
  /** Put text back into the composer (e.g. "Edit" on a failed bubble). */
  restoreDraft?: { text: string; nonce: number } | null;
}) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!restoreDraft) return;
    setText(restoreDraft.text);
    textareaRef.current?.focus();
  }, [restoreDraft]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || disabled || submittingRef.current) return;
    submittingRef.current = true;
    // The bubble keeps the text (with Retry) if delivery fails.
    setText("");
    try {
      await onSend(value);
    } catch (err) {
      setText((current) => current || value);
      showToast(
        err instanceof Error && err.message ? err.message : "Message not sent",
        "error",
        3500,
      );
    } finally {
      submittingRef.current = false;
    }
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
      const res = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      const url = data.urls?.[0];
      if (!res.ok || !url) throw new Error(data.message || "Image upload failed");
      await onSendImage(url);
    } catch (err) {
      showToast(
        err instanceof Error && err.message ? err.message : "Image upload failed",
        "error",
        3500,
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-[var(--surface)]">
      {showQuickReplies && (
        <div className="flex gap-2 overflow-x-auto px-3 pt-2.5 pb-1 scrollbar-hide">
          {QUICK_REPLIES.map((reply) => (
            <Button
              key={reply}
              type="button"
              size="sm"
              variant="soft"
              disabled={disabled || Boolean(sendingReply)}
              onClick={() => void handleQuickReply(reply)}
              className="shrink-0 whitespace-nowrap rounded-full h-auto min-h-0 py-1.5 text-xs"
            >
              {sendingReply === reply ? "…" : reply}
            </Button>
          ))}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 p-3 border-t border-[var(--border)]"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <IconButton
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
          aria-label="Attach image"
          className="rounded-xl"
        >
          {uploading ? "…" : "📷"}
        </IconButton>
        <Textarea
          ref={textareaRef}
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
          className="flex-1 resize-none min-h-0 max-h-28 py-2.5 leading-5 chat-input"
        />
        <Button
          type="submit"
          size="sm"
          disabled={disabled || !text.trim()}
          className="rounded-xl"
        >
          Send
        </Button>
      </form>
    </div>
  );
}
