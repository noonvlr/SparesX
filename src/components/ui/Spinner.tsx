import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-8 w-8",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export function Spinner({
  className,
  size,
  label = "Loading",
}: VariantProps<typeof spinnerVariants> & {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(spinnerVariants({ size }), className)}
    />
  );
}
