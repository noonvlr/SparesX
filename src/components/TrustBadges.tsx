"use client";

import { useState } from "react";
import type { PublicTrustInfo } from "@/lib/trust";
import { badgesFromUserDoc } from "@/lib/trust";
import type { PublicBadge } from "@/lib/badges/catalog";
import { Button } from "@/components/ui/Button";

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
    pill: "bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/30",
    modal: "bg-[var(--warning-soft)] border-[var(--warning)]/20 text-[var(--ink)]",
    ring: "ring-[var(--warning)]/20",
  },
  purple: {
    pill: "bg-[var(--verified-soft)] text-[var(--verified)] border-[var(--verified)]/25",
    modal: "bg-[var(--verified-soft)] border-[var(--verified)]/20 text-[var(--ink)]",
    ring: "ring-[var(--verified)]/20",
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
  let tone =
    "bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]/25";
  if (score >= 81)
    tone =
      "bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/30";
  else if (score >= 61)
    tone =
      "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/25";
  else if (score >= 41)
    tone =
      "bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/20";
  else if (score >= 21)
    tone =
      "bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/30";

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
      <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
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
              aria-label={`${b.name} badge — ${b.shortDescription}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelected(b);
              }}
              className={`inline-flex items-center gap-1 rounded-full border font-semibold tracking-wide ${text} ${tone.pill} hover:opacity-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]`}
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
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-[var(--overlay)]"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selected.name}
        >
          <div
            className={`w-full max-w-md rounded-[var(--radius-lg)] border bg-[var(--modal-bg)] shadow-[var(--shadow-modal)] overflow-hidden ${colorClasses[selected.color].ring} ring-2`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`px-5 py-4 border-b ${colorClasses[selected.color].modal}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl leading-none mb-2" aria-hidden>
                    {selected.icon}
                  </p>
                  <h3 className="text-lg font-bold text-[var(--ink)]">
                    {selected.name}
                  </h3>
                  <p className="text-sm text-[var(--muted)] mt-0.5 capitalize">
                    {selected.type} badge
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(null)}
                  aria-label="Close badge details"
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-[var(--ink-secondary)]">
              <p>{selected.shortDescription}</p>
              <div>
                <p className="font-semibold text-[var(--ink)] mb-1">
                  How to earn this
                </p>
                <p className="leading-relaxed">{selected.criteria}</p>
              </div>
              {selected.awardedAt && (
                <p className="text-xs text-[var(--muted)]">
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
