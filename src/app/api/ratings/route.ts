import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";
import { SellerRating } from "@/lib/models/SellerRating";
import { User } from "@/lib/models/User";
import {
  checkRatingEligibility,
  clampStars,
  recomputeSellerRatingStats,
} from "@/lib/ratings/engine";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get("sellerId")?.trim();
    const eligibility = searchParams.get("eligibility") === "1";
    const productId = searchParams.get("productId")?.trim() || undefined;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10)));

    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      return NextResponse.json(
        { message: "Valid sellerId is required" },
        { status: 400 },
      );
    }

    if (eligibility) {
      const auth = await requireUser(req);
      if (isAuthError(auth)) return auth;
      const result = await checkRatingEligibility({
        raterId: auth.id,
        sellerId,
        productId,
      });
      return NextResponse.json(result, { status: 200 });
    }

    const seller = await User.findById(sellerId)
      .select("averageRating ratingCount name")
      .lean();
    if (!seller) {
      return NextResponse.json({ message: "Seller not found" }, { status: 404 });
    }

    const filter = { seller: sellerId, isHidden: false };
    const [total, ratings] = await Promise.all([
      SellerRating.countDocuments(filter),
      SellerRating.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("rater", "name profilePicture city")
        .populate("product", "name")
        .lean(),
    ]);

    return NextResponse.json(
      {
        sellerId,
        averageRating: seller.averageRating || 0,
        ratingCount: seller.ratingCount || total,
        page,
        pages: Math.ceil(total / limit) || 1,
        total,
        ratings: ratings.map((r) => ({
          _id: String(r._id),
          stars: r.stars,
          behaviour: r.behaviour,
          response: r.response,
          comment: r.comment,
          createdAt: r.createdAt,
          rater:
            r.rater && typeof r.rater === "object"
              ? {
                  _id: String((r.rater as any)._id),
                  name: (r.rater as any).name,
                  profilePicture: (r.rater as any).profilePicture,
                  city: (r.rater as any).city,
                }
              : null,
          product:
            r.product && typeof r.product === "object"
              ? {
                  _id: String((r.product as any)._id),
                  name: (r.product as any).name,
                }
              : null,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    await connectDB();
    const body = await req.json();
    const sellerId = String(body?.sellerId || "").trim();
    const productId = body?.productId
      ? String(body.productId).trim()
      : undefined;
    const comment =
      typeof body?.comment === "string" ? body.comment.trim().slice(0, 500) : "";

    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      return NextResponse.json(
        { message: "Valid sellerId is required" },
        { status: 400 },
      );
    }

    const stars = clampStars(body?.stars);
    const behaviour = clampStars(body?.behaviour ?? body?.stars);
    const response = clampStars(body?.response ?? body?.stars);
    if (!stars || !behaviour || !response) {
      return NextResponse.json(
        { message: "Ratings must be integers from 1 to 5" },
        { status: 400 },
      );
    }

    const eligibility = await checkRatingEligibility({
      raterId: auth.id,
      sellerId,
      productId,
    });
    if (!eligibility.eligible) {
      return NextResponse.json(
        { message: eligibility.reason || "Not eligible to rate" },
        { status: 403 },
      );
    }

    const rating = await SellerRating.findOneAndUpdate(
      { rater: auth.id, seller: sellerId },
      {
        $set: {
          stars,
          behaviour,
          response,
          comment: comment || undefined,
          product: productId || undefined,
          conversation: eligibility.conversationId || undefined,
          isHidden: false,
        },
        $setOnInsert: {
          rater: auth.id,
          seller: sellerId,
        },
      },
      { upsert: true, new: true },
    );

    const stats = await recomputeSellerRatingStats(sellerId);

    return NextResponse.json(
      {
        message: eligibility.existingRating
          ? "Rating updated"
          : "Rating submitted",
        rating: {
          _id: String(rating._id),
          stars: rating.stars,
          behaviour: rating.behaviour,
          response: rating.response,
          comment: rating.comment,
        },
        ...stats,
      },
      { status: eligibility.existingRating ? 200 : 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
