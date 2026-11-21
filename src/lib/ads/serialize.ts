import type { IAdPlacement } from "@/lib/models/AdPlacement";
import type { IAdCampaign } from "@/lib/models/AdCampaign";
import { getEffectiveStatus } from "@/lib/ads/effectiveStatus";
import { aspectRatioLabel } from "@/lib/ads/dimensions";

type LeanPlacement = Pick<
  IAdPlacement,
  | "key"
  | "name"
  | "description"
  | "pageLocation"
  | "desktop"
  | "mobile"
  | "supportedDevices"
  | "enabled"
  | "maxSlots"
  | "fallbackToHouseAds"
  | "createdAt"
  | "updatedAt"
> & { _id: { toString(): string } };

export function serializePlacement(doc: LeanPlacement) {
  return {
    id: String(doc._id),
    key: doc.key,
    name: doc.name,
    description: doc.description,
    pageLocation: doc.pageLocation,
    desktop: doc.desktop,
    mobile: doc.mobile,
    desktopAspect: aspectRatioLabel(doc.desktop),
    mobileAspect: doc.mobile ? aspectRatioLabel(doc.mobile) : null,
    supportedDevices: doc.supportedDevices,
    enabled: doc.enabled,
    maxSlots: doc.maxSlots,
    fallbackToHouseAds: doc.fallbackToHouseAds,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

type LeanCampaign = Pick<
  IAdCampaign,
  | "name"
  | "advertiserName"
  | "advertiserType"
  | "description"
  | "destinationUrl"
  | "ctaLabel"
  | "internalNotes"
  | "placementKeys"
  | "creatives"
  | "startDate"
  | "endDate"
  | "priority"
  | "status"
  | "createdAt"
  | "updatedAt"
> & { _id: { toString(): string } };

export function serializeCampaign(
  doc: LeanCampaign,
  opts?: { now?: Date; includeInternal?: boolean },
) {
  const effectiveStatus = getEffectiveStatus({
    status: doc.status,
    startDate: doc.startDate,
    endDate: doc.endDate,
    now: opts?.now,
  });

  const base = {
    id: String(doc._id),
    name: doc.name,
    advertiserName: doc.advertiserName,
    advertiserType: doc.advertiserType,
    description: doc.description,
    destinationUrl: doc.destinationUrl,
    ctaLabel: doc.ctaLabel,
    creatives: doc.creatives,
    startDate: doc.startDate,
    endDate: doc.endDate,
    priority: doc.priority,
    status: doc.status,
    effectiveStatus,
    placementKeys: [
      ...new Set([
        ...(Array.isArray(doc.placementKeys) ? doc.placementKeys : []),
        ...doc.creatives.map((c) => c.placementKey),
      ]),
    ],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  if (opts?.includeInternal) {
    return { ...base, internalNotes: doc.internalNotes };
  }
  return base;
}
