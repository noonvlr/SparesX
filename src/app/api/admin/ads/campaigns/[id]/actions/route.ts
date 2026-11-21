import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { AdCampaign } from "@/lib/models/AdCampaign";
import { serializeCampaign } from "@/lib/ads/serialize";
import {
  assertCanPublish,
  duplicateCampaign,
  hardDeleteOrArchive,
  parseObjectId,
} from "@/lib/ads/campaignMutations";
import { revalidatePromoCaches } from "@/lib/ads/revalidate";

type Ctx = { params: Promise<{ id: string }> };

const ACTIONS = [
  "publish",
  "pause",
  "activate",
  "archive",
  "duplicate",
] as const;

type Action = (typeof ACTIONS)[number];

/**
 * POST { action: publish|pause|activate|archive|duplicate }
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await ctx.params;
    if (!parseObjectId(id)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }
    const body = await req.json().catch(() => null);
    const action = String(body?.action || "") as Action;
    if (!(ACTIONS as readonly string[]).includes(action)) {
      return NextResponse.json(
        { message: "action must be publish|pause|activate|archive|duplicate" },
        { status: 400 },
      );
    }

    await connectDB();
    const doc = await AdCampaign.findById(id);
    if (!doc) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }

    const adminOid = new mongoose.Types.ObjectId(admin.id);

    const placementKeys = [
      ...new Set([
        ...(doc.placementKeys || []),
        ...doc.creatives.map((c) => c.placementKey),
      ]),
    ];

    if (action === "duplicate") {
      const copy = await duplicateCampaign(doc, admin.id);
      return NextResponse.json(
        {
          message: "Campaign duplicated",
          campaign: serializeCampaign(copy.toObject(), { includeInternal: true }),
        },
        { status: 201 },
      );
    }

    if (action === "archive") {
      const result = await hardDeleteOrArchive(doc, admin.id);
      revalidatePromoCaches(placementKeys);
      if (result.action === "deleted") {
        return NextResponse.json({
          message: "Draft campaign deleted",
          action: "deleted",
        });
      }
      return NextResponse.json({
        message: "Campaign archived",
        action: "archived",
        campaign: serializeCampaign(doc.toObject(), { includeInternal: true }),
      });
    }

    if (action === "publish") {
      const err = await assertCanPublish(doc);
      if (err) {
        return NextResponse.json({ message: err }, { status: 400 });
      }
      doc.status = "active";
      doc.updatedBy = adminOid;
      await doc.save();
      revalidatePromoCaches(placementKeys);
      return NextResponse.json({
        message: "Campaign published",
        campaign: serializeCampaign(doc.toObject(), { includeInternal: true }),
      });
    }

    if (action === "pause") {
      if (doc.status !== "active") {
        return NextResponse.json(
          { message: "Only active campaigns can be paused" },
          { status: 400 },
        );
      }
      doc.status = "paused";
      doc.updatedBy = adminOid;
      await doc.save();
      revalidatePromoCaches(placementKeys);
      return NextResponse.json({
        message: "Campaign paused",
        campaign: serializeCampaign(doc.toObject(), { includeInternal: true }),
      });
    }

    // activate (resume)
    if (doc.status !== "paused" && doc.status !== "draft") {
      return NextResponse.json(
        { message: "Only paused or draft campaigns can be activated" },
        { status: 400 },
      );
    }
    const err = await assertCanPublish(doc);
    if (err) {
      return NextResponse.json({ message: err }, { status: 400 });
    }
    doc.status = "active";
    doc.updatedBy = adminOid;
    await doc.save();
    revalidatePromoCaches(placementKeys);
    return NextResponse.json({
      message: "Campaign activated",
      campaign: serializeCampaign(doc.toObject(), { includeInternal: true }),
    });
  } catch (error) {
    console.error("[admin/ads/campaigns/[id]/actions POST]", error);
    return NextResponse.json(
      { message: "Failed to run campaign action" },
      { status: 500 },
    );
  }
}
