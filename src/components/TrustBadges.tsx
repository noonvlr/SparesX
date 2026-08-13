"use client";

import { useState } from "react";
import type { PublicTrustInfo } from "@/lib/trust";
import {
  badgeShortLabel,
  badgesFromUserDoc,
  selectBadgesForDensity,
  type BadgeDensity,
} from "@/lib/trust";
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
  density,
}: {
  score: number;
  label?: string;
  size: Size;
  density: BadgeDensity;
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

  const icon =
    score >= 81 ? "⭐" : score >= 61 ? "🟢" : score >= 41 ? "🟡" : score >= 21 ? "🟠" : "🔴";

  if (density === "icons") {
    return (
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${tone}`}
        title={`Trust score: ${score}/100${label ? ` · ${label}` : ""}`}
      >
        <span aria-hidden>{icon}</span>
      </span>
    );
  }

  const text = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${text} ${tone}`}
      title={`Trust score: ${score}/100${label ? ` · ${label}` : ""}`}
    >
      <span aria-hidden>{icon}</span>
      {label || score}
    </span>
  );
}

function BadgeDetailModal({
  selected,
  onClose,
}: {
  selected: PublicBadge;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-[var(--overlay)]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={selected.name}
    >
      <div
        className={`w-full max-w-md rounded-[var(--radius-lg)] border bg-[var(--surface-elevated)] shadow-[var(--shadow-modal)] overflow-hidden ${colorClasses[selected.color].ring} ring-2`}
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
              onClick={onClose}
              aria-label="Close badge details"
            >
              Close
            </Button>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm text-[var(--ink-secondary)]">
          <p>{selected.shortDescription}</p>
          <div>
            <p className="font-semibold text-[var(--ink)] mb-1">How to earn this</p>
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
  );
}

function AllBadgesModal({
  badges,
  onSelect,
  onClose,
}: {
  badges: PublicBadge[];
  onSelect: (b: PublicBadge) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-[var(--overlay)]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="All trust badges"
    >
      <div
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[var(--shadow-modal)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--divider)]">
          <h3 className="text-base font-bold text-[var(--ink)]">Trust badges</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </Button>
        </div>
        <ul className="max-h-[60dvh] overflow-y-auto p-3 space-y-1">
          {badges.map((b) => {
            const tone = colorClasses[b.color];
            return (
              <li key={`${b.key}-${b.name}`}>
                <button
                  type="button"
                  onClick={() => onSelect(b)}
                  className={`w-full flex items-start gap-3 rounded-[var(--radius)] border px-3 py-2.5 text-left ${tone.pill}`}
                >
                  <span className="text-lg leading-none shrink-0" aria-hidden>
                    {b.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{b.name}</span>
                    <span className="block text-xs opacity-80 mt-0.5">
                      {b.shortDescription}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/**
 * Shows verification / reputation / special badges for a user.
 *
 * Densities:
 * - icons: chat lists — icon chips, single row, max 3
 * - compact: cards / directories — short labels, collapsed verification
 * - full: profiles — complete badge set
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
  density = "compact",
  className = "",
  showScore = false,
}: PublicTrustInfo & {
  size?: Size;
  density?: BadgeDensity;
  className?: string;
  showScore?: boolean;
}) {
  const [selected, setSelected] = useState<PublicBadge | null>(null);
  const [showAll, setShowAll] = useState(false);

  const allBadges =
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

  const visible = selectBadgesForDensity(allBadges, density);
  const hiddenCount =
    density === "full" ? 0 : Math.max(0, allBadges.length - visible.length);

  if (
    !visible.length &&
    !hiddenCount &&
    !(showScore && typeof trustScore === "number")
  ) {
    return null;
  }

  const text = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";
  const wrapClass =
    density === "full"
      ? "inline-flex flex-wrap items-center gap-1.5"
      : "inline-flex flex-nowrap items-center gap-1 max-w-full overflow-hidden";

  return (
    <>
      <span className={`${wrapClass} ${className}`}>
        {showScore && typeof trustScore === "number" && (
          <TrustScoreChip
            score={trustScore}
            label={trustLabel}
            size={size}
            density={density}
          />
        )}
        {visible.map((b) => {
          const tone = colorClasses[b.color];
          const label = badgeShortLabel(b);
          if (density === "icons") {
            return (
              <button
                key={`${b.key}-${b.name}`}
                type="button"
                title={`${b.name} — ${b.shortDescription}`}
                aria-label={`${b.name} badge — ${b.shortDescription}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelected(b);
                }}
                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] ${tone.pill} hover:opacity-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]`}
              >
                <span aria-hidden>{b.icon}</span>
              </button>
            );
          }
          return (
            <button
              key={`${b.key}-${b.name}`}
              type="button"
              title={b.shortDescription}
              aria-label={`${b.name} badge — ${b.shortDescription}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelected(b);
              }}
              className={`inline-flex items-center gap-1 rounded-full border font-semibold tracking-wide shrink-0 ${text} ${tone.pill} hover:opacity-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]`}
            >
              <span aria-hidden>{b.icon}</span>
              <span>{density === "compact" ? label : b.name}</span>
            </button>
          );
        })}
        {hiddenCount > 0 ? (
          <button
            type="button"
            title="View all trust badges"
            aria-label={`View ${hiddenCount} more trust badges`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAll(true);
            }}
            className={`inline-flex items-center justify-center shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-3)] text-[var(--ink-secondary)] font-semibold hover:bg-[var(--surface-hover)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              density === "icons"
                ? "h-6 min-w-6 px-1 text-[10px]"
                : `${text}`
            }`}
          >
            +{hiddenCount}
          </button>
        ) : null}
      </span>

      {selected && (
        <BadgeDetailModal selected={selected} onClose={() => setSelected(null)} />
      )}
      {showAll && (
        <AllBadgesModal
          badges={allBadges}
          onClose={() => setShowAll(false)}
          onSelect={(b) => {
            setShowAll(false);
            setSelected(b);
          }}
        />
      )}
    </>
  );
}
