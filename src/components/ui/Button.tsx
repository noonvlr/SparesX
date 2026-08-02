import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

const buttonVariants = cva(
  "btn-press inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--brand)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--brand-hover)]",
        secondary:
          "bg-[var(--surface)] text-[var(--ink)] border border-[var(--border-strong)] hover:bg-[var(--surface-2)]",
        ghost:
          "bg-transparent text-[var(--ink-secondary)] hover:bg-[var(--surface-3)]",
        danger:
          "bg-[var(--danger)] text-white hover:bg-red-700 shadow-[var(--shadow-sm)]",
        soft: "bg-[var(--brand-soft)] text-[var(--brand-hover)] hover:bg-[var(--brand-muted)]",
      },
      size: {
        sm: "h-9 px-3 text-sm min-h-[36px]",
        md: "h-11 px-4 text-sm min-h-[44px]",
        lg: "h-12 px-5 text-base min-h-[48px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px] p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
