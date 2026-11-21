import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { seedAdPlacements } from "@/lib/ads/seedPlacements";
import { AdPlacement } from "@/lib/models/AdPlacement";
import { serializePlacement } from "@/lib/ads/serialize";

/**
 * POST — idempotent placement seed (upsert missing keys by default).
 * Body: `{ "force": true }` overwrites seed fields on existing keys.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const body = await req.json().catch(() => ({}));
    const force = Boolean(body?.force);

    await connectDB();
    const result = await seedAdPlacements({ preserveExisting: !force });
    const placements = await AdPlacement.find().sort({ key: 1 }).lean();

    return NextResponse.json({
      message: force
        ? "Placements refreshed from seed"
        : "Missing placements inserted",
      upserted: result.upserted,
      keys: result.keys,
      placements: placements.map((p) => serializePlacement(p)),
    });
  } catch (error) {
    console.error("[admin/ads/placements/seed POST]", error);
    return NextResponse.json(
      { message: "Failed to seed placements" },
      { status: 500 },
    );
  }
}
