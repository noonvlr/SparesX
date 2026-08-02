"use client";

import { useEffect } from "react";
import { cn } from "@/lib/ui/cn";
import { Button } from "@/components/ui/Button";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Bottom sheet on mobile */
  sheet?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  sheet = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full sm:max-w-lg glass shadow-[var(--shadow-lg)]",
          sheet
            ? "rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-lg)] max-h-[90dvh] overflow-y-auto"
            : "rounded-[var(--radius-lg)] max-h-[90dvh] overflow-y-auto m-4",
          className,
        )}
      >
        {title ? (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-base font-semibold text-[var(--ink)]">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <span className="text-xl leading-none">×</span>
            </Button>
          </div>
        ) : null}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
