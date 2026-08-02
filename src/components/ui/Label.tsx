import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-label text-[var(--ink-secondary)] block mb-1.5",
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = "Label";
