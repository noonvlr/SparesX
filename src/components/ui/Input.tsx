import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

const inputVariants = cva(
  "w-full rounded-[var(--radius)] border bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors duration-[var(--duration-normal)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--brand)] disabled:opacity-[var(--opacity-disabled)] disabled:bg-[var(--surface-3)]",
  {
    variants: {
      variant: {
        default: "border-[var(--border-strong)] hover:border-[var(--border-strong)]",
        error: "border-[var(--danger)] focus:ring-[var(--danger)]/30 focus:border-[var(--danger)]",
      },
      size: {
        sm: "h-9 min-h-[36px] px-3 text-sm",
        md: "h-11 min-h-[44px] px-3.5 text-base sm:text-sm",
        lg: "h-12 min-h-[48px] px-4 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inputVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputVariants> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size: _size, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        inputVariants({ variant, size: "md" }),
        "h-auto min-h-[96px] py-3 resize-y",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { inputVariants };
