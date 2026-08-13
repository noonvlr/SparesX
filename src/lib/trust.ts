import {
  BADGE_CATALOG,
  FOUNDING_MEMBER_UNTIL,
  REPUTATION_ORDER,
  trustBandFromScore,
  type BadgeKey,
  type PublicBadge,
} from "@/lib/badges/catalog";

/**
 * Shared trust / verification fields exposed publicly for sellers.
 */
export type PublicTrustInfo = {
  phoneVerified?: boolean;
  emailVerified?: boolean;
  kycVerified?: boolean;
  businessVerified?: boolean;
  addressVerified?: boolean;
  /** Admin-granted trusted seller badge */
  isTrusted?: boolean;
  trustScore?: number;
  trustLabel?: string;
  averageRating?: number;
  ratingCount?: number;
  /**
   * Closed-loop chat reply rate (0–100). Only meaningful when
   * responseSampleSize >= 3 — clients should hide otherwise.
   */
  responseRate?: number;
  responseSampleSize?: number;
  badges?: PublicBadge[];
  activeBadgeKeys?: string[];
};

/** How densely badges render in UI. */
export type BadgeDensity = "icons" | "compact" | "full";

export const USER_PUBLIC_TRUST_SELECT =
  "phoneVerified emailVerified kycVerified businessVerified addressVerified isTrusted trustScore activeBadgeKeys specialBadgeKeys role createdAt averageRating ratingCount responseRate chatInboundOpportunities";

const VERIFICATION_KEYS: BadgeKey[] = [
  "mobile_verified",
  "email_verified",
  "kyc_verified",
  "business_verified",
  "address_verified",
];

/** Specials worth showing in dense UI (not founding_member). */
const DENSE_SPECIAL_KEYS: BadgeKey[] = [
  "official_store",
  "verified_technician",
  "moderator",
  "administrator",
];

function orderBadgeKeys(keys: BadgeKey[]): BadgeKey[] {
  const set = new Set(keys);
  const ordered: BadgeKey[] = [];

  for (const key of REPUTATION_ORDER) {
    if (set.has(key)) {
      ordered.push(key);
      break;
    }
  }

  for (const key of VERIFICATION_KEYS) {
    if (set.has(key)) ordered.push(key);
  }

  for (const key of [
    "official_store",
    "verified_technician",
    "founding_member",
    "moderator",
    "administrator",
  ] as BadgeKey[]) {
    if (set.has(key) && !ordered.includes(key)) ordered.push(key);
  }

  return ordered;
}

function toPublicBadge(key: BadgeKey): PublicBadge {
  const def = BADGE_CATALOG[key];
  return {
    key,
    name: def.name,
    type: def.type,
    icon: def.icon,
    color: def.color,
    shortDescription: def.shortDescription,
    criteria: def.criteria,
  };
}

/**
 * Collapse Mobile/Email/KYC/Business/Address into one signal for dense UI.
 * Strongest wins: Business → ID (KYC) → Verified (phone/email/address).
 */
function verificationSummary(
  byKey: Map<BadgeKey, PublicBadge>,
): PublicBadge | null {
  if (byKey.has("business_verified")) {
    const base = byKey.get("business_verified")!;
    return { ...base, name: "Business Verified" };
  }
  if (byKey.has("kyc_verified")) {
    const base = byKey.get("kyc_verified")!;
    return { ...base, name: "ID Verified" };
  }
  if (
    byKey.has("mobile_verified") ||
    byKey.has("email_verified") ||
    byKey.has("address_verified")
  ) {
    const parts: string[] = [];
    if (byKey.has("mobile_verified")) parts.push("mobile");
    if (byKey.has("email_verified")) parts.push("email");
    if (byKey.has("address_verified")) parts.push("address");
    return {
      key: "mobile_verified",
      name: "Verified",
      type: "verification",
      icon: "✓",
      color: "blue",
      shortDescription: `Account verified (${parts.join(", ")})`,
      criteria:
        "Complete phone and/or email verification. Stronger levels unlock ID and Business Verified badges.",
    };
  }
  return null;
}

/**
 * Reduce badge clutter for list/card surfaces.
 * - full: everything, ordered
 * - compact / icons: top reputation + one verification summary + rare specials (max 3)
 */
export function selectBadgesForDensity(
  badges: PublicBadge[],
  density: BadgeDensity,
): PublicBadge[] {
  if (!badges.length) return [];
  if (density === "full") return badges;

  const byKey = new Map<BadgeKey, PublicBadge>();
  for (const b of badges) byKey.set(b.key, b);

  const selected: PublicBadge[] = [];

  for (const key of REPUTATION_ORDER) {
    const hit = byKey.get(key);
    if (hit) {
      selected.push(hit);
      break;
    }
  }

  const verification = verificationSummary(byKey);
  if (verification) selected.push(verification);

  for (const key of DENSE_SPECIAL_KEYS) {
    const hit = byKey.get(key);
    if (hit) selected.push(hit);
  }

  return selected.slice(0, 3);
}

/** Short label for compact pills (icons mode shows icon only). */
export function badgeShortLabel(badge: PublicBadge): string {
  switch (badge.key) {
    case "elite_seller":
      return "Elite";
    case "top_seller":
      return "Top";
    case "trusted_seller":
      return "Trusted";
    case "business_verified":
      return "Business";
    case "kyc_verified":
      return badge.name === "ID Verified" ? "ID" : "KYC";
    case "mobile_verified":
      return badge.name === "Verified" ? "Verified" : "Mobile";
    case "email_verified":
      return "Email";
    case "address_verified":
      return "Address";
    case "official_store":
      return "Official";
    case "verified_technician":
      return "Technician";
    case "founding_member":
      return "Founding";
    case "moderator":
      return "Mod";
    case "administrator":
      return "Admin";
    default:
      return badge.name.split(" ")[0];
  }
}

/** Build display badges from user document snapshot (no DB query). */
export function badgesFromUserDoc(user: any): PublicBadge[] {
  if (!user || typeof user !== "object") return [];

  let keys: BadgeKey[] = [];
  if (Array.isArray(user.activeBadgeKeys) && user.activeBadgeKeys.length) {
    keys = user.activeBadgeKeys.filter(
      (k: string): k is BadgeKey => k in BADGE_CATALOG,
    );
  } else {
    // Fallback derive when snapshot not yet computed
    if (user.phoneVerified) keys.push("mobile_verified");
    if (user.emailVerified) keys.push("email_verified");
    if (user.kycVerified) keys.push("kyc_verified");
    if (user.businessVerified) keys.push("business_verified");
    if (user.addressVerified) keys.push("address_verified");
    if (user.isTrusted) keys.push("trusted_seller");
    if (user.role === "admin") keys.push("administrator");
    const revoked = new Set(
      Array.isArray(user.revokedBadgeKeys) ? user.revokedBadgeKeys : [],
    );
    const specials = new Set(
      Array.isArray(user.specialBadgeKeys) ? user.specialBadgeKeys : [],
    );
    if (Array.isArray(user.specialBadgeKeys)) {
      for (const k of user.specialBadgeKeys) {
        if (k in BADGE_CATALOG && k !== "founding_member") {
          keys.push(k as BadgeKey);
        }
      }
    }
    const foundingEligible =
      user.createdAt && new Date(user.createdAt) <= FOUNDING_MEMBER_UNTIL;
    if (
      !revoked.has("founding_member") &&
      (specials.has("founding_member") || foundingEligible)
    ) {
      keys.push("founding_member");
    }
  }

  return orderBadgeKeys(keys).map(toPublicBadge);
}

export function pickTrustFields(user: any): PublicTrustInfo {
  if (!user || typeof user !== "object") return {};
  const badges = Array.isArray(user.badges)
    ? user.badges
    : badgesFromUserDoc(user);
  const trustScore =
    typeof user.trustScore === "number" ? user.trustScore : undefined;
  const band =
    typeof trustScore === "number" ? trustBandFromScore(trustScore) : null;

  const responseSampleSize =
    typeof user.chatInboundOpportunities === "number"
      ? user.chatInboundOpportunities
      : typeof user.responseSampleSize === "number"
        ? user.responseSampleSize
        : 0;

  return {
    phoneVerified: !!user.phoneVerified,
    emailVerified: !!user.emailVerified,
    kycVerified: !!user.kycVerified,
    businessVerified: !!user.businessVerified,
    addressVerified: !!user.addressVerified,
    isTrusted: !!user.isTrusted,
    trustScore,
    trustLabel: band?.label || user.trustLabel,
    averageRating:
      typeof user.averageRating === "number" ? user.averageRating : undefined,
    ratingCount:
      typeof user.ratingCount === "number" ? user.ratingCount : undefined,
    responseRate:
      typeof user.responseRate === "number" ? user.responseRate : undefined,
    responseSampleSize,
    badges,
    activeBadgeKeys: user.activeBadgeKeys,
  };
}
