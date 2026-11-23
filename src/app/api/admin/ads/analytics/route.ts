import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { queryPromoAnalytics } from "@/lib/ads/analyticsQuery";
import { AdCampaign } from "@/lib/models/AdCampaign";
import { AdPlacement } from "@/lib/models/AdPlacement";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const data = await queryPromoAnalytics({
      fromIst: searchParams.get("from") || undefined,
      toIst: searchParams.get("to") || undefined,
      campaignId: searchParams.get("campaignId") || undefined,
      placementKey: searchParams.get("placement") || undefined,
      device: (searchParams.get("device") || "") as "" | "desktop" | "mobile",
    });

    const [campaignOptions, placementOptions] = await Promise.all([
      AdCampaign.find()
        .select("name")
        .sort({ updatedAt: -1 })
        .limit(200)
        .lean(),
      AdPlacement.find().select("key name").sort({ key: 1 }).lean(),
    ]);

    return NextResponse.json({
      ...data,
      filters: {
        campaigns: campaignOptions.map((c) => ({
          id: String(c._id),
          name: c.name,
        })),
        placements: placementOptions.map((p) => ({
          key: p.key,
          name: p.name,
        })),
      },
    });
  } catch (error) {
    console.error("[admin/ads/analytics GET]", error);
    return NextResponse.json(
      { message: "Failed to load analytics" },
      { status: 500 },
    );
  }
}
