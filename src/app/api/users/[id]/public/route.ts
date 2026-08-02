import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";
import { pickTrustFields } from "@/lib/trust";
import { verifyJwt } from "@/lib/auth/jwt";

/**
 * Public profile — never returns contact/PII fields
 * (email, mobile, whatsapp, address, pinCode, OTPs).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
    }

    const user = await User.findById(id)
      .select(
        "name profilePicture city state role isBlocked createdAt about phoneVerified emailVerified kycVerified businessVerified addressVerified isTrusted trustScore activeBadgeKeys specialBadgeKeys averageRating ratingCount",
      )
      .lean();

    if (!user || user.isBlocked) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    let viewerId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyJwt(authHeader.split(" ")[1]);
      if (payload?.id) viewerId = payload.id;
    }

    const trust = pickTrustFields(user);

    const listings = await Product.find({
      technician: id,
      status: "approved",
    })
      .select(
        "name price images brand partType category deviceCategory condition priceNegotiable createdAt",
      )
      .sort({ createdAt: -1 })
      .limit(24)
      .lean();

    return NextResponse.json(
      {
        profile: {
          _id: String(user._id),
          name: user.name,
          profilePicture: user.profilePicture || null,
          city: user.city || null,
          state: user.state || null,
          about: (user as { about?: string }).about || "",
          role: user.role,
          createdAt: user.createdAt,
          ...trust,
        },
        listings: listings.map((p) => ({
          _id: String(p._id),
          name: p.name,
          price: p.price,
          images: p.images || [],
          brand: p.brand,
          partType: p.partType,
          category: p.category,
          deviceCategory: p.deviceCategory,
          condition: p.condition,
          priceNegotiable: p.priceNegotiable,
        })),
        meta: {
          isOwnProfile: viewerId === String(user._id),
          listingCount: listings.length,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to load profile" },
      { status: 500 },
    );
  }
}
