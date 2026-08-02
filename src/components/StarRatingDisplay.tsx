"use client";

type Props = {
  value: number;
  count?: number;
  size?: "sm" | "md";
  showEmpty?: boolean;
  className?: string;
};

export default function StarRatingDisplay({
  value,
  count,
  size = "sm",
  showEmpty = true,
  className = "",
}: Props) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  if (!showEmpty && rating <= 0) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      title={
        rating > 0
          ? `${rating.toFixed(1)} out of 5${typeof count === "number" ? ` (${count} reviews)` : ""}`
          : "No ratings yet"
      }
    >
      <span className="inline-flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= full || (i === full + 1 && hasHalf);
          return (
            <svg
              key={i}
              className={starSize}
              viewBox="0 0 20 20"
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M10 2l2.39 4.84L18 7.27l-3.9 3.8.92 5.36L10 14.9l-4.98 2.53.92-5.36L2 7.27l5.61-.43L10 2z" />
            </svg>
          );
        })}
      </span>
      <span
        className={`font-semibold text-gray-800 ${
          size === "sm" ? "text-xs" : "text-sm"
        }`}
      >
        {rating > 0 ? rating.toFixed(1) : "New"}
      </span>
      {typeof count === "number" && count > 0 && (
        <span className="text-xs text-gray-500">({count})</span>
      )}
    </span>
  );
}

export function StarPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-800 mb-1.5">{label}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`p-1 rounded-lg transition ${
              n <= value ? "text-amber-500" : "text-gray-300 hover:text-amber-300"
            }`}
            aria-label={`${n} stars`}
          >
            <svg className="w-7 h-7" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2l2.39 4.84L18 7.27l-3.9 3.8.92 5.36L10 14.9l-4.98 2.53.92-5.36L2 7.27l5.61-.43L10 2z" />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600 font-medium">{value}/5</span>
      </div>
    </div>
  );
}
