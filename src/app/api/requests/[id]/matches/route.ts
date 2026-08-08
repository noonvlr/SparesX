import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { RequestModel } from "@/lib/models/Request";
import { User } from "@/lib/models/User";
import { requireUser, isAuthError } from "@/lib/auth/requireUser";
import { matchListingsForRequest } from "@/lib/requests/matchListings";

/**
 * GET /api/requests/[id]/matches — owner (or admin) sees matching live listings.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    await connectDB();

    const requestDoc = await RequestModel.findById(id).lean();
    if (!requestDoc) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    const isOwner =
      requestDoc.userId && String(requestDoc.userId) === auth.id;
    const isAdmin = auth.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    let city: string | undefined;
    if (requestDoc.userId) {
      const owner = await User.findById(requestDoc.userId)
        .select("city")
        .lean();
      city = owner?.city || undefined;
    }

    const matches = await matchListingsForRequest({
      category: requestDoc.category,
      brand: requestDoc.brand,
      deviceModel: requestDoc.deviceModel,
      deviceCategory: requestDoc.deviceCategory,
      city,
      excludeUserId: requestDoc.userId
        ? String(requestDoc.userId)
        : undefined,
      limit: 10,
    });

    return NextResponse.json({ matches, total: matches.length }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to find matches" },
      { status: 500 },
    );
  }
}
