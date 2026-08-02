import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";

export async function GET() {
  await connectDB();
  const sellers = await User.find({ role: "technician", isBlocked: false })
    .select(
      "name createdAt phoneVerified emailVerified kycVerified businessVerified addressVerified isTrusted trustScore activeBadgeKeys specialBadgeKeys role city state averageRating ratingCount",
    )
    .sort({ createdAt: -1 })
    .limit(24);

  const { pickTrustFields } = await import("@/lib/trust");
  return NextResponse.json(
    {
      sellers: sellers.map((s) => ({
        ...s.toObject(),
        ...pickTrustFields(s),
      })),
    },
    { status: 200 },
  );
}
