"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

const iconButtonVariants = cva(
  "btn-press inline-flex items-center justify-center rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none",
  {
    variants: {
      variant: {
        ghost: "bg-transparent text-[var(--ink-secondary)] hover:bg-[var(--surface-3)]",
        soft: "bg-[var(--brand-soft)] text-[var(--brand-hover)] hover:bg-[var(--brand-muted)]",
        outline:
          "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]",
        danger: "bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-[var(--ink-inverse)]",
      },
      size: {
        sm: "h-8 w-8 min-h-[32px] min-w-[32px]",
        md: "h-11 w-11 min-h-[44px] min-w-[44px]",
        lg: "h-12 w-12 min-h-[48px] min-w-[48px]",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  },
);

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";

export { iconButtonVariants };
