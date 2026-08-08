import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { expandNearbyCities, canonicalizeCity } from "@/lib/geo/nearbyCities";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim();
  const nearby =
    searchParams.get("nearby") === "1" ||
    searchParams.get("nearby") === "true";
  const limit = Math.min(
    48,
    Math.max(1, parseInt(searchParams.get("limit") || "24", 10) || 24),
  );

  const filter: Record<string, unknown> = {
    role: "technician",
    isBlocked: false,
  };

  let preferred = "";
  if (city) {
    preferred = canonicalizeCity(city);
    const cities = nearby ? expandNearbyCities(city) : [preferred || city];
    filter.city = {
      $in: cities.map(
        (c) => new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      ),
    };
  }

  const sellers = await User.find(filter)
    .select(
      "name createdAt phoneVerified emailVerified kycVerified businessVerified addressVerified isTrusted trustScore activeBadgeKeys specialBadgeKeys role city state averageRating ratingCount responseRate chatInboundOpportunities",
    )
    .sort({ createdAt: -1 })
    .limit(limit * (preferred ? 2 : 1));

  const { pickTrustFields } = await import("@/lib/trust");
  const { isSameCity } = await import("@/lib/geo/nearbyCities");

  let mapped = sellers.map((s) => ({
    ...s.toObject(),
    ...pickTrustFields(s),
    sameCity: preferred ? isSameCity(preferred, s.city) : undefined,
  }));

  if (preferred) {
    mapped = mapped.sort(
      (a, b) => Number(Boolean(b.sameCity)) - Number(Boolean(a.sameCity)),
    );
  }

  return NextResponse.json(
    {
      sellers: mapped.slice(0, limit),
      city: preferred || null,
      nearby: Boolean(city && nearby),
    },
    { status: 200 },
  );
}
