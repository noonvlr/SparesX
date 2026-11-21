import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import {
  AD_ADVERTISER_TYPES,
  AdCampaign,
  type AdAdvertiserType,
} from "@/lib/models/AdCampaign";
import { AdPlacement } from "@/lib/models/AdPlacement";
import { serializeCampaign } from "@/lib/ads/serialize";
import { validateDestinationUrl } from "@/lib/ads/destinationUrl";
import {
  annotateCreativesNeedsUpdate,
  hasAllRequiredCreatives,
} from "@/lib/ads/creativeRequirements";
import {
  hardDeleteOrArchive,
  parseObjectId,
  parseScheduleFields,
} from "@/lib/ads/campaignMutations";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await ctx.params;
    if (!parseObjectId(id)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const doc = await AdCampaign.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }

    const placements = await AdPlacement.find().lean();
    const map = new Map(placements.map((p) => [p.key, p]));
    const creatives = annotateCreativesNeedsUpdate(doc.creatives, map);
    const placementKeys = [
      ...new Set([
        ...(doc.placementKeys || []),
        ...doc.creatives.map((c) => c.placementKey),
      ]),
    ];

    return NextResponse.json({
      campaign: {
        ...serializeCampaign(doc, { includeInternal: true }),
        creatives,
        placementKeys,
        publishReady: hasAllRequiredCreatives({
          placementKeys,
          creatives: doc.creatives,
          placementsByKey: map,
        }),
      },
      placements: placements.map((p) => ({
        key: p.key,
        name: p.name,
        pageLocation: p.pageLocation,
        desktop: p.desktop,
        mobile: p.mobile,
        enabled: p.enabled,
        maxSlots: p.maxSlots,
        supportedDevices: p.supportedDevices,
      })),
    });
  } catch (error) {
    console.error("[admin/ads/campaigns/[id] GET]", error);
    return NextResponse.json(
      { message: "Failed to load campaign" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await ctx.params;
    if (!parseObjectId(id)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    }

    await connectDB();
    const doc = await AdCampaign.findById(id);
    if (!doc) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }
    if (doc.status === "archived") {
      return NextResponse.json(
        { message: "Archived campaigns cannot be edited" },
        { status: 400 },
      );
    }

    if (body.name != null) {
      const name = String(body.name).trim();
      if (!name || name.length > 160) {
        return NextResponse.json({ message: "Invalid name" }, { status: 400 });
      }
      doc.name = name;
    }
    if (body.advertiserName != null) {
      const advertiserName = String(body.advertiserName).trim();
      if (!advertiserName || advertiserName.length > 160) {
        return NextResponse.json(
          { message: "Invalid advertiserName" },
          { status: 400 },
        );
      }
      doc.advertiserName = advertiserName;
    }
    if (body.advertiserType != null) {
      const t = String(body.advertiserType) as AdAdvertiserType;
      if (!(AD_ADVERTISER_TYPES as readonly string[]).includes(t)) {
        return NextResponse.json(
          { message: "advertiserType must be paid or house" },
          { status: 400 },
        );
      }
      doc.advertiserType = t;
    }
    if (body.description != null) {
      doc.description = String(body.description).trim().slice(0, 2000);
    }
    if (body.ctaLabel != null) {
      doc.ctaLabel = String(body.ctaLabel).trim().slice(0, 80);
    }
    if (body.internalNotes != null) {
      doc.internalNotes = String(body.internalNotes).trim().slice(0, 4000);
    }
    if (body.destinationUrl != null) {
      const raw = String(body.destinationUrl).trim();
      if (!raw) {
        doc.destinationUrl = "";
      } else {
        const check = validateDestinationUrl(raw);
        if (!check.ok) {
          return NextResponse.json({ message: check.message }, { status: 400 });
        }
        doc.destinationUrl = check.url;
      }
    }

    if (body.placementKeys != null) {
      if (!Array.isArray(body.placementKeys)) {
        return NextResponse.json(
          { message: "placementKeys must be an array" },
          { status: 400 },
        );
      }
      const rawKeys = body.placementKeys as unknown[];
      const keys = [
        ...new Set(
          rawKeys
            .map((k) => String(k).trim())
            .filter((k): k is string => k.length > 0),
        ),
      ];
      const known = await AdPlacement.find({ key: { $in: keys } })
        .select("key")
        .lean();
      const knownSet = new Set(known.map((k) => k.key));
      for (const key of keys) {
        if (!knownSet.has(key)) {
          return NextResponse.json(
            { message: `Unknown placement: ${key}` },
            { status: 400 },
          );
        }
      }
      doc.placementKeys = keys;
      // Drop creatives for deselected placements
      const removed = doc.creatives.filter((c) => !keys.includes(c.placementKey));
      doc.creatives = doc.creatives.filter((c) => keys.includes(c.placementKey));
      const { deleteAdCreativeStorage } = await import("@/lib/ads/blobStorage");
      for (const c of removed) {
        await deleteAdCreativeStorage({
          url: c.url,
          blobPathname: c.blobPathname,
        });
      }
    }

    if (body.priority != null) {
      const priority = Number(body.priority);
      if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
        return NextResponse.json(
          { message: "priority must be an integer 1–5" },
          { status: 400 },
        );
      }
      doc.priority = priority;
    }

    if (body.startDate !== undefined || body.endDate !== undefined) {
      let startDate = doc.startDate;
      let endDate = doc.endDate;
      if (body.startDate !== undefined) {
        if (body.startDate === null || body.startDate === "") {
          startDate = null;
        } else {
          const p = parseScheduleFields({ startDate: body.startDate });
          if (p.error) {
            return NextResponse.json({ message: p.error }, { status: 400 });
          }
          startDate = p.startDate;
        }
      }
      if (body.endDate !== undefined) {
        if (body.endDate === null || body.endDate === "") {
          endDate = null;
        } else {
          const p = parseScheduleFields({ endDate: body.endDate });
          if (p.error) {
            return NextResponse.json({ message: p.error }, { status: 400 });
          }
          endDate = p.endDate;
        }
      }
      if (startDate && endDate && endDate.getTime() <= startDate.getTime()) {
        return NextResponse.json(
          { message: "End must be after start" },
          { status: 400 },
        );
      }
      doc.startDate = startDate;
      doc.endDate = endDate;
    }

    if (Array.isArray(body.creativeAltUpdates)) {
      for (const row of body.creativeAltUpdates as Array<{
        placementKey?: string;
        device?: string;
        altText?: string;
      }>) {
        const placementKey = String(row.placementKey || "");
        const device = String(row.device || "");
        const altText = String(row.altText || "").trim();
        if (!placementKey || (device !== "desktop" && device !== "mobile")) continue;
        const creative = doc.creatives.find(
          (c) => c.placementKey === placementKey && c.device === device,
        );
        if (creative && altText) {
          creative.altText = altText.slice(0, 200);
        }
      }
    }

    doc.updatedBy = new mongoose.Types.ObjectId(admin.id);
    await doc.save();

    return NextResponse.json({
      campaign: serializeCampaign(doc.toObject(), { includeInternal: true }),
    });
  } catch (error) {
    console.error("[admin/ads/campaigns/[id] PATCH]", error);
    return NextResponse.json(
      { message: "Failed to update campaign" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await ctx.params;
    if (!parseObjectId(id)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const doc = await AdCampaign.findById(id);
    if (!doc) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }

    const result = await hardDeleteOrArchive(doc, admin.id);
    return NextResponse.json({
      message:
        result.action === "deleted"
          ? "Draft campaign deleted"
          : "Campaign archived",
      action: result.action,
    });
  } catch (error) {
    console.error("[admin/ads/campaigns/[id] DELETE]", error);
    return NextResponse.json(
      { message: "Failed to delete campaign" },
      { status: 500 },
    );
  }
}
