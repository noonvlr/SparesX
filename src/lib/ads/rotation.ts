/** Client-safe promo selection helpers (no Node / Next cache imports). */

export type PublicPromoCreative = {
  url: string;
  width: number;
  height: number;
  altText: string;
};

export type PublicPromoItem = {
  campaignId: string;
  placementKey: string;
  priority: number;
  advertiserType: "paid" | "house";
  destinationLabel: string;
  startDate: string;
  endDate: string;
  token: string;
  desktop: PublicPromoCreative | null;
  mobile: PublicPromoCreative | null;
};

export type EligibleAdsPayload = {
  placementKey: string;
  maxSlots: number;
  fallbackToHouseAds: boolean;
  aspectDesktop: { width: number; height: number };
  aspectMobile: { width: number; height: number } | null;
  items: PublicPromoItem[];
  fetchedAt: string;
};

export function pickWeightedPromos<T extends { priority: number }>(
  items: T[],
  maxSlots: number,
  rng: () => number = Math.random,
): T[] {
  if (maxSlots <= 0 || items.length === 0) return [];
  const pool = [...items];
  const picked: T[] = [];
  const n = Math.min(maxSlots, pool.length);

  for (let i = 0; i < n; i++) {
    const total = pool.reduce(
      (sum, item) => sum + Math.max(1, item.priority),
      0,
    );
    let r = rng() * total;
    let idx = 0;
    for (let j = 0; j < pool.length; j++) {
      r -= Math.max(1, pool[j].priority);
      if (r <= 0) {
        idx = j;
        break;
      }
      idx = j;
    }
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

export function filterStillLive(
  items: PublicPromoItem[],
  now: Date = new Date(),
): PublicPromoItem[] {
  const t = now.getTime();
  return items.filter((item) => {
    const start = Date.parse(item.startDate);
    const end = Date.parse(item.endDate);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
    return t >= start && t < end && Boolean(item.desktop?.url);
  });
}

export function applyHouseFallback(
  items: PublicPromoItem[],
  fallbackToHouseAds: boolean,
): PublicPromoItem[] {
  const paid = items.filter((i) => i.advertiserType === "paid");
  if (paid.length > 0) return paid;
  if (fallbackToHouseAds) {
    return items.filter((i) => i.advertiserType === "house");
  }
  return [];
}
