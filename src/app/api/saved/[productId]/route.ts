import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";
import { SavedItem } from "@/lib/models/SavedItem";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const auth = requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    await connectDB();
    const { productId } = await params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Invalid productId" },
        { status: 400 },
      );
    }

    const item = await SavedItem.findOne({
      userId: auth.id,
      productId,
    })
      .select("_id")
      .lean();

    return NextResponse.json(
      { saved: !!item, itemId: item ? String(item._id) : null },
      { status: 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const auth = requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    await connectDB();
    const { productId } = await params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Invalid productId" },
        { status: 400 },
      );
    }

    const result = await SavedItem.deleteOne({
      userId: auth.id,
      productId,
    });

    return NextResponse.json(
      {
        message: result.deletedCount ? "Removed from saved" : "Not saved",
        saved: false,
      },
      { status: 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
