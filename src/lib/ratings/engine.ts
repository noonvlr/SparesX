import { connectDB } from "@/lib/db/connect";
import { SellerRating } from "@/lib/models/SellerRating";
import { User } from "@/lib/models/User";
import { Conversation } from "@/lib/models/Conversation";
import { Message } from "@/lib/models/Message";
import { Types } from "mongoose";

function toOid(id: string) {
  return new Types.ObjectId(id);
}

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

/**
 * Buyer may rate a seller after a mutual chat (no in-app payments).
 * Prefers product-scoped conversation when productId is provided.
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

  // Find a conversation between the two users
  const filter: Record<string, unknown> = {
    participants: { $all: [toOid(raterId), toOid(sellerId)], $size: 2 },
  };
  if (productId) {
    filter.productId = toOid(productId);
  }

  let conversation = await Conversation.findOne(filter)
    .sort({ updatedAt: -1 })
    .select("_id")
    .lean();

  // Fallback: any conversation with this seller
  if (!conversation && productId) {
    conversation = await Conversation.findOne({
      participants: { $all: [toOid(raterId), toOid(sellerId)], $size: 2 },
    })
      .sort({ updatedAt: -1 })
      .select("_id")
      .lean();
  }

  if (!conversation) {
    return {
      eligible: false,
      reason:
        "Chat with this seller about a listing first, then you can leave a rating.",
      existingRating,
    };
  }

  const conversationId = String(conversation._id);
  const [fromRater, fromSeller] = await Promise.all([
    Message.exists({
      conversationId: conversation._id,
      senderId: toOid(raterId),
    }),
    Message.exists({
      conversationId: conversation._id,
      senderId: toOid(sellerId),
    }),
  ]);

  if (!fromRater || !fromSeller) {
    return {
      eligible: false,
      reason:
        "Both sides need to exchange at least one message before rating.",
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

export function clampStars(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}
