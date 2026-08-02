import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { findPublicCategories } from "@/lib/categories/publicQuery";

/**
 * GET public part categories (active only).
 *
 * Query:
 * - device / deviceCategory — device type slug; returns that device's
 *   part categories plus global (deviceId null) fallbacks
 * - deviceId — DeviceType ObjectId (same behavior)
 * - omit both — all active categories (global + device-scoped)
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const device =
      searchParams.get("device") || searchParams.get("deviceCategory");
    const deviceId = searchParams.get("deviceId");

    const categories = await findPublicCategories({ device, deviceId });

    return NextResponse.json(
      { categories },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
