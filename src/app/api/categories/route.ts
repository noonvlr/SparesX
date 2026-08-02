import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { findPublicCategories } from "@/lib/categories/publicQuery";

/**
 * GET public part categories (active only), deduped by display name.
 *
 * Query:
 * - device / deviceCategory — device type slug
 * - deviceId — DeviceType ObjectId
 * - dedupe=false — return raw rows including duplicates (admin/debug)
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const device =
      searchParams.get("device") || searchParams.get("deviceCategory");
    const deviceId = searchParams.get("deviceId");
    const dedupeByName = searchParams.get("dedupe") !== "false";

    const categories = await findPublicCategories({
      device,
      deviceId,
      dedupeByName,
    });

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
