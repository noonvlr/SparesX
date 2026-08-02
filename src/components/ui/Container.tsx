import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

const containerVariants = cva("mx-auto w-full px-4 md:px-8", {
  variants: {
    size: {
      sm: "max-w-[var(--container-sm)]",
      md: "max-w-[var(--container-md)]",
      lg: "max-w-[var(--container-lg)]",
      xl: "max-w-[var(--container-xl)]",
      full: "max-w-none",
    },
  },
  defaultVariants: { size: "lg" },
});

export function Container({
  className,
  size,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof containerVariants>) {
  return (
    <div className={cn(containerVariants({ size }), className)} {...props}>
      {children}
    </div>
  );
}

const stackVariants = cva("flex", {
  variants: {
    direction: {
      row: "flex-row",
      col: "flex-col",
    },
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
      xl: "gap-6",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
  },
  defaultVariants: { direction: "col", gap: "md", align: "stretch" },
});

export function Stack({
  className,
  direction,
  gap,
  align,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof stackVariants>) {
  return (
    <div
      className={cn(stackVariants({ direction, gap, align }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4",
        className,
      )}
    >
      <div>
        <h2 className="text-title text-[var(--ink)]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export { containerVariants, stackVariants };
