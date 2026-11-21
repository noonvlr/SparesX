import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import {
  AD_ADVERTISER_TYPES,
  AdCampaign,
  isAdCampaignStatus,
  type AdAdvertiserType,
} from "@/lib/models/AdCampaign";
import { serializeCampaign } from "@/lib/ads/serialize";
import { validateDestinationUrl } from "@/lib/ads/destinationUrl";

/**
 * GET — paginated campaign list.
 * Query: page, limit, status, placement, advertiser, q
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
    const advertiser = (searchParams.get("advertiser") || "").trim();
    const q = (searchParams.get("q") || "").trim();

    const filter: Record<string, unknown> = {};
    if (status && isAdCampaignStatus(status)) {
      filter.status = status;
    }
    if (placement) {
      filter.$or = [
        { placementKeys: placement },
        { "creatives.placementKey": placement },
      ];
    }
    if (advertiser) {
      const escaped = advertiser.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.advertiserName = { $regex: escaped, $options: "i" };
    }
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const textClause = [
        { name: { $regex: escaped, $options: "i" } },
        { advertiserName: { $regex: escaped, $options: "i" } },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or as unknown[] }, { $or: textClause }];
        delete filter.$or;
      } else {
        filter.$or = textClause;
      }
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

/**
 * POST — create draft campaign from Step 1 details (D10).
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    }

    const name = String(body.name || "").trim();
    const advertiserName = String(body.advertiserName || "").trim();
    const advertiserType = String(body.advertiserType || "paid") as AdAdvertiserType;
    const description = String(body.description || "").trim();
    const destinationUrlRaw = String(body.destinationUrl || "").trim();
    const ctaLabel = String(body.ctaLabel || "").trim();
    const internalNotes = String(body.internalNotes || "").trim();

    if (!name || name.length > 160) {
      return NextResponse.json(
        { message: "Name is required (max 160 chars)" },
        { status: 400 },
      );
    }
    if (!advertiserName || advertiserName.length > 160) {
      return NextResponse.json(
        { message: "Advertiser name is required (max 160 chars)" },
        { status: 400 },
      );
    }
    if (!(AD_ADVERTISER_TYPES as readonly string[]).includes(advertiserType)) {
      return NextResponse.json(
        { message: "advertiserType must be paid or house" },
        { status: 400 },
      );
    }

    let destinationUrl = "";
    if (destinationUrlRaw) {
      const check = validateDestinationUrl(destinationUrlRaw);
      if (!check.ok) {
        return NextResponse.json({ message: check.message }, { status: 400 });
      }
      destinationUrl = check.url;
    }

    await connectDB();
    const adminOid = new mongoose.Types.ObjectId(admin.id);
    const doc = await AdCampaign.create({
      name,
      advertiserName,
      advertiserType,
      description,
      destinationUrl,
      ctaLabel,
      internalNotes,
      placementKeys: [],
      creatives: [],
      startDate: null,
      endDate: null,
      priority: 3,
      status: "draft",
      createdBy: adminOid,
      updatedBy: adminOid,
    });

    return NextResponse.json(
      { campaign: serializeCampaign(doc.toObject(), { includeInternal: true }) },
      { status: 201 },
    );
  } catch (error) {
    console.error("[admin/ads/campaigns POST]", error);
    return NextResponse.json(
      { message: "Failed to create campaign" },
      { status: 500 },
    );
  }
}
