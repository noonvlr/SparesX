import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { AdCampaign } from "@/lib/models/AdCampaign";
import { AdPlacement } from "@/lib/models/AdPlacement";
import { AdDailyStat } from "@/lib/models/AdDailyStat";
import { getEffectiveStatus } from "@/lib/ads/effectiveStatus";
import { seedAdPlacements } from "@/lib/ads/seedPlacements";

/**
 * GET — overview counts. Impression/CTR filled from AdDailyStat (zeros until traffic / Phase 7 UI).
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();

    const placementCount = await AdPlacement.countDocuments();
    if (placementCount === 0) {
      await seedAdPlacements({ preserveExisting: true });
    }

    const [campaigns, placements, statAgg] = await Promise.all([
      AdCampaign.find().select("status startDate endDate").lean(),
      AdPlacement.find().select("key enabled").lean(),
      AdDailyStat.aggregate<{
        impressions: number;
        clicks: number;
      }>([
        {
          $group: {
            _id: null,
            impressions: { $sum: "$impressions" },
            clicks: { $sum: "$clicks" },
          },
        },
      ]),
    ]);

    const now = new Date();
    const counts = {
      total: campaigns.length,
      live: 0,
      scheduled: 0,
      paused: 0,
      expired: 0,
      draft: 0,
      archived: 0,
    };

    for (const c of campaigns) {
      const eff = getEffectiveStatus({
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        now,
      });
      counts[eff] += 1;
    }

    const impressions = statAgg[0]?.impressions ?? 0;
    const clicks = statAgg[0]?.clicks ?? 0;
    const ctr =
      impressions > 0
        ? Math.round((clicks / impressions) * 10000) / 100
        : null;

    return NextResponse.json({
      campaigns: counts,
      placements: {
        total: placements.length,
        enabled: placements.filter((p) => p.enabled).length,
      },
      analytics: {
        impressions,
        clicks,
        ctr,
      },
    });
  } catch (error) {
    console.error("[admin/ads/overview GET]", error);
    return NextResponse.json(
      { message: "Failed to load ads overview" },
      { status: 500 },
    );
  }
}
