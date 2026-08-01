export type BadgeType = "verification" | "reputation" | "special";

export type BadgeKey =
  | "mobile_verified"
  | "email_verified"
  | "kyc_verified"
  | "business_verified"
  | "address_verified"
  | "trusted_seller"
  | "top_seller"
  | "elite_seller"
  | "official_store"
  | "verified_technician"
  | "founding_member"
  | "moderator"
  | "administrator";

export type BadgeDefinition = {
  key: BadgeKey;
  name: string;
  type: BadgeType;
  icon: string;
  /** Tailwind-ish tone for UI */
  color: "blue" | "gold" | "purple";
  shortDescription: string;
  criteria: string;
};

/** Public badge payload safe for client components / APIs */
export type PublicBadge = {
  key: BadgeKey;
  name: string;
  type: BadgeType;
  icon: string;
  color: "blue" | "gold" | "purple";
  shortDescription: string;
  criteria: string;
  awardedAt?: string;
};

/** Launch cutoff for Founding Member (inclusive). */
export const FOUNDING_MEMBER_UNTIL = new Date("2026-12-31T23:59:59.000Z");

export const BADGE_CATALOG: Record<BadgeKey, BadgeDefinition> = {
  mobile_verified: {
    key: "mobile_verified",
    name: "Mobile Verified",
    type: "verification",
    icon: "📱",
    color: "blue",
    shortDescription: "Mobile number verified with OTP",
    criteria: "Complete SMS OTP verification on your account.",
  },
  email_verified: {
    key: "email_verified",
    name: "Email Verified",
    type: "verification",
    icon: "📧",
    color: "blue",
    shortDescription: "Email address verified",
    criteria: "Complete email OTP verification on your account.",
  },
  kyc_verified: {
    key: "kyc_verified",
    name: "KYC Verified",
    type: "verification",
    icon: "🪪",
    color: "blue",
    shortDescription: "Government ID approved by SparesX",
    criteria: "Submit a government-issued ID and get admin approval.",
  },
  business_verified: {
    key: "business_verified",
    name: "Business Verified",
    type: "verification",
    icon: "🏢",
    color: "blue",
    shortDescription: "Business registration verified",
    criteria: "Submit GST / UDYAM / shop license and get admin approval.",
  },
  address_verified: {
    key: "address_verified",
    name: "Address Verified",
    type: "verification",
    icon: "📍",
    color: "blue",
    shortDescription: "Address proof approved",
    criteria: "Submit valid address proof and get admin approval.",
  },
  trusted_seller: {
    key: "trusted_seller",
    name: "Trusted Seller",
    type: "reputation",
    icon: "⭐",
    color: "gold",
    shortDescription: "Strong marketplace reputation",
    criteria:
      "Mobile + Email + KYC verified, 90+ day account, 25+ sales, rating ≥ 4.7, low complaints, high response rate — or granted by admin while metrics ramp up.",
  },
  top_seller: {
    key: "top_seller",
    name: "Top Seller",
    type: "reputation",
    icon: "🏆",
    color: "gold",
    shortDescription: "Outstanding sales performance",
    criteria:
      "Trusted Seller with 250+ sales, rating ≥ 4.8, and consistent activity.",
  },
  elite_seller: {
    key: "elite_seller",
    name: "Elite Seller",
    type: "reputation",
    icon: "👑",
    color: "gold",
    shortDescription: "Highest seller recognition",
    criteria:
      "Top Seller with 1000+ sales, rating ≥ 4.9, 1+ year activity, and admin review.",
  },
  official_store: {
    key: "official_store",
    name: "Official Store",
    type: "special",
    icon: "🏪",
    color: "purple",
    shortDescription: "Official / authorized business",
    criteria: "Manually awarded by SparesX to recognized retailers.",
  },
  verified_technician: {
    key: "verified_technician",
    name: "Verified Technician",
    type: "special",
    icon: "🔧",
    color: "purple",
    shortDescription: "Credentials verified technician",
    criteria: "Manually awarded after professional credential review.",
  },
  founding_member: {
    key: "founding_member",
    name: "Founding Member",
    type: "special",
    icon: "🌟",
    color: "purple",
    shortDescription: "Joined during SparesX launch",
    criteria: "Account created during the founding period.",
  },
  moderator: {
    key: "moderator",
    name: "Moderator",
    type: "special",
    icon: "👨‍💼",
    color: "purple",
    shortDescription: "Platform moderator",
    criteria: "Assigned by SparesX administrators.",
  },
  administrator: {
    key: "administrator",
    name: "Administrator",
    type: "special",
    icon: "🛡️",
    color: "purple",
    shortDescription: "SparesX administrator",
    criteria: "Assigned to platform admin accounts.",
  },
};

export const REPUTATION_ORDER: BadgeKey[] = [
  "elite_seller",
  "top_seller",
  "trusted_seller",
];

export const MANUAL_SPECIAL_KEYS: BadgeKey[] = [
  "official_store",
  "verified_technician",
  "moderator",
];

export type TrustBand =
  | "new"
  | "growing"
  | "trusted"
  | "reliable"
  | "elite";

export function trustBandFromScore(score: number): {
  band: TrustBand;
  label: string;
  color: string;
} {
  if (score >= 81) return { band: "elite", label: "Elite", color: "gold" };
  if (score >= 61) return { band: "reliable", label: "Reliable", color: "green" };
  if (score >= 41) return { band: "trusted", label: "Trusted", color: "yellow" };
  if (score >= 21) return { band: "growing", label: "Growing", color: "orange" };
  return { band: "new", label: "New User", color: "red" };
}
