import { connectDB } from "@/lib/db/connect";
import { User, type IUser } from "@/lib/models/User";
import { UserBadge } from "@/lib/models/UserBadge";
import {
  BADGE_CATALOG,
  FOUNDING_MEMBER_UNTIL,
  MANUAL_SPECIAL_KEYS,
  REPUTATION_ORDER,
  trustBandFromScore,
  type BadgeKey,
  type PublicBadge,
} from "@/lib/badges/catalog";

export type { PublicBadge };

export type TrustProfile = {
  phoneVerified: boolean;
  emailVerified: boolean;
  kycVerified: boolean;
  businessVerified: boolean;
  addressVerified: boolean;
  isTrusted: boolean;
  trustScore: number;
  trustLabel: string;
  trustBand: string;
  badges: PublicBadge[];
};

/** Match public UI: response rate only counts with sample size ≥ 3. */
const RESPONSE_RATE_MIN_SAMPLE = 3;

function daysSince(date?: Date | string | null) {
  if (!date) return 0;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
}

function scoredResponseRate(user: {
  responseRate?: number;
  chatInboundOpportunities?: number;
}): number {
  const sample = user.chatInboundOpportunities ?? 0;
  if (sample < RESPONSE_RATE_MIN_SAMPLE) return 0;
  return user.responseRate ?? 0;
}

export function computeTrustScore(user: IUser): number {
  let score = 0;
  if (user.phoneVerified) score += 10;
  if (user.emailVerified) score += 5;
  if (user.kycVerified) score += 20;
  if (user.businessVerified) score += 10;
  if (user.addressVerified) score += 5;

  const ageDays = daysSince(user.createdAt);
  if (ageDays >= 365) score += 10;
  else if (ageDays >= 90) score += 7;
  else if (ageDays >= 30) score += 4;
  else if (ageDays >= 7) score += 2;

  const sales = user.completedSales || 0;
  if (sales >= 250) score += 15;
  else if (sales >= 25) score += 10;
  else if (sales >= 5) score += 5;
  else if (sales >= 1) score += 2;

  const rating = user.averageRating || 0;
  if (rating >= 4.9) score += 15;
  else if (rating >= 4.7) score += 12;
  else if (rating >= 4.0) score += 8;
  else if (rating >= 3.0) score += 3;

  const responseRate = scoredResponseRate(user);
  if (responseRate >= 90) score += 5;
  else if (responseRate >= 70) score += 3;

  const complaintRate = user.complaintRate ?? 0;
  if (sales > 0 && complaintRate < 2) score += 5;
  else if (sales > 0 && complaintRate < 5) score += 2;

  if (user.isTrusted) score += 5;
  if ((user.specialBadgeKeys || []).includes("verified_technician")) score += 3;
  if ((user.specialBadgeKeys || []).includes("official_store")) score += 2;

  const thanksPts = Math.max(0, Math.round(user.bugThanksPoints || 0));
  if (thanksPts > 0) score += thanksPts;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export type TrustScoreFactor = {
  label: string;
  points: number;
  active: boolean;
};

/** Human-readable breakdown of how trust score is built (public-safe). */
export function explainTrustScore(user: {
  phoneVerified?: boolean;
  emailVerified?: boolean;
  kycVerified?: boolean;
  businessVerified?: boolean;
  addressVerified?: boolean;
  isTrusted?: boolean;
  createdAt?: Date | string | null;
  completedSales?: number;
  averageRating?: number;
  responseRate?: number;
  chatInboundOpportunities?: number;
  complaintRate?: number;
  specialBadgeKeys?: string[];
  bugThanksPoints?: number;
}): { score: number; factors: TrustScoreFactor[]; summary: string } {
  const factors: TrustScoreFactor[] = [];
  const push = (label: string, points: number, active: boolean) => {
    factors.push({ label, points, active });
  };

  push("Phone verified", 10, !!user.phoneVerified);
  push("Email verified", 5, !!user.emailVerified);
  push("KYC verified", 20, !!user.kycVerified);
  push("Business verified", 10, !!user.businessVerified);
  push("Address verified", 5, !!user.addressVerified);

  const ageDays = daysSince(user.createdAt);
  let agePts = 0;
  if (ageDays >= 365) agePts = 10;
  else if (ageDays >= 90) agePts = 7;
  else if (ageDays >= 30) agePts = 4;
  else if (ageDays >= 7) agePts = 2;
  push("Account age", agePts, agePts > 0);

  const sales = user.completedSales || 0;
  let salesPts = 0;
  if (sales >= 250) salesPts = 15;
  else if (sales >= 25) salesPts = 10;
  else if (sales >= 5) salesPts = 5;
  else if (sales >= 1) salesPts = 2;
  push("Completed sales", salesPts, salesPts > 0);

  const rating = user.averageRating || 0;
  let ratingPts = 0;
  if (rating >= 4.9) ratingPts = 15;
  else if (rating >= 4.7) ratingPts = 12;
  else if (rating >= 4.0) ratingPts = 8;
  else if (rating >= 3.0) ratingPts = 3;
  push("Buyer ratings", ratingPts, ratingPts > 0);

  const responseRate = scoredResponseRate(user);
  let respPts = 0;
  if (responseRate >= 90) respPts = 5;
  else if (responseRate >= 70) respPts = 3;
  push("Response rate", respPts, respPts > 0);

  const complaintRate = user.complaintRate ?? 0;
  let complaintPts = 0;
  if (sales > 0 && complaintRate < 2) complaintPts = 5;
  else if (sales > 0 && complaintRate < 5) complaintPts = 2;
  push("Low complaint rate", complaintPts, complaintPts > 0);

  push("Trusted seller flag", 5, !!user.isTrusted);
  push(
    "Verified technician badge",
    3,
    (user.specialBadgeKeys || []).includes("verified_technician"),
  );
  push(
    "Official store badge",
    2,
    (user.specialBadgeKeys || []).includes("official_store"),
  );

  const thanksPts = Math.max(0, Math.round(user.bugThanksPoints || 0));
  push("Bug report thanks", thanksPts, thanksPts > 0);

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(factors.reduce((sum, f) => sum + (f.active ? f.points : 0), 0)),
    ),
  );

  const band = trustBandFromScore(score);
  const earned = factors.filter((f) => f.active).map((f) => f.label);
  const summary =
    earned.length > 0
      ? `${band.label} score (${score}/100) based on: ${earned.slice(0, 4).join(", ")}${
          earned.length > 4 ? "…" : ""
        }.`
      : `${band.label} score (${score}/100). Verify phone and email to start building trust.`;

  return { score, factors, summary };
}

function qualifiesTrustedAuto(user: IUser) {
  const ageDays = daysSince(user.createdAt);
  const sales = user.completedSales || 0;
  const rating = user.averageRating || 0;
  const responseRate = scoredResponseRate(user);
  const complaintRate = user.complaintRate ?? 100;
  const lastActiveDays = daysSince(user.lastSeen || user.updatedAt);

  return (
    user.phoneVerified &&
    user.emailVerified &&
    user.kycVerified &&
    ageDays >= 90 &&
    sales >= 25 &&
    rating >= 4.7 &&
    complaintRate < 2 &&
    responseRate >= 90 &&
    !user.isBlocked &&
    lastActiveDays <= 30
  );
}

function qualifiesTopSeller(user: IUser) {
  const sales = user.completedSales || 0;
  const rating = user.averageRating || 0;
  return sales >= 250 && rating >= 4.8;
}

function qualifiesEliteSeller(user: IUser) {
  const sales = user.completedSales || 0;
  const rating = user.averageRating || 0;
  const ageDays = daysSince(user.createdAt);
  return sales >= 1000 && rating >= 4.9 && ageDays >= 365 && !!user.eliteApproved;
}

async function upsertBadge(
  userId: string,
  badgeKey: BadgeKey,
  source: "auto" | "admin" | "system",
  awardedBy?: string,
) {
  const def = BADGE_CATALOG[badgeKey];
  await UserBadge.findOneAndUpdate(
    { userId, badgeKey },
    {
      $set: {
        isActive: true,
        badgeType: def.type,
        source,
        awardedBy: awardedBy || "system",
      },
      $setOnInsert: {
        awardedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );
}

async function deactivateBadge(userId: string, badgeKey: BadgeKey) {
  await UserBadge.updateOne(
    { userId, badgeKey },
    { $set: { isActive: false } },
  );
}

/**
 * Recompute verification / reputation / system special badges for a user.
 * Manual special badges (official store, etc.) are preserved unless revoked.
 */
export async function recomputeUserBadges(userId: string) {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) return null;

  // Verification auto badges
  const verificationMap: [boolean, BadgeKey][] = [
    [!!user.phoneVerified, "mobile_verified"],
    [!!user.emailVerified, "email_verified"],
    [!!user.kycVerified, "kyc_verified"],
    [!!user.businessVerified, "business_verified"],
    [!!user.addressVerified, "address_verified"],
  ];
  for (const [ok, key] of verificationMap) {
    if (ok) await upsertBadge(userId, key, "auto");
    else await deactivateBadge(userId, key);
  }

  // Reputation (only highest shown later; store all that qualify)
  const trusted =
    !!user.isTrusted || qualifiesTrustedAuto(user);
  const top = trusted && qualifiesTopSeller(user);
  const elite = top && qualifiesEliteSeller(user);

  if (elite) await upsertBadge(userId, "elite_seller", user.eliteApproved ? "admin" : "auto");
  else await deactivateBadge(userId, "elite_seller");

  if (top) await upsertBadge(userId, "top_seller", "auto");
  else await deactivateBadge(userId, "top_seller");

  if (trusted) await upsertBadge(userId, "trusted_seller", user.isTrusted ? "admin" : "auto");
  else await deactivateBadge(userId, "trusted_seller");

  // System specials — Founding Member is auto for launch-period accounts,
  // unless admin revoked it; admin can also grant it manually after the cutoff.
  const revoked = new Set(user.revokedBadgeKeys || []);
  const specials = new Set(user.specialBadgeKeys || []);
  const foundingEligible =
    !!user.createdAt && user.createdAt <= FOUNDING_MEMBER_UNTIL;
  const foundingGranted =
    !revoked.has("founding_member") &&
    (specials.has("founding_member") || foundingEligible);

  if (foundingGranted) {
    await upsertBadge(
      userId,
      "founding_member",
      specials.has("founding_member") ? "admin" : "system",
    );
  } else {
    await deactivateBadge(userId, "founding_member");
  }

  if (user.role === "admin") {
    await upsertBadge(userId, "administrator", "system");
  } else {
    await deactivateBadge(userId, "administrator");
  }

  // Preserve / sync admin special keys (excluding founding_member — handled above)
  for (const key of MANUAL_SPECIAL_KEYS) {
    if (specials.has(key)) await upsertBadge(userId, key, "admin");
    else await deactivateBadge(userId, key);
  }

  const trustScore = computeTrustScore(user);
  const profile = await getTrustProfileForUser(userId);
  user.trustScore = trustScore;
  user.activeBadgeKeys = profile?.badges.map((b) => b.key) || [];
  await user.save();

  if (profile) {
    profile.trustScore = trustScore;
    const band = trustBandFromScore(trustScore);
    profile.trustLabel = band.label;
    profile.trustBand = band.band;
  }
  return profile;
}

export async function getTrustProfileForUser(
  userId: string,
): Promise<TrustProfile | null> {
  await connectDB();
  const user = await User.findById(userId).select(
    "phoneVerified emailVerified kycVerified businessVerified addressVerified isTrusted trustScore role createdAt",
  );
  if (!user) return null;

  const rows = await UserBadge.find({ userId, isActive: true }).lean();
  const byKey = new Map(rows.map((r) => [r.badgeKey as BadgeKey, r]));

  // Highest reputation only
  let reputation: BadgeKey | null = null;
  for (const key of REPUTATION_ORDER) {
    if (byKey.has(key)) {
      reputation = key;
      break;
    }
  }

  const orderedKeys: BadgeKey[] = [];
  if (reputation) orderedKeys.push(reputation);

  const verificationOrder: BadgeKey[] = [
    "mobile_verified",
    "email_verified",
    "kyc_verified",
    "business_verified",
    "address_verified",
  ];
  for (const key of verificationOrder) {
    if (byKey.has(key)) orderedKeys.push(key);
  }

  const specialOrder: BadgeKey[] = [
    "official_store",
    "verified_technician",
    "founding_member",
    "moderator",
    "administrator",
  ];
  for (const key of specialOrder) {
    if (byKey.has(key) && !orderedKeys.includes(key)) orderedKeys.push(key);
  }

  const badges: PublicBadge[] = orderedKeys.map((key) => {
    const def = BADGE_CATALOG[key];
    const row = byKey.get(key);
    return {
      key,
      name: def.name,
      type: def.type,
      icon: def.icon,
      color: def.color,
      shortDescription: def.shortDescription,
      criteria: def.criteria,
      awardedAt: row?.awardedAt
        ? new Date(row.awardedAt).toISOString()
        : undefined,
    };
  });

  const score = user.trustScore ?? computeTrustScore(user as IUser);
  const band = trustBandFromScore(score);

  return {
    phoneVerified: !!user.phoneVerified,
    emailVerified: !!user.emailVerified,
    kycVerified: !!user.kycVerified,
    businessVerified: !!user.businessVerified,
    addressVerified: !!user.addressVerified,
    isTrusted: !!user.isTrusted,
    trustScore: score,
    trustLabel: band.label,
    trustBand: band.band,
    badges,
  };
}

/** Compact fields safe to embed on seller objects in product/chat APIs. */
export async function getPublicTrustFields(userId: string) {
  const profile = await getTrustProfileForUser(userId);
  if (!profile) {
    return {
      phoneVerified: false,
      emailVerified: false,
      isTrusted: false,
      trustScore: 0,
      trustLabel: "New User",
      badges: [] as PublicBadge[],
    };
  }
  return {
    phoneVerified: profile.phoneVerified,
    emailVerified: profile.emailVerified,
    kycVerified: profile.kycVerified,
    businessVerified: profile.businessVerified,
    addressVerified: profile.addressVerified,
    isTrusted: profile.isTrusted,
    trustScore: profile.trustScore,
    trustLabel: profile.trustLabel,
    badges: profile.badges,
  };
}
