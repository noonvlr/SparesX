import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db/connect";
import { AdCampaign } from "@/lib/models/AdCampaign";
import { AdPlacement } from "@/lib/models/AdPlacement";
import { getEffectiveStatus } from "@/lib/ads/effectiveStatus";
import {
  creativeNeedsUpdate,
  placementNeedsMobile,
} from "@/lib/ads/creativeRequirements";
import { signPromoToken } from "@/lib/ads/token";
import type {
  EligibleAdsPayload,
  PublicPromoCreative,
  PublicPromoItem,
} from "@/lib/ads/rotation";

export type {
  EligibleAdsPayload,
  PublicPromoCreative,
  PublicPromoItem,
} from "@/lib/ads/rotation";

export {
  applyHouseFallback,
  filterStillLive,
  pickWeightedPromos,
} from "@/lib/ads/rotation";

function creativePayload(
  c:
    | {
        url: string;
        width: number;
        height: number;
        altText: string;
      }
    | undefined,
): PublicPromoCreative | null {
  if (!c?.url) return null;
  return {
    url: c.url,
    width: c.width,
    height: c.height,
    altText: c.altText || "Sponsored",
  };
}

async function loadEligibleAdsUncached(
  placementKey: string,
): Promise<EligibleAdsPayload | null> {
  await connectDB();

  const placement = await AdPlacement.findOne({ key: placementKey }).lean();
  if (!placement || !placement.enabled) {
    return null;
  }

  const now = new Date();
  const campaigns = await AdCampaign.find({
    status: "active",
    $or: [
      { placementKeys: placementKey },
      { "creatives.placementKey": placementKey },
    ],
    startDate: { $lte: now },
    endDate: { $gt: now },
  })
    .select(
      "name advertiserType ctaLabel creatives placementKeys startDate endDate priority status",
    )
    .lean();

  const items: PublicPromoItem[] = [];

  for (const campaign of campaigns) {
    const keys = [
      ...new Set([
        ...(campaign.placementKeys || []),
        ...campaign.creatives.map((c) => c.placementKey),
      ]),
    ];
    if (!keys.includes(placementKey)) continue;

    const desktopRaw = campaign.creatives.find(
      (c) => c.placementKey === placementKey && c.device === "desktop",
    );
    const mobileRaw = campaign.creatives.find(
      (c) => c.placementKey === placementKey && c.device === "mobile",
    );

    if (!desktopRaw?.url || !desktopRaw.altText?.trim()) continue;
    if (creativeNeedsUpdate(desktopRaw, placement)) continue;

    if (placementNeedsMobile(placement)) {
      if (!mobileRaw?.url || !mobileRaw.altText?.trim()) continue;
      if (creativeNeedsUpdate(mobileRaw, placement)) continue;
    }

    const eff = getEffectiveStatus({
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      now,
      placementEnabled: true,
      hasRequiredCreatives: true,
    });
    if (eff !== "live") continue;

    const campaignId = String(campaign._id);
    items.push({
      campaignId,
      placementKey,
      priority: campaign.priority || 1,
      advertiserType: campaign.advertiserType,
      destinationLabel:
        (campaign.ctaLabel || "").trim() ||
        campaign.name ||
        "Sponsored offer",
      startDate: campaign.startDate!.toISOString(),
      endDate: campaign.endDate!.toISOString(),
      token: signPromoToken({ campaignId, placementKey }),
      desktop: creativePayload(desktopRaw),
      mobile: placementNeedsMobile(placement)
        ? creativePayload(mobileRaw)
        : null,
    });
  }

  return {
    placementKey,
    maxSlots: placement.maxSlots,
    fallbackToHouseAds: placement.fallbackToHouseAds,
    aspectDesktop: {
      width: placement.desktop.width,
      height: placement.desktop.height,
    },
    aspectMobile: placement.mobile
      ? { width: placement.mobile.width, height: placement.mobile.height }
      : null,
    items,
    fetchedAt: now.toISOString(),
  };
}

export function promoPlacementTag(placementKey: string): string {
  return `promo:placement:${placementKey}`;
}

export const PROMO_ALL_TAG = "promo:all";

/** Cached eligible list (~60s). Client still re-checks dates + rotates. */
export async function getEligibleAds(
  placementKey: string,
): Promise<EligibleAdsPayload | null> {
  const cached = unstable_cache(
    () => loadEligibleAdsUncached(placementKey),
    [`promo-eligible-v1`, placementKey],
    {
      revalidate: 60,
      tags: [PROMO_ALL_TAG, promoPlacementTag(placementKey)],
    },
  );
  return cached();
}
