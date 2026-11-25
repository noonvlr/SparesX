import { cn } from "@/lib/ui/cn";

type SparesXAiMarkProps = {
  className?: string;
  title?: string;
  /** Decorative when nested inside a labeled control */
  decorative?: boolean;
  /**
   * `branded` — chip in currentColor, spark in brand teal.
   * `mono` — entire mark uses currentColor.
   */
  tone?: "branded" | "mono";
};

/**
 * SparesX AI mark — chip + spark.
 *
 * Chip (open top-right + left pins) = SparesX parts DNA.
 * Bold spark in the open corner = Assist / generated intelligence.
 * Two shapes only at tiny sizes: square chip + star. No fine traces.
 */
export function SparesXAiMark({
  className,
  title = "SparesX AI",
  decorative = false,
  tone = "branded",
}: SparesXAiMarkProps) {
  const accent = tone === "mono" ? "currentColor" : "var(--brand, #0d9488)";

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
    >
      {!decorative ? <title>{title}</title> : null}

      {/* Soft chip body */}
      <rect
        x="3.5"
        y="5.5"
        width="13"
        height="13"
        rx="3"
        fill="currentColor"
        opacity="0.14"
      />

      {/* Incomplete chip frame — open top-right */}
      <path
        d="M14.75 5.5
           H7
           C5.34 5.5 4 6.84 4 8.5
           V15
           C4 16.66 5.34 18 7 18
           H13.5
           C15.16 18 16.5 16.66 16.5 15
           V10.25"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left pins */}
      <path
        d="M4 9.25 H1.6 M4 12 H1.6 M4 14.75 H1.6"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
      />

      {/* Center node — quiet “alive” cue */}
      <circle cx="10.25" cy="12.25" r="2.35" fill={accent} />

      {/* Intelligence spark — dominant AI cue in the open corner */}
      <path
        d="M19.25 1.1
           L20.25 4.2
           L23.35 5.2
           L20.25 6.2
           L19.25 9.3
           L18.25 6.2
           L15.15 5.2
           L18.25 4.2
           Z"
        fill={accent}
      />
    </svg>
  );
}

export default SparesXAiMark;
