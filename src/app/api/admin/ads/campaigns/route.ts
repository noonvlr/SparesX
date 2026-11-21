import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import {
  AdCampaign,
  isAdCampaignStatus,
} from "@/lib/models/AdCampaign";
import { serializeCampaign } from "@/lib/ads/serialize";

/**
 * GET — paginated campaign list (skeleton; full filters in Phase 3).
 * Query: page, limit, status, placement, q
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20),
    );
    const status = searchParams.get("status");
    const placement = searchParams.get("placement");
    const q = (searchParams.get("q") || "").trim();

    const filter: Record<string, unknown> = {};
    if (status && isAdCampaignStatus(status)) {
      filter.status = status;
    }
    if (placement) {
      filter["creatives.placementKey"] = placement;
    }
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { advertiserName: { $regex: escaped, $options: "i" } },
      ];
    }

    const [total, docs] = await Promise.all([
      AdCampaign.countDocuments(filter),
      AdCampaign.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      campaigns: docs.map((d) =>
        serializeCampaign(d, { includeInternal: false }),
      ),
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("[admin/ads/campaigns GET]", error);
    return NextResponse.json(
      { message: "Failed to load campaigns" },
      { status: 500 },
    );
  }
}
