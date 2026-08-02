"use client";

import { useState } from "react";
import type { PublicTrustInfo } from "@/lib/trust";
import { badgesFromUserDoc } from "@/lib/trust";
import type { PublicBadge } from "@/lib/badges/catalog";

type Size = "sm" | "md";

const colorClasses: Record<
  PublicBadge["color"],
  { pill: string; modal: string; ring: string }
> = {
  blue: {
    pill: "bg-[var(--brand-soft)] text-[var(--brand-hover)] border-[var(--brand-muted)]",
    modal: "bg-[var(--brand-soft)] border-[var(--brand-muted)] text-[var(--ink)]",
    ring: "ring-[var(--brand-muted)]",
  },
  gold: {
    pill: "bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-100",
    modal: "bg-amber-50 border-amber-200 text-amber-950",
    ring: "ring-amber-100",
  },
  purple: {
    pill: "bg-violet-50 text-violet-900 border-violet-200",
    modal: "bg-violet-50 border-violet-200 text-violet-950",
    ring: "ring-violet-100",
  },
};

function TrustScoreChip({
  score,
  label,
  size,
}: {
  score: number;
  label?: string;
  size: Size;
}) {
  let tone = "bg-red-50 text-red-800 border-red-200";
  if (score >= 81) tone = "bg-amber-50 text-amber-900 border-amber-300";
  else if (score >= 61) tone = "bg-emerald-50 text-emerald-800 border-emerald-200";
  else if (score >= 41) tone = "bg-yellow-50 text-yellow-900 border-yellow-200";
  else if (score >= 21) tone = "bg-orange-50 text-orange-800 border-orange-200";

  const text = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${text} ${tone}`}
      title={`Trust score: ${score}/100${label ? ` · ${label}` : ""}`}
    >
      {score >= 81 ? "⭐" : score >= 61 ? "🟢" : score >= 41 ? "🟡" : score >= 21 ? "🟠" : "🔴"}
      {label || score}
    </span>
  );
}

/**
 * Shows verification / reputation / special badges for a user.
 * Blue = verification, Gold = reputation, Purple = special.
 */
export default function TrustBadges({
  phoneVerified,
  emailVerified,
  kycVerified,
  businessVerified,
  addressVerified,
  isTrusted,
  trustScore,
  trustLabel,
  badges: badgesProp,
  activeBadgeKeys,
  size = "sm",
  className = "",
  showScore = false,
}: PublicTrustInfo & {
  size?: Size;
  className?: string;
  showScore?: boolean;
}) {
  const [selected, setSelected] = useState<PublicBadge | null>(null);

  const badges =
    badgesProp && badgesProp.length
      ? badgesProp
      : badgesFromUserDoc({
          phoneVerified,
          emailVerified,
          kycVerified,
          businessVerified,
          addressVerified,
          isTrusted,
          activeBadgeKeys,
          trustScore,
        });

  if (!badges.length && !(showScore && typeof trustScore === "number")) {
    return null;
  }

  const text = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";

  return (
    <>
      <span
        className={`inline-flex flex-wrap items-center gap-1 ${className}`}
      >
        {showScore && typeof trustScore === "number" && (
          <TrustScoreChip score={trustScore} label={trustLabel} size={size} />
        )}
        {badges.map((b) => {
          const tone = colorClasses[b.color];
          return (
            <button
              key={b.key}
              type="button"
              title={b.shortDescription}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelected(b);
              }}
              className={`inline-flex items-center gap-1 rounded-full border font-semibold tracking-wide ${text} ${tone.pill} hover:opacity-90 cursor-pointer`}
            >
              <span aria-hidden>{b.icon}</span>
              <span className="hidden sm:inline">{b.name}</span>
              <span className="sm:hidden">{b.name.split(" ")[0]}</span>
            </button>
          );
        })}
      </span>

      {selected && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selected.name}
        >
          <div
            className={`w-full max-w-md rounded-2xl border bg-white shadow-xl overflow-hidden ${colorClasses[selected.color].ring} ring-2`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`px-5 py-4 border-b ${colorClasses[selected.color].modal}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl leading-none mb-2">{selected.icon}</p>
                  <h3 className="text-lg font-bold">{selected.name}</h3>
                  <p className="text-sm opacity-80 mt-0.5 capitalize">
                    {selected.type} badge
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg px-2 py-1 text-sm font-semibold hover:bg-black/5"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-gray-700">
              <p>{selected.shortDescription}</p>
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  How to earn this
                </p>
                <p className="leading-relaxed">{selected.criteria}</p>
              </div>
              {selected.awardedAt && (
                <p className="text-xs text-gray-500">
                  Awarded {new Date(selected.awardedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
