import mongoose from "mongoose";
import { AdCampaign, type IAdCampaign } from "@/lib/models/AdCampaign";
import { AdPlacement } from "@/lib/models/AdPlacement";
import { AdEvent } from "@/lib/models/AdEvent";
import { validateDestinationUrl } from "@/lib/ads/destinationUrl";
import { istLocalToUtc } from "@/lib/ads/ist";
import { hasAllRequiredCreatives } from "@/lib/ads/creativeRequirements";
import {
  copyAdCreativeToCampaign,
  deleteAdCreativeStorage,
  mimeToExt,
} from "@/lib/ads/blobStorage";

export function parseObjectId(id: string): mongoose.Types.ObjectId | null {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

export async function loadPlacementsMap() {
  const rows = await AdPlacement.find().lean();
  return new Map(rows.map((p) => [p.key, p]));
}

export function parseScheduleFields(body: {
  startDate?: unknown;
  endDate?: unknown;
}): { startDate: Date | null; endDate: Date | null; error?: string } {
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (body.startDate != null && body.startDate !== "") {
    if (typeof body.startDate !== "string") {
      return { startDate: null, endDate: null, error: "Invalid startDate" };
    }
    startDate = istLocalToUtc(body.startDate);
    if (!startDate) {
      return { startDate: null, endDate: null, error: "Invalid startDate (use IST YYYY-MM-DDTHH:mm)" };
    }
  }

  if (body.endDate != null && body.endDate !== "") {
    if (typeof body.endDate !== "string") {
      return { startDate: null, endDate: null, error: "Invalid endDate" };
    }
    endDate = istLocalToUtc(body.endDate);
    if (!endDate) {
      return { startDate: null, endDate: null, error: "Invalid endDate (use IST YYYY-MM-DDTHH:mm)" };
    }
  }

  if (startDate && endDate && endDate.getTime() <= startDate.getTime()) {
    return {
      startDate,
      endDate,
      error: "End must be after start",
    };
  }

  return { startDate, endDate };
}

export async function assertCanPublish(
  campaign: IAdCampaign,
): Promise<string | null> {
  if (!campaign.destinationUrl) {
    return "Destination URL is required to publish";
  }
  const urlCheck = validateDestinationUrl(campaign.destinationUrl);
  if (!urlCheck.ok) return urlCheck.message;

  if (!campaign.startDate || !campaign.endDate) {
    return "Start and end dates are required to publish";
  }
  if (campaign.endDate.getTime() <= Date.now()) {
    return "Cannot publish with an end date in the past";
  }
  if (campaign.endDate.getTime() <= campaign.startDate.getTime()) {
    return "End must be after start";
  }

  const keys = campaign.placementKeys?.length
    ? campaign.placementKeys
    : [...new Set(campaign.creatives.map((c) => c.placementKey))];
  if (!keys.length) return "Select at least one placement";

  const map = await loadPlacementsMap();
  for (const key of keys) {
    if (!map.has(key)) return `Unknown placement: ${key}`;
  }

  if (
    !hasAllRequiredCreatives({
      placementKeys: keys,
      creatives: campaign.creatives,
      placementsByKey: map,
    })
  ) {
    return "Every selected placement needs valid creatives with alt text before publish";
  }

  return null;
}

export async function hardDeleteOrArchive(
  campaign: IAdCampaign,
  adminId: string,
): Promise<{ action: "deleted" | "archived" }> {
  const eventCount = await AdEvent.countDocuments({ campaignId: campaign._id });
  const canHardDelete = campaign.status === "draft" && eventCount === 0;

  if (canHardDelete) {
    for (const c of campaign.creatives) {
      await deleteAdCreativeStorage({
        url: c.url,
        blobPathname: c.blobPathname,
      });
    }
    await AdCampaign.deleteOne({ _id: campaign._id });
    return { action: "deleted" };
  }

  campaign.status = "archived";
  campaign.updatedBy = new mongoose.Types.ObjectId(adminId);
  await campaign.save();
  return { action: "archived" };
}

export async function duplicateCampaign(
  source: IAdCampaign,
  adminId: string,
): Promise<IAdCampaign> {
  const adminOid = new mongoose.Types.ObjectId(adminId);
  const created = await AdCampaign.create({
    name: `${source.name} (copy)`,
    advertiserName: source.advertiserName,
    advertiserType: source.advertiserType,
    description: source.description,
    destinationUrl: source.destinationUrl,
    ctaLabel: source.ctaLabel,
    internalNotes: source.internalNotes,
    placementKeys: [...(source.placementKeys || [])],
    creatives: [],
    startDate: source.startDate,
    endDate: source.endDate,
    priority: source.priority,
    status: "draft",
    createdBy: adminOid,
    updatedBy: adminOid,
  });

  const copied = [];
  for (const creative of source.creatives) {
    const stored = await copyAdCreativeToCampaign({
      sourceUrl: creative.url,
      sourcePathname: creative.blobPathname,
      campaignId: String(created._id),
      placementKey: creative.placementKey,
      device: creative.device,
      contentType: creative.mime,
      ext: mimeToExt(creative.mime),
    });
    copied.push({
      placementKey: creative.placementKey,
      device: creative.device,
      url: stored.url,
      blobPathname: stored.blobPathname,
      width: creative.width,
      height: creative.height,
      bytes: creative.bytes,
      mime: creative.mime,
      altText: creative.altText,
    });
  }

  created.creatives = copied;
  await created.save();
  return created;
}
