import Link from "next/link";
import { cn } from "@/lib/ui/cn";

type BrandMarkProps = {
  href?: string;
  className?: string;
  /** Visual size for the mark + wordmark */
  size?: "sm" | "md" | "lg";
  /** When true, render as a non-link block (e.g. inside another link) */
  asSpan?: boolean;
};

const SIZE = {
  sm: {
    icon: "h-7 w-7",
    text: "text-lg",
    gap: "gap-1.5",
  },
  md: {
    icon: "h-8 w-8 sm:h-9 sm:w-9",
    text: "text-xl sm:text-2xl",
    gap: "gap-2",
  },
  lg: {
    icon: "h-9 w-9 sm:h-10 sm:w-10",
    text: "text-xl sm:text-2xl",
    gap: "gap-2.5",
  },
} as const;

/**
 * Site brand: chip icon + “Spares” (ink) + “X” (brand).
 * Matches the homepage hero mark so nav/footer stay consistent.
 */
export function BrandMark({
  href = "/",
  className,
  size = "sm",
  asSpan = false,
}: BrandMarkProps) {
  const s = SIZE[size];
  const content = (
    <>
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)]",
          s.icon,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sparesx-icon.svg"
          alt=""
          width={40}
          height={40}
          className="h-[78%] w-[78%] object-contain"
          decoding="async"
        />
      </span>
      <span
        className={cn(
          "font-semibold tracking-tight text-[var(--ink)]",
          s.text,
        )}
      >
        Spares<span className="text-[var(--brand)]">X</span>
      </span>
    </>
  );

  const classes = cn(
    "inline-flex items-center shrink-0",
    s.gap,
    className,
  );

  if (asSpan) {
    return (
      <span className={classes} aria-label="SparesX">
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={classes} aria-label="SparesX home">
      {content}
    </Link>
  );
}
