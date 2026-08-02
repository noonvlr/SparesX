"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/ui/cn";
import { IconButton } from "@/components/ui/IconButton";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Bottom sheet on mobile */
  sheet?: boolean;
  footer?: React.ReactNode;
};

function getFocusable(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  sheet = true,
  footer,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = getFocusable(panelRef.current);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const nodes = panelRef.current ? getFocusable(panelRef.current) : [];
    (nodes[0] ?? panelRef.current)?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : "Dialog"}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[var(--overlay)]"
        aria-label="Close dialog backdrop"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative w-full sm:max-w-lg bg-[var(--surface-elevated)] shadow-[var(--shadow-modal)] border border-[var(--border)] outline-none",
          sheet
            ? "rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-lg)] max-h-[90dvh] overflow-y-auto"
            : "rounded-[var(--radius-lg)] max-h-[90dvh] overflow-y-auto m-4",
          className,
        )}
      >
        {title ? (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--divider)] sticky top-0 bg-[var(--surface-elevated)] z-10">
            <h2
              id={titleId}
              className="text-base font-semibold text-[var(--ink)]"
            >
              {title}
            </h2>
            <IconButton aria-label="Close" size="sm" onClick={onClose}>
              <span className="text-xl leading-none" aria-hidden>
                ×
              </span>
            </IconButton>
          </div>
        ) : null}
        <div className="p-5">{children}</div>
        {footer ? (
          <div className="px-5 py-4 border-t border-[var(--divider)] flex flex-wrap justify-end gap-2">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
