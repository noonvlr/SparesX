import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full h-11 min-h-[44px] px-3.5 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-base sm:text-sm placeholder:text-[var(--muted)] transition-colors duration-200",
      "hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]",
      "disabled:opacity-50 disabled:bg-[var(--surface-3)]",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full min-h-[96px] px-3.5 py-3 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-base sm:text-sm placeholder:text-[var(--muted)] transition-colors duration-200 resize-y",
      "hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]",
      "disabled:opacity-50 disabled:bg-[var(--surface-3)]",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
