import { connectDB } from "@/lib/db/connect";
import { SellerRating } from "@/lib/models/SellerRating";
import { User } from "@/lib/models/User";
import { Conversation } from "@/lib/models/Conversation";
import { Message } from "@/lib/models/Message";
import { WhatsAppConnect } from "@/lib/models/WhatsAppConnect";
import { Types } from "mongoose";

function toOid(id: string) {
  return new Types.ObjectId(id);
}

const MIN_MESSAGES_EACH = 2;
const MIN_CONVERSATION_AGE_MS = 60 * 60 * 1000; // 1 hour
const MAX_NEW_RATINGS_PER_DAY = 5;

/** Recompute seller.averageRating + ratingCount from visible ratings. */
export async function recomputeSellerRatingStats(sellerId: string) {
  await connectDB();
  const rows = await SellerRating.find({
    seller: sellerId,
    isHidden: false,
  })
    .select("stars")
    .lean();

  const count = rows.length;
  const averageRating =
    count === 0
      ? 0
      : Math.round(
          (rows.reduce((sum, r) => sum + (r.stars || 0), 0) / count) * 10,
        ) / 10;

  await User.findByIdAndUpdate(sellerId, {
    $set: { averageRating, ratingCount: count },
  });

  try {
    const { recomputeUserBadges } = await import("@/lib/badges/engine");
    await recomputeUserBadges(sellerId);
  } catch {
    // badges optional if engine fails
  }

  return { averageRating, ratingCount: count };
}

export type RatingEligibility = {
  eligible: boolean;
  reason?: string;
  conversationId?: string;
  existingRating?: {
    _id: string;
    stars: number;
    behaviour: number;
    response: number;
    comment?: string;
  } | null;
};

async function hasApprovedWhatsApp(raterId: string, sellerId: string) {
  const row = await WhatsAppConnect.findOne({
    status: "approved",
    $or: [
      { requester: toOid(raterId), seller: toOid(sellerId) },
      { requester: toOid(sellerId), seller: toOid(raterId) },
    ],
  })
    .select("_id")
    .lean();
  return Boolean(row);
}

/**
 * Buyer may rate a seller after a meaningful interaction (no in-app payments).
 * Requires phone-verified rater plus either:
 * - approved WhatsApp Connect, or
 * - mutual chat with 2+ messages each and conversation ≥ 1 hour old.
 */
export async function checkRatingEligibility(params: {
  raterId: string;
  sellerId: string;
  productId?: string;
}): Promise<RatingEligibility> {
  const { raterId, sellerId, productId } = params;

  if (String(raterId) === String(sellerId)) {
    return { eligible: false, reason: "You cannot rate yourself" };
  }

  await connectDB();

  const rater = await User.findById(raterId)
    .select("phoneVerified isBlocked")
    .lean();
  if (!rater || rater.isBlocked) {
    return { eligible: false, reason: "Account not eligible to rate" };
  }
  if (!rater.phoneVerified) {
    return {
      eligible: false,
      reason: "Verify your phone number before rating sellers.",
    };
  }

  const existing = await SellerRating.findOne({
    rater: raterId,
    seller: sellerId,
  }).lean();

  const existingRating = existing
    ? {
        _id: String(existing._id),
        stars: existing.stars,
        behaviour: existing.behaviour,
        response: existing.response,
        comment: existing.comment,
      }
    : null;

  // Updating an existing rating still needs the interaction gate below
  const filter: Record<string, unknown> = {
    participants: { $all: [toOid(raterId), toOid(sellerId)], $size: 2 },
  };
  if (productId) {
    filter.productId = toOid(productId);
  }

  let conversation = await Conversation.findOne(filter)
    .sort({ updatedAt: -1 })
    .select("_id createdAt")
    .lean();

  if (!conversation && productId) {
    conversation = await Conversation.findOne({
      participants: { $all: [toOid(raterId), toOid(sellerId)], $size: 2 },
    })
      .sort({ updatedAt: -1 })
      .select("_id createdAt")
      .lean();
  }

  const waApproved = await hasApprovedWhatsApp(raterId, sellerId);

  if (!conversation && !waApproved) {
    return {
      eligible: false,
      reason:
        "Chat with this seller or unlock WhatsApp first, then you can leave a rating.",
      existingRating,
    };
  }

  const conversationId = conversation ? String(conversation._id) : undefined;

  if (waApproved) {
    return {
      eligible: true,
      conversationId,
      existingRating,
    };
  }

  // Deep chat path
  const [fromRater, fromSeller] = await Promise.all([
    Message.countDocuments({
      conversationId: conversation!._id,
      senderId: toOid(raterId),
    }),
    Message.countDocuments({
      conversationId: conversation!._id,
      senderId: toOid(sellerId),
    }),
  ]);

  if (fromRater < MIN_MESSAGES_EACH || fromSeller < MIN_MESSAGES_EACH) {
    return {
      eligible: false,
      reason: `Exchange at least ${MIN_MESSAGES_EACH} messages each way before rating (or unlock WhatsApp).`,
      conversationId,
      existingRating,
    };
  }

  const createdAt = conversation!.createdAt
    ? new Date(conversation!.createdAt).getTime()
    : 0;
  if (!createdAt || Date.now() - createdAt < MIN_CONVERSATION_AGE_MS) {
    return {
      eligible: false,
      reason:
        "Wait at least an hour after starting the chat before rating (or unlock WhatsApp).",
      conversationId,
      existingRating,
    };
  }

  return {
    eligible: true,
    conversationId,
    existingRating,
  };
}

/** Cap brand-new rating inserts per rater per rolling day (updates exempt). */
export async function checkNewRatingDailyCap(raterId: string): Promise<{
  ok: boolean;
  reason?: string;
}> {
  await connectDB();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await SellerRating.countDocuments({
    rater: raterId,
    createdAt: { $gte: since },
  });
  if (count >= MAX_NEW_RATINGS_PER_DAY) {
    return {
      ok: false,
      reason: `You can submit up to ${MAX_NEW_RATINGS_PER_DAY} new ratings per day.`,
    };
  }
  return { ok: true };
}

export function clampStars(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}
