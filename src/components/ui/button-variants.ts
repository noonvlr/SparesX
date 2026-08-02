import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "btn-press inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-2)] disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--brand)] text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] hover:bg-[var(--brand-hover)]",
        secondary:
          "bg-[var(--surface)] text-[var(--ink)] border border-[var(--border-strong)] hover:bg-[var(--surface-2)]",
        outline:
          "bg-transparent text-[var(--ink)] border border-[var(--border-strong)] hover:bg-[var(--surface-3)]",
        ghost:
          "bg-transparent text-[var(--ink-secondary)] hover:bg-[var(--surface-3)]",
        link: "bg-transparent text-[var(--brand)] underline-offset-4 hover:underline p-0 h-auto min-h-0 shadow-none",
        danger:
          "bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)] shadow-[var(--shadow-sm)]",
        soft: "bg-[var(--brand-soft)] text-[var(--brand-hover)] hover:bg-[var(--brand-muted)]",
        success:
          "bg-[var(--success)] text-white hover:opacity-90 shadow-[var(--shadow-sm)]",
      },
      size: {
        sm: "h-9 px-3 text-[var(--text-button)] min-h-[36px]",
        md: "h-11 px-4 text-[var(--text-button)] min-h-[44px]",
        lg: "h-12 px-5 text-base min-h-[48px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px] p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
