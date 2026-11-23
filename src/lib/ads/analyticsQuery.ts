import mongoose from "mongoose";
import { AdDailyStat } from "@/lib/models/AdDailyStat";
import { AdCampaign } from "@/lib/models/AdCampaign";
import { AdPlacement } from "@/lib/models/AdPlacement";
import { formatCtr } from "@/lib/ads/ctr";
import { istDay, istLocalToUtc } from "@/lib/ads/ist";

export type AnalyticsFilters = {
  fromIst?: string;
  toIst?: string;
  campaignId?: string;
  placementKey?: string;
  device?: "desktop" | "mobile" | "";
};

function defaultRange(): { from: string; to: string } {
  const to = istDay(new Date());
  const fromDate = istLocalToUtc(`${to}T00:00`);
  if (!fromDate) return { from: to, to };
  const start = new Date(fromDate.getTime() - 13 * 24 * 60 * 60 * 1000);
  return { from: istDay(start), to };
}

export async function queryPromoAnalytics(filters: AnalyticsFilters) {
  const range = defaultRange();
  const from = filters.fromIst && /^\d{4}-\d{2}-\d{2}$/.test(filters.fromIst)
    ? filters.fromIst
    : range.from;
  const to = filters.toIst && /^\d{4}-\d{2}-\d{2}$/.test(filters.toIst)
    ? filters.toIst
    : range.to;

  const match: Record<string, unknown> = {
    istDate: { $gte: from, $lte: to },
  };
  if (filters.campaignId && mongoose.Types.ObjectId.isValid(filters.campaignId)) {
    match.campaignId = new mongoose.Types.ObjectId(filters.campaignId);
  }
  if (filters.placementKey) {
    match.placementKey = filters.placementKey;
  }
  if (filters.device === "desktop" || filters.device === "mobile") {
    match.device = filters.device;
  }

  const rows = await AdDailyStat.find(match).lean();

  let impressions = 0;
  let clicks = 0;
  const byDay = new Map<string, { impressions: number; clicks: number }>();
  const byCampaign = new Map<
    string,
    { impressions: number; clicks: number }
  >();
  const byPlacement = new Map<
    string,
    { impressions: number; clicks: number }
  >();
  const byDevice = {
    desktop: { impressions: 0, clicks: 0 },
    mobile: { impressions: 0, clicks: 0 },
  };

  for (const row of rows) {
    impressions += row.impressions;
    clicks += row.clicks;

    const day = byDay.get(row.istDate) || { impressions: 0, clicks: 0 };
    day.impressions += row.impressions;
    day.clicks += row.clicks;
    byDay.set(row.istDate, day);

    const cid = String(row.campaignId);
    const camp = byCampaign.get(cid) || { impressions: 0, clicks: 0 };
    camp.impressions += row.impressions;
    camp.clicks += row.clicks;
    byCampaign.set(cid, camp);

    const place =
      byPlacement.get(row.placementKey) || { impressions: 0, clicks: 0 };
    place.impressions += row.impressions;
    place.clicks += row.clicks;
    byPlacement.set(row.placementKey, place);

    if (row.device === "desktop" || row.device === "mobile") {
      byDevice[row.device].impressions += row.impressions;
      byDevice[row.device].clicks += row.clicks;
    }
  }

  const campaignIds = [...byCampaign.keys()];
  const campaigns = campaignIds.length
    ? await AdCampaign.find({ _id: { $in: campaignIds } })
        .select("name advertiserName")
        .lean()
    : [];
  const campaignName = new Map(
    campaigns.map((c) => [String(c._id), c.name as string]),
  );
  const advertiserName = new Map(
    campaigns.map((c) => [String(c._id), c.advertiserName as string]),
  );

  const placements = await AdPlacement.find()
    .select("key name")
    .lean();
  const placementName = new Map(placements.map((p) => [p.key, p.name]));

  const daily = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([istDate, v]) => ({
      istDate,
      impressions: v.impressions,
      clicks: v.clicks,
      ctr: formatCtr(v.impressions, v.clicks),
    }));

  return {
    range: { from, to },
    totals: {
      impressions,
      clicks,
      ctr: formatCtr(impressions, clicks),
    },
    daily,
    byDevice: {
      desktop: {
        ...byDevice.desktop,
        ctr: formatCtr(byDevice.desktop.impressions, byDevice.desktop.clicks),
      },
      mobile: {
        ...byDevice.mobile,
        ctr: formatCtr(byDevice.mobile.impressions, byDevice.mobile.clicks),
      },
    },
    campaigns: [...byCampaign.entries()]
      .map(([id, v]) => ({
        campaignId: id,
        name: campaignName.get(id) || id,
        advertiserName: advertiserName.get(id) || "",
        impressions: v.impressions,
        clicks: v.clicks,
        ctr: formatCtr(v.impressions, v.clicks),
      }))
      .sort((a, b) => b.impressions - a.impressions),
    placements: [...byPlacement.entries()]
      .map(([key, v]) => ({
        placementKey: key,
        name: placementName.get(key) || key,
        impressions: v.impressions,
        clicks: v.clicks,
        ctr: formatCtr(v.impressions, v.clicks),
      }))
      .sort((a, b) => b.impressions - a.impressions),
  };
}
