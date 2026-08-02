import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

const alertVariants = cva(
  "rounded-[var(--radius)] border px-4 py-3 text-sm",
  {
    variants: {
      tone: {
        info: "bg-[var(--info-soft)] border-[var(--info)]/20 text-[var(--info)]",
        success:
          "bg-[var(--success-soft)] border-[var(--success)]/20 text-[var(--success)]",
        warning:
          "bg-[var(--warning-soft)] border-[var(--warning)]/20 text-[var(--warning)]",
        danger:
          "bg-[var(--danger-soft)] border-[var(--danger)]/20 text-[var(--danger)]",
        neutral:
          "bg-[var(--surface-3)] border-[var(--border)] text-[var(--ink-secondary)]",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

export function Alert({
  tone,
  title,
  children,
  className,
}: VariantProps<typeof alertVariants> & {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ tone }), className)}
    >
      {title ? <p className="font-semibold mb-0.5">{title}</p> : null}
      {children ? <div className="text-[inherit] opacity-90">{children}</div> : null}
    </div>
  );
}

export { alertVariants };
