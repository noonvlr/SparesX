import Link from "next/link";
import { cn } from "@/lib/ui/cn";

type BrandMarkProps = {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Text-only mark — no logo image (logo is homepage-only). */
  asSpan?: boolean;
  /**
   * `onDark` uses light text for dark surfaces (footer is always dark).
   * Default uses page ink so it works on the light/dark nav glass.
   */
  tone?: "default" | "onDark";
};

const TEXT_SIZE = {
  sm: "text-lg",
  md: "text-xl sm:text-2xl",
  lg: "text-xl sm:text-2xl",
} as const;

/**
 * Text wordmark: “Spares” + brand-colored “X”.
 * Logo artwork is homepage-only — never render the PNG/SVG here.
 */
export function BrandMark({
  href = "/",
  className,
  size = "sm",
  asSpan = false,
  tone = "default",
}: BrandMarkProps) {
  const content = (
    <span
      className={cn(
        "font-semibold tracking-tight",
        TEXT_SIZE[size],
        tone === "onDark" ? "text-[var(--footer-heading)]" : "text-[var(--ink)]",
      )}
    >
      Spares<span className="text-[var(--brand)]">X</span>
    </span>
  );

  const classes = cn("inline-flex items-center shrink-0", className);

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
