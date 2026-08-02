"use client";

export default function TypingIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="px-4 py-1 text-xs text-[var(--muted)] flex items-center gap-1">
      <span className="inline-flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-[var(--brand)] rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-[var(--brand)] rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-[var(--brand)] rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
      typing…
    </div>
  );
}
