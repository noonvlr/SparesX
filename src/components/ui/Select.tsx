import { forwardRef, type SelectHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

const selectVariants = cva(
  "w-full appearance-none rounded-[var(--radius)] border bg-[var(--surface)] text-[var(--ink)] transition-colors duration-[var(--duration-normal)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--brand)] disabled:opacity-[var(--opacity-disabled)] disabled:bg-[var(--surface-3)] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10",
  {
    variants: {
      variant: {
        default: "border-[var(--border-strong)]",
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

const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">,
    VariantProps<typeof selectVariants> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, size, style, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(selectVariants({ variant, size }), className)}
      style={{ backgroundImage: chevron, ...style }}
      {...props}
    />
  ),
);
Select.displayName = "Select";

export { selectVariants };
