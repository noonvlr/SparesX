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
  badges?: PublicBadge[];
  activeBadgeKeys?: string[];
};

export const USER_PUBLIC_TRUST_SELECT =
  "phoneVerified emailVerified kycVerified businessVerified addressVerified isTrusted trustScore activeBadgeKeys specialBadgeKeys role createdAt averageRating ratingCount";

function orderBadgeKeys(keys: BadgeKey[]): BadgeKey[] {
  const set = new Set(keys);
  const ordered: BadgeKey[] = [];

  for (const key of REPUTATION_ORDER) {
    if (set.has(key)) {
      ordered.push(key);
      break;
    }
  }

  for (const key of [
    "mobile_verified",
    "email_verified",
    "kyc_verified",
    "business_verified",
    "address_verified",
  ] as BadgeKey[]) {
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

  return orderBadgeKeys(keys).map((key) => {
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
  });
}

export function pickTrustFields(user: any): PublicTrustInfo {
  if (!user || typeof user !== "object") return {};
  const badges = Array.isArray(user.badges)
    ? user.badges
    : badgesFromUserDoc(user);
  const trustScore =
    typeof user.trustScore === "number"
      ? user.trustScore
      : undefined;
  const band =
    typeof trustScore === "number" ? trustBandFromScore(trustScore) : null;

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
    badges,
    activeBadgeKeys: user.activeBadgeKeys,
  };
}
