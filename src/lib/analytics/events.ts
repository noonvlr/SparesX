import { connectDB } from "@/lib/db/connect";
import {
  MarketplaceEvent,
  type MarketplaceEventType,
} from "@/lib/models/MarketplaceEvent";

function utcDay(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function clean(value: unknown, max = 80): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed || undefined;
}

/**
 * Fire-and-forget funnel event. Never throws to callers.
 * Do not pass emails, phones, OTPs, or WhatsApp numbers in meta.
 */
export async function trackMarketplaceEvent(params: {
  type: MarketplaceEventType;
  productId?: string;
  brand?: string;
  partType?: string;
  deviceModel?: string;
  city?: string;
  query?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await connectDB();
    await MarketplaceEvent.create({
      type: params.type,
      day: utcDay(),
      productId: clean(params.productId, 40),
      brand: clean(params.brand),
      partType: clean(params.partType),
      deviceModel: clean(params.deviceModel, 120),
      city: clean(params.city),
      query: clean(params.query, 120),
      meta: params.meta,
    });
  } catch (err) {
    console.warn("[analytics] track failed:", err);
  }
}

export type DemandGapRow = {
  brand: string;
  partType: string;
  deviceModel?: string;
  requests: number;
  listings: number;
  searches: number;
  gap: number;
};

/**
 * High-demand / low-supply rollup for seller opportunity UI.
 * Aggregated only — no requester identity.
 */
export async function getDemandSupplyGaps(limit = 12): Promise<DemandGapRow[]> {
  await connectDB();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sinceDay = since.toISOString().slice(0, 10);

  const [requestAgg, searchAgg, listingAgg] = await Promise.all([
    MarketplaceEvent.aggregate([
      {
        $match: {
          type: "request_created",
          day: { $gte: sinceDay },
          brand: { $exists: true, $ne: "" },
          partType: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: {
            brand: "$brand",
            partType: "$partType",
            deviceModel: "$deviceModel",
          },
          requests: { $sum: 1 },
        },
      },
    ]),
    MarketplaceEvent.aggregate([
      {
        $match: {
          type: "search",
          day: { $gte: sinceDay },
          brand: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: {
            brand: "$brand",
            partType: "$partType",
            deviceModel: "$deviceModel",
          },
          searches: { $sum: 1 },
        },
      },
    ]),
    (async () => {
      const { Product } = await import("@/lib/models/Product");
      return Product.aggregate([
        { $match: { status: "approved" } },
        {
          $group: {
            _id: {
              brand: { $toLower: { $ifNull: ["$brand", ""] } },
              partType: {
                $toLower: {
                  $ifNull: ["$partType", { $ifNull: ["$category", ""] }],
                },
              },
              deviceModel: { $toLower: { $ifNull: ["$deviceModel", ""] } },
            },
            listings: { $sum: 1 },
          },
        },
      ]);
    })(),
  ]);

  const listingMap = new Map<string, number>();
  for (const row of listingAgg) {
    const key = `${row._id.brand}|${row._id.partType}|${row._id.deviceModel || ""}`;
    listingMap.set(key, row.listings || 0);
  }

  const searchMap = new Map<string, number>();
  for (const row of searchAgg) {
    const brand = String(row._id.brand || "").toLowerCase();
    const partType = String(row._id.partType || "").toLowerCase();
    const deviceModel = String(row._id.deviceModel || "").toLowerCase();
    searchMap.set(`${brand}|${partType}|${deviceModel}`, row.searches || 0);
  }

  const rows: DemandGapRow[] = [];
  for (const row of requestAgg) {
    const brand = String(row._id.brand || "");
    const partType = String(row._id.partType || "");
    const deviceModel = String(row._id.deviceModel || "");
    const key = `${brand.toLowerCase()}|${partType.toLowerCase()}|${deviceModel.toLowerCase()}`;
    const listings = listingMap.get(key) || 0;
    const searches = searchMap.get(key) || 0;
    const requests = row.requests || 0;
    rows.push({
      brand,
      partType,
      deviceModel: deviceModel || undefined,
      requests,
      listings,
      searches,
      gap: requests + Math.floor(searches / 3) - listings,
    });
  }

  rows.sort((a, b) => b.gap - a.gap || b.requests - a.requests);
  return rows.filter((r) => r.gap > 0 || r.requests >= 2).slice(0, limit);
}
