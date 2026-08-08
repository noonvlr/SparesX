import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { SellerRating } from "@/lib/models/SellerRating";
import {
  clampStars,
  recomputeSellerRatingStats,
} from "@/lib/ratings/engine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();
    const { id } = await params;

    const ratings = await SellerRating.find({ seller: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("rater", "name email")
      .populate("product", "name")
      .lean();

    return NextResponse.json({
      ratings: ratings.map((r) => ({
        _id: String(r._id),
        stars: r.stars,
        behaviour: r.behaviour,
        response: r.response,
        comment: r.comment,
        isHidden: !!r.isHidden,
        createdAt: r.createdAt,
        rater:
          r.rater && typeof r.rater === "object"
            ? {
                _id: String((r.rater as any)._id),
                name: (r.rater as any).name,
                email: (r.rater as any).email,
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
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to load ratings" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();
    const { id: sellerId } = await params;
    const body = await request.json();
    const ratingId = String(body?.ratingId || "").trim();
    if (!ratingId) {
      return NextResponse.json(
        { message: "ratingId is required" },
        { status: 400 },
      );
    }

    const update: Record<string, unknown> = {};
    if (body.stars !== undefined) {
      const stars = clampStars(body.stars);
      if (!stars) {
        return NextResponse.json({ message: "Invalid stars" }, { status: 400 });
      }
      update.stars = stars;
    }
    if (body.behaviour !== undefined) {
      const behaviour = clampStars(body.behaviour);
      if (!behaviour) {
        return NextResponse.json(
          { message: "Invalid behaviour rating" },
          { status: 400 },
        );
      }
      update.behaviour = behaviour;
    }
    if (body.response !== undefined) {
      const response = clampStars(body.response);
      if (!response) {
        return NextResponse.json(
          { message: "Invalid response rating" },
          { status: 400 },
        );
      }
      update.response = response;
    }
    if (typeof body.comment === "string") {
      update.comment = body.comment.trim().slice(0, 500);
    }
    if (typeof body.isHidden === "boolean") {
      update.isHidden = body.isHidden;
    }

    const rating = await SellerRating.findOneAndUpdate(
      { _id: ratingId, seller: sellerId },
      { $set: update },
      { new: true },
    );
    if (!rating) {
      return NextResponse.json({ message: "Rating not found" }, { status: 404 });
    }

    const stats = await recomputeSellerRatingStats(sellerId);
    return NextResponse.json({
      message: "Rating updated",
      rating,
      ...stats,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to update rating" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();
    const { id: sellerId } = await params;
    const { searchParams } = new URL(request.url);
    const ratingId = searchParams.get("ratingId")?.trim();
    if (!ratingId) {
      return NextResponse.json(
        { message: "ratingId query is required" },
        { status: 400 },
      );
    }

    const result = await SellerRating.deleteOne({
      _id: ratingId,
      seller: sellerId,
    });
    if (!result.deletedCount) {
      return NextResponse.json({ message: "Rating not found" }, { status: 404 });
    }

    const stats = await recomputeSellerRatingStats(sellerId);
    return NextResponse.json({ message: "Rating deleted", ...stats });
  } catch {
    return NextResponse.json(
      { message: "Failed to delete rating" },
      { status: 500 },
    );
  }
}
