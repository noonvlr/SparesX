import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { AdPlacement } from "@/lib/models/AdPlacement";
import { serializePlacement } from "@/lib/ads/serialize";
import { seedAdPlacements } from "@/lib/ads/seedPlacements";

/** GET — list all placements (auto-seeds missing defaults once). */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();
    const count = await AdPlacement.countDocuments();
    if (count === 0) {
      await seedAdPlacements({ preserveExisting: true });
    }

    const placements = await AdPlacement.find().sort({ key: 1 }).lean();
    return NextResponse.json({
      placements: placements.map((p) => serializePlacement(p)),
    });
  } catch (error) {
    console.error("[admin/ads/placements GET]", error);
    return NextResponse.json(
      { message: "Failed to load placements" },
      { status: 500 },
    );
  }
}
