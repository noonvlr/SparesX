import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { AdCampaign } from "@/lib/models/AdCampaign";
import { AdPlacement } from "@/lib/models/AdPlacement";
import { istLocalToUtc } from "@/lib/ads/ist";
import { getEffectiveStatus } from "@/lib/ads/effectiveStatus";

/**
 * GET ?placementKey=&start=&end=
 * Non-blocking coverage hint: how many overlapping active-ish campaigns vs maxSlots.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { searchParams } = new URL(req.url);
    const placementKey = String(searchParams.get("placementKey") || "").trim();
    const startRaw = String(searchParams.get("start") || "").trim();
    const endRaw = String(searchParams.get("end") || "").trim();
    const excludeId = String(searchParams.get("excludeId") || "").trim();

    if (!placementKey) {
      return NextResponse.json(
        { message: "placementKey is required" },
        { status: 400 },
      );
    }

    await connectDB();
    const placement = await AdPlacement.findOne({ key: placementKey }).lean();
    if (!placement) {
      return NextResponse.json({ message: "Placement not found" }, { status: 404 });
    }

    const start = startRaw ? istLocalToUtc(startRaw) : null;
    const end = endRaw ? istLocalToUtc(endRaw) : null;

    const campaigns = await AdCampaign.find({
      status: { $in: ["active", "paused", "draft"] },
      $or: [
        { placementKeys: placementKey },
        { "creatives.placementKey": placementKey },
      ],
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select("name status startDate endDate priority")
      .lean();

    const now = new Date();
    const overlapping = campaigns.filter((c) => {
      const eff = getEffectiveStatus({
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        now,
      });
      if (eff === "archived" || eff === "expired") return false;
      if (!start || !end || !c.startDate || !c.endDate) {
        return c.status === "active" || c.status === "paused";
      }
      // Ranges overlap if start < otherEnd && end > otherStart
      return (
        start.getTime() < c.endDate.getTime() &&
        end.getTime() > c.startDate.getTime()
      );
    });

    const covering = overlapping.length;
    const full = covering >= placement.maxSlots;

    return NextResponse.json({
      placementKey,
      maxSlots: placement.maxSlots,
      overlappingCount: covering,
      fullyCovered: full,
      warning: full
        ? `maxSlots (${placement.maxSlots}) already covered by ${covering} overlapping campaign(s). You can still select this placement.`
        : null,
      overlapping: overlapping.map((c) => ({
        id: String(c._id),
        name: c.name,
        status: c.status,
      })),
    });
  } catch (error) {
    console.error("[admin/ads/placements/coverage GET]", error);
    return NextResponse.json(
      { message: "Failed to check coverage" },
      { status: 500 },
    );
  }
}
