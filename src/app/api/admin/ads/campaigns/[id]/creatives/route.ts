import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { AdCampaign } from "@/lib/models/AdCampaign";
import { AdPlacement } from "@/lib/models/AdPlacement";
import { serializeCampaign } from "@/lib/ads/serialize";
import { parseObjectId } from "@/lib/ads/campaignMutations";
import { validateCreativeUpload } from "@/lib/ads/validateCreativeUpload";
import {
  deleteAdCreativeStorage,
  mimeToExt,
  storeAdCreative,
} from "@/lib/ads/blobStorage";
import { revalidatePromoCaches } from "@/lib/ads/revalidate";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST multipart: file, placementKey, device (desktop|mobile), optional altText
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await ctx.params;
    if (!parseObjectId(id)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const placementKey = String(form.get("placementKey") || "").trim();
    const device = String(form.get("device") || "").trim();
    const altTextRaw = String(form.get("altText") || "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "file is required" }, { status: 400 });
    }
    if (!placementKey) {
      return NextResponse.json(
        { message: "placementKey is required" },
        { status: 400 },
      );
    }
    if (device !== "desktop" && device !== "mobile") {
      return NextResponse.json(
        { message: "device must be desktop or mobile" },
        { status: 400 },
      );
    }

    await connectDB();
    const campaign = await AdCampaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }
    if (campaign.status === "archived") {
      return NextResponse.json(
        { message: "Archived campaigns cannot be edited" },
        { status: 400 },
      );
    }

    const placement = await AdPlacement.findOne({ key: placementKey }).lean();
    if (!placement) {
      return NextResponse.json(
        { message: "Placement not found" },
        { status: 404 },
      );
    }

    if (
      campaign.placementKeys?.length &&
      !campaign.placementKeys.includes(placementKey)
    ) {
      return NextResponse.json(
        { message: "Placement is not selected on this campaign" },
        { status: 400 },
      );
    }

    const required =
      device === "mobile" ? placement.mobile : placement.desktop;
    if (!required) {
      return NextResponse.json(
        {
          message: `Placement ${placement.name} does not support ${device} creatives`,
        },
        { status: 400 },
      );
    }

    const ab = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(ab));
    const label = `${device === "desktop" ? "Desktop" : "Mobile"} image for ${placement.name}`;
    const validated = await validateCreativeUpload({
      buffer,
      required,
      label,
    });
    if (!validated.ok) {
      return NextResponse.json({ message: validated.message }, { status: 400 });
    }

    const stored = await storeAdCreative({
      campaignId: String(campaign._id),
      placementKey,
      device,
      buffer: validated.buffer,
      contentType: validated.mime,
      ext: mimeToExt(validated.mime),
    });

    const existingIdx = campaign.creatives.findIndex(
      (c) => c.placementKey === placementKey && c.device === device,
    );
    if (existingIdx >= 0) {
      const old = campaign.creatives[existingIdx];
      await deleteAdCreativeStorage({
        url: old.url,
        blobPathname: old.blobPathname,
      });
    }

    const altText =
      altTextRaw ||
      (existingIdx >= 0 ? campaign.creatives[existingIdx].altText : "") ||
      campaign.name;

    const creative = {
      placementKey,
      device: device as "desktop" | "mobile",
      url: stored.url,
      blobPathname: stored.blobPathname,
      width: validated.width,
      height: validated.height,
      bytes: validated.bytes,
      mime: validated.mime,
      altText: altText.slice(0, 200),
    };

    if (existingIdx >= 0) {
      campaign.creatives[existingIdx] = creative;
    } else {
      campaign.creatives.push(creative);
    }

    if (!campaign.placementKeys.includes(placementKey)) {
      campaign.placementKeys.push(placementKey);
    }

    campaign.updatedBy = new mongoose.Types.ObjectId(admin.id);
    await campaign.save();
    revalidatePromoCaches([placementKey]);

    return NextResponse.json({
      creative,
      campaign: serializeCampaign(campaign.toObject(), { includeInternal: true }),
    });
  } catch (error) {
    console.error("[admin/ads/campaigns/[id]/creatives POST]", error);
    return NextResponse.json(
      { message: "Failed to upload creative" },
      { status: 500 },
    );
  }
}

/** DELETE ?placementKey=&device= — remove creative + blob */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await ctx.params;
    if (!parseObjectId(id)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }
    const { searchParams } = new URL(req.url);
    const placementKey = String(searchParams.get("placementKey") || "").trim();
    const device = String(searchParams.get("device") || "").trim();
    if (!placementKey || (device !== "desktop" && device !== "mobile")) {
      return NextResponse.json(
        { message: "placementKey and device are required" },
        { status: 400 },
      );
    }

    await connectDB();
    const campaign = await AdCampaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }

    const idx = campaign.creatives.findIndex(
      (c) => c.placementKey === placementKey && c.device === device,
    );
    if (idx < 0) {
      return NextResponse.json({ message: "Creative not found" }, { status: 404 });
    }

    const [removed] = campaign.creatives.splice(idx, 1);
    await deleteAdCreativeStorage({
      url: removed.url,
      blobPathname: removed.blobPathname,
    });
    campaign.updatedBy = new mongoose.Types.ObjectId(admin.id);
    await campaign.save();
    revalidatePromoCaches([placementKey]);

    return NextResponse.json({
      message: "Creative removed",
      campaign: serializeCampaign(campaign.toObject(), { includeInternal: true }),
    });
  } catch (error) {
    console.error("[admin/ads/campaigns/[id]/creatives DELETE]", error);
    return NextResponse.json(
      { message: "Failed to remove creative" },
      { status: 500 },
    );
  }
}
