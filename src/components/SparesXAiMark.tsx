import { cn } from "@/lib/ui/cn";

type SparesXAiMarkProps = {
  className?: string;
  title?: string;
  /** Decorative when nested inside a labeled control */
  decorative?: boolean;
  /**
   * `branded` — chip in currentColor, trace/spark in brand teal.
   * `mono` — entire mark uses currentColor.
   */
  tone?: "branded" | "mono";
};

/**
 * SparesX Spark Node — official AI / Assist mark.
 *
 * Silhouette = SparesX microchip (open top-right + left pins).
 * Meaning = circuit energy becoming an intelligence spark at the open corner.
 * Drawn for 16–20px: square chip body first, then one L-trace + one spark.
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

      {/* Soft chip body — makes the square read instantly at tiny sizes */}
      <rect
        x="5"
        y="5"
        width="13"
        height="13"
        rx="3"
        fill="currentColor"
        opacity="0.08"
      />

      {/* Incomplete chip outline — gap only at top-right */}
      <path
        d="M16.5 5
           H8
           C6.35 5 5 6.35 5 8
           V15
           C5 16.65 6.35 18 8 18
           H15
           C16.65 18 18 16.65 18 15
           V10.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left pins — signature SparesX detail */}
      <path
        d="M5 9 H3 M5 11.5 H3 M5 14 H3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* One L-trace toward the open corner */}
      <path
        d="M8.5 14.5 H12 V9"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="1.5" fill={accent} />

      {/* Intelligence spark in the open corner */}
      <path
        d="M19 2.1
           L19.7 4.7
           L22.4 5.4
           L19.7 6.1
           L19 8.7
           L18.3 6.1
           L15.6 5.4
           L18.3 4.7
           Z"
        fill={accent}
      />
    </svg>
  );
}

export default SparesXAiMark;
